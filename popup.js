// The popup: search as you type, Enter or a click opens, "Add this page" adds.
// The page of the highlighted bookmark shows live in a preview beside the list.
"use strict";

const api = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);
const MAX_ROWS = 50;
// The preview loads a page only after the highlight stays on it this long
// (ms), so that fast typing does not load a page for each letter.
const PREVIEW_WAIT = 300;
let all = []; // newest first, as bm adds at the end
let shown = [];
let sel = 0; // the highlighted row: Enter opens it
let preview = true; // the options can turn the preview off
let started = false; // the preview starts when the user types or points at a bookmark
let framed = null; // the address in the frame
let timer;
let pointer = ""; // where the mouse was last

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

/** Show the bookmarks that match the search. The highlight goes to the row of keep, or else to the first row. */
function render(keep) {
  shown = Fuzzy.filter(all, $("search").value, (b) => b.desc + " " + b.tags.join(" ") + " " + b.url);
  const list = $("list");
  list.replaceChildren();
  shown.slice(0, MAX_ROWS).forEach((b, i) => {
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
    a.addEventListener("mousemove", (e) => {
      // The browser also sends mousemove when the list moves under a mouse
      // that stays still. Only a move of the mouse moves the highlight.
      const at = e.screenX + "," + e.screenY;
      if (at === pointer) return;
      pointer = at;
      point(i);
    });
    a.addEventListener("focus", () => point(i));
    li.append(a);
    list.append(li);
  });
  const empty = $("empty");
  empty.hidden = shown.length > 0;
  empty.textContent = all.length === 0 ? "No bookmarks yet. Sign in to sync in the options, or add this page."
    : "No bookmark matches. Press Enter to search the web.";
  const again = keep ? shown.findIndex((b) => b.url === keep.url) : -1;
  highlight(again >= 0 && again < MAX_ROWS ? again : 0);
}

/** The user points at row i: with the mouse, the Tab key or the arrow keys. */
function point(i) {
  started = true;
  highlight(i);
}

/** Highlight row i, and show its page in the preview. */
function highlight(i) {
  const rows = $("list").children;
  sel = Preview.move(i, 0, rows.length);
  for (let j = 0; j < rows.length; j++) rows[j].classList.toggle("sel", j === sel);
  if (started) showPage(rows.length > 0 ? shown[sel] : undefined);
}

/** Show the page of bookmark b in the preview, when the highlight stays on it. */
function showPage(b) {
  clearTimeout(timer);
  if (!preview) return;
  const address = b ? Preview.address(b.url) : null;
  $("caption").textContent = !b ? "No bookmark to preview."
    : address ? address : "No preview: " + b.url + " is not a web page.";
  if (address) timer = setTimeout(() => frame(address), PREVIEW_WAIT);
  else frame(null);
}

/** Load address in the frame, or an empty page for null. */
function frame(address) {
  if (address === framed) return;
  framed = address;
  $("frame").src = address || "about:blank";
}

/**
 * Show or hide the preview. On a computer it goes beside the list. On
 * Android the popup fills the narrow screen, so it goes under the search.
 */
function showPreview(on) {
  const android = /Android/.test(navigator.userAgent);
  $("preview").hidden = !on;
  document.body.classList.toggle("wide", on && !android);
  document.body.classList.toggle("stack", on && android);
  if (!on) frame(null);
}

async function load() {
  const s = await api.storage.local.get(["text", "token", "synced", "error", "preview"]);
  all = Tsv.parse(s.text || "").reverse();
  preview = s.preview !== false;
  showPreview(preview && $("add").hidden);
  render(shown[sel]);
  showStatus(s);
  return s;
}

/** Open in this tab, or in a new tab with Ctrl. */
function open(url, newTab) {
  if (newTab) api.tabs.create({ url });
  else api.tabs.update({ url });
  window.close();
}

$("search").addEventListener("input", () => {
  started = true;
  render();
});
$("search").addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    point(sel + (e.key === "ArrowDown" ? 1 : -1));
    const row = $("list").children[sel];
    if (row) row.scrollIntoView({ block: "nearest" });
    return;
  }
  if (e.key !== "Enter") return;
  const text = $("search").value;
  if (shown.length > 0) open(shown[sel].url, e.ctrlKey || e.metaKey);
  else if (text.trim() !== "") open(Tsv.target(text), e.ctrlKey || e.metaKey);
});

// A page in the preview can take the focus with a script, and then the
// typing goes into that page. The preview is only to look at, so the focus
// goes back to the search at once. The mouse wheel and clicks on links still
// work in the preview.
window.addEventListener("blur", () => setTimeout(() => {
  if (document.activeElement === $("frame") && !$("search").hidden) $("search").focus();
}));

$("options").addEventListener("click", (e) => {
  e.preventDefault();
  api.runtime.openOptionsPage();
  window.close();
});

/** The form takes the place of the list and the preview while it is open. */
function showForm(on) {
  for (const id of ["search", "list", "add-page"]) $(id).hidden = on;
  $("add").hidden = !on;
  showPreview(preview && !on);
  if (on) $("empty").hidden = true;
  else render();
}

$("add-page").addEventListener("click", async () => {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  $("url").value = tab && tab.url ? tab.url : "";
  $("desc").value = tab && tab.title ? tab.title : "";
  $("tags").value = "";
  const known = [...new Set(all.flatMap((b) => b.tags))].sort();
  $("known").textContent = known.length ? "Tags in your file: " + known.join(" ") : "";
  showForm(true);
  $("tags").focus();
});

$("cancel").addEventListener("click", () => showForm(false));

$("add").addEventListener("submit", async (e) => {
  e.preventDefault();
  const bookmark = {
    url: $("url").value.replace(/\s/g, ""),
    desc: Tsv.clean($("desc").value).trim(),
    tags: $("tags").value.split(/\s+/).filter((t) => t !== ""),
  };
  try {
    const r = await send({ type: "add", bookmark });
    showForm(false);
    await load();
    $("status").textContent = r.existing ? "Already a bookmark: " + (r.existing.desc || r.existing.url) : "Bookmark added.";
  } catch (err) {
    $("status").textContent = "Cannot add: " + err.message;
  }
});

api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.text || changes.synced || changes.error || changes.preview)) load();
});

load().then((s) => {
  // Sync when the popup opens, unless a sync ran in the last minute.
  if (s.token && (!s.synced || Date.now() - s.synced > 60000)) send({ type: "sync" }).catch(() => {});
});
