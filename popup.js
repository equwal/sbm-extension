// The popup: search as you type, Enter or a click opens, "Add this page" adds.
"use strict";

const api = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);
const MAX_ROWS = 50;
let all = []; // newest first, as bm adds at the end
let shown = [];

function send(msg) {
  return api.runtime.sendMessage(msg).then((r) => {
    if (r && r.error) throw new Error(r.error);
    return r && r.value;
  });
}

function ago(ms) {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return min + " min ago";
  return Math.round(min / 60) + " h ago";
}

function showStatus(s) {
  const n = all.length + (all.length === 1 ? " bookmark" : " bookmarks");
  let text = n + " in this browser. Sign in to sync in the options.";
  if (s.error) text = n + ". Sync: " + s.error;
  else if (s.token) text = n + (s.synced ? ", synced " + ago(s.synced) : "") + ".";
  $("status").textContent = text;
}

function render() {
  shown = Fuzzy.filter(all, $("search").value, (b) => b.desc + " " + b.tags.join(" ") + " " + b.url);
  const list = $("list");
  list.replaceChildren();
  for (const b of shown.slice(0, MAX_ROWS)) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = b.url;
    a.textContent = b.desc || b.url;
    const small = document.createElement("small");
    small.textContent = [Tsv.host(b.url), b.tags.join(" ")].filter((x) => x).join("  ·  ");
    a.append(document.createElement("br"), small);
    a.addEventListener("click", (e) => {
      e.preventDefault();
      open(b.url, e.ctrlKey || e.metaKey || e.button === 1);
    });
    li.append(a);
    list.append(li);
  }
  const empty = $("empty");
  empty.hidden = shown.length > 0;
  empty.textContent = all.length === 0 ? "No bookmarks yet. Sign in to sync in the options, or add this page."
    : "No bookmark matches. Press Enter to search the web.";
}

async function load() {
  const s = await api.storage.local.get(["text", "token", "synced", "error"]);
  all = Tsv.parse(s.text || "").reverse();
  render();
  showStatus(s);
  return s;
}

/** Open in this tab, or in a new tab with Ctrl. */
function open(url, newTab) {
  if (newTab) api.tabs.create({ url });
  else api.tabs.update({ url });
  window.close();
}

$("search").addEventListener("input", render);
$("search").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const text = $("search").value;
  if (shown.length > 0) open(shown[0].url, e.ctrlKey || e.metaKey);
  else if (text.trim() !== "") open(Tsv.target(text), e.ctrlKey || e.metaKey);
});

$("options").addEventListener("click", (e) => {
  e.preventDefault();
  api.runtime.openOptionsPage();
  window.close();
});

$("add-page").addEventListener("click", async () => {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  $("url").value = tab && tab.url ? tab.url : "";
  $("desc").value = tab && tab.title ? tab.title : "";
  $("tags").value = "";
  const known = [...new Set(all.flatMap((b) => b.tags))].sort();
  $("known").textContent = known.length ? "Tags in your file: " + known.join(" ") : "";
  $("add").hidden = false;
  $("add-page").hidden = true;
  $("tags").focus();
});

$("cancel").addEventListener("click", () => {
  $("add").hidden = true;
  $("add-page").hidden = false;
});

$("add").addEventListener("submit", async (e) => {
  e.preventDefault();
  const bookmark = {
    url: $("url").value.replace(/\s/g, ""),
    desc: Tsv.clean($("desc").value).trim(),
    tags: $("tags").value.split(/\s+/).filter((t) => t !== ""),
  };
  try {
    const r = await send({ type: "add", bookmark });
    $("status").textContent = r.existing ? "Already a bookmark: " + (r.existing.desc || r.existing.url) : "Bookmark added.";
    $("add").hidden = true;
    $("add-page").hidden = false;
    await load();
    if (r.existing) $("status").textContent = "Already a bookmark: " + (r.existing.desc || r.existing.url);
  } catch (err) {
    $("status").textContent = "Cannot add: " + err.message;
  }
});

api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.text || changes.synced || changes.error)) load();
});

load().then((s) => {
  // Sync when the popup opens, unless a sync ran in the last minute.
  if (s.token && (!s.synced || Date.now() - s.synced > 60000)) send({ type: "sync" }).catch(() => {});
});
