// The background of the add-on. It owns the bookmark file, which it keeps in
// storage.local as the text of an sbm file, and it syncs that file with an
// sbm-sync server (https://github.com/equwal/sbm-sync). The popup and the
// options page ask it through messages, so all changes happen here, one at a
// time.
"use strict";

// Chrome runs this file as a service worker; Firefox loads the libraries
// through the manifest.
if (typeof importScripts === "function") importScripts("lib/tsv.js", "lib/fuzzy.js");

const api = globalThis.browser ?? globalThis.chrome;
const DEFAULT_SERVER = "https://sbm.subread.space";
const SYNC_MINUTES = 30;

// One change at a time: each job starts when the one before it ends.
let queue = Promise.resolve();
function serial(job) {
  const run = queue.then(job);
  queue = run.catch(() => {});
  return run;
}

async function state() {
  const s = await api.storage.local.get(["text", "version", "server", "token", "email", "synced", "error"]);
  return { text: "", version: "", server: DEFAULT_SERVER, ...s };
}

/**
 * Send the file with the name of the version that the server gave last
 * time. The server merges, and the merged file comes back.
 */
async function syncNow() {
  const s = await state();
  if (!s.token) return s;
  let r;
  try {
    r = await fetch(s.server + "/api/sync?base=" + encodeURIComponent(s.version), {
      method: "POST",
      headers: { Authorization: "Bearer " + s.token, "Content-Type": "text/plain; charset=utf-8" },
      body: s.text,
    });
  } catch (e) {
    await api.storage.local.set({ error: "Cannot reach " + new URL(s.server).host + "." });
    return state();
  }
  const body = await r.text();
  if (r.status === 401) {
    await api.storage.local.remove(["token", "version"]);
    await api.storage.local.set({ error: "Sign in again: see the options." });
  } else if (!r.ok) {
    await api.storage.local.set({ error: body.trim() || "The server answered " + r.status + "." });
  } else {
    const version = r.headers.get("Sbm-Version");
    if (!version) throw new Error("The server gave no version.");
    await api.storage.local.set({ text: body, version, synced: Date.now(), error: "" });
  }
  return state();
}

async function signIn(server, email, password) {
  server = server.trim().replace(/\/+$/, "");
  if (!server.includes("://")) server = "https://" + server;
  const r = await fetch(server + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email: email.trim(), password }),
  });
  const body = await r.text();
  if (r.status === 401) throw new Error("Wrong email or password.");
  if (!r.ok) throw new Error(body.trim() || "The server answered " + r.status + ".");
  // A new account starts from no version: the first sync is a union.
  await api.storage.local.set({ server, email: email.trim(), token: body.trim(), version: "", error: "" });
  return syncNow();
}

async function signOut() {
  const s = await state();
  await api.storage.local.remove(["token", "version", "synced", "error"]);
  if (s.token) {
    fetch(s.server + "/api/logout", { method: "POST", headers: { Authorization: "Bearer " + s.token } })
      .catch(() => {}); // the token stays valid on the server; nothing else is lost
  }
  return state();
}

/** Add a bookmark at the end of the file. With the same page there already, return that bookmark. */
async function add(b) {
  const s = await state();
  const existing = Tsv.find(Tsv.parse(s.text), b.url);
  if (existing) return { existing };
  await api.storage.local.set({ text: s.text + Tsv.appendix(s.text, Tsv.format(b)) });
  if (s.token) await syncNow();
  return { added: true };
}

api.runtime.onMessage.addListener((msg, sender, reply) => {
  const jobs = {
    sync: () => syncNow(),
    signIn: () => signIn(msg.server, msg.email, msg.password),
    signOut: () => signOut(),
    add: () => add(msg.bookmark),
  };
  const job = jobs[msg.type];
  if (!job) return false;
  serial(job).then(
    (value) => reply({ value }),
    (e) => reply({ error: e.message }),
  );
  return true; // reply comes later
});

// ---- the address bar: type "bm", a space, then words ----

function escapeXml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
}

async function matches(text) {
  const all = Tsv.parse((await state()).text).reverse(); // newest first
  return Fuzzy.filter(all, text, (b) => b.desc + " " + b.tags.join(" ") + " " + b.url);
}

api.omnibox.setDefaultSuggestion({ description: "Search your sbm bookmarks" });

api.omnibox.onInputChanged.addListener(async (text, suggest) => {
  // Chrome shows the description as XML; Firefox shows it as text.
  const xml = typeof browser === "undefined";
  suggest((await matches(text)).slice(0, 6).map((b) => {
    const d = (b.desc || b.url) + " - " + b.url;
    return { content: b.url, description: xml ? escapeXml(d) : d };
  }));
});

api.omnibox.onInputEntered.addListener(async (text, disposition) => {
  // A picked suggestion gives its URL; typed text opens the best match, or
  // else an address or a web search, as in bm.
  const best = (await matches(text))[0];
  const known = Tsv.find(Tsv.parse((await state()).text), text);
  const url = known ? known.url : best ? best.url : Tsv.target(text);
  if (disposition === "currentTab") api.tabs.update({ url });
  else api.tabs.create({ url, active: disposition === "newForegroundTab" });
});

// ---- sync on start and every half hour ----

api.runtime.onStartup.addListener(() => serial(syncNow));
api.runtime.onInstalled.addListener(() => {
  api.alarms.create("sync", { periodInMinutes: SYNC_MINUTES });
  serial(syncNow);
});
api.alarms.onAlarm.addListener((a) => {
  if (a.name === "sync") serial(syncNow);
});
