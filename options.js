// The options page: sign in to a sync server, sync now, sign out, and the
// plan of the account with its payments.
"use strict";

const api = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);
const DEFAULT_SERVER = "https://sbmsync.com";

// The data that the add-on sends to the server after a sign-in. Firefox 140
// and later ask the user for it; other browsers have no such question.
const DATA = ["bookmarksInfo", "personallyIdentifyingInfo", "authenticationInfo"];
let askData = false;
api.permissions.getAll().then((p) => {
  askData = !!p.data_collection;
});

function send(msg) {
  return api.runtime.sendMessage(msg).then((r) => {
    if (r && r.error) throw new Error(r.error);
    return r && r.value;
  });
}

function say(text) {
  $("message").textContent = text;
}

function origin(server) {
  const s = server.trim().replace(/\/+$/, "");
  return new URL(s.includes("://") ? s : "https://" + s).origin;
}

async function show() {
  const s = await api.storage.local.get(["server", "email", "token", "synced", "error", "text"]);
  const server = s.server || DEFAULT_SERVER;
  $("signed-out").hidden = !!s.token;
  $("signed-in").hidden = !s.token;
  if (!$("server").value) $("server").value = server;
  if (!$("email").value) $("email").value = s.email || "";
  $("signup").href = origin($("server").value || server) + "/signup";
  $("account").href = server + "/account";
  const n = Tsv.parse(s.text || "").length;
  $("who").textContent = "Signed in to " + server + " as " + s.email + ". " + n + " bookmarks" +
    (s.synced ? ", synced " + new Date(s.synced).toLocaleString() : "") + ".";
  if (s.error) say("Sync: " + s.error);
  if (s.token) showPlan();
}

function button(text, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
}

/** Show the plan of the account and the payments that the server offers. */
async function showPlan() {
  let info = null;
  try {
    info = await send({ type: "account" });
  } catch (err) {
    // No answer now. The link to the account page stays.
  }
  $("plan").hidden = !info;
  if (!info) return;
  $("plan-state").textContent = info.state;
  const buttons = info.plans.map((p) => button("Subscribe: " + p.label, () => pay({ type: "checkout", plan: p.id })));
  if (info.portal) buttons.push(button("Manage billing", () => pay({ type: "portal" })));
  $("billing").replaceChildren(...buttons);
  $("billing").hidden = buttons.length === 0;
  const links = Plan.links(info).map((l) => {
    const a = document.createElement("a");
    a.href = l.href;
    a.textContent = l.text;
    a.target = "_blank";
    a.rel = "noopener";
    return a;
  });
  $("links").replaceChildren(...links.flatMap((a, i) => (i === 0 ? [a] : [" · ", a])));
  $("links").hidden = links.length === 0;
}

/** Open a page of Stripe in a new tab. */
async function pay(msg) {
  say("Opening Stripe…");
  try {
    await send(msg);
    say("");
  } catch (err) {
    say(err.message);
  }
}

// Back from a page of Stripe: show the new plan.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") show();
});

$("server").addEventListener("input", () => {
  try {
    $("signup").href = origin($("server").value) + "/signup";
  } catch (e) {
    // not an address yet
  }
});

$("sign-in").addEventListener("submit", async (e) => {
  e.preventDefault();
  let want;
  try {
    want = { origins: [origin($("server").value) + "/*"] };
  } catch (err) {
    say("The sync server is not an address.");
    return;
  }
  if (askData) want.data_collection = DATA;
  // The browser asks the user. The request must come before any await: only
  // then does the browser see it as part of the click.
  const granted = api.permissions.request(want);
  say("Signing in…");
  try {
    if (!(await granted)) {
      say("Without that permission the add-on cannot sync.");
      return;
    }
    await send({ type: "signIn", server: $("server").value, email: $("email").value, password: $("password").value });
    $("password").value = "";
    say("");
  } catch (err) {
    say(err.message);
  }
  show();
});

$("sync").addEventListener("click", async () => {
  say("Syncing…");
  try {
    await send({ type: "sync" });
    say("");
  } catch (err) {
    say(err.message);
  }
  show();
});

$("sign-out").addEventListener("click", async () => {
  await send({ type: "signOut" });
  say("Signed out. Your bookmarks stay in this browser.");
  show();
});

// The preview in the popup is on until the user turns it off.
api.storage.local.get("preview").then((s) => {
  $("preview").checked = s.preview !== false;
});
$("preview").addEventListener("change", () => api.storage.local.set({ preview: $("preview").checked }));

show();
