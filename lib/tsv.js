// The bookmark file of sbm, as bm reads and writes it: one bookmark per line,
//
//     URL<tab>description<tab>tag tag tag
//
// Blank lines and lines that start with # are not bookmarks. This file has no
// browser code, so the tests run in node.
"use strict";

const Tsv = (() => {
  const scheme = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//;

  function parseLine(line) {
    const fields = line.split("\t");
    if (fields.length === 1) {
      // A line of the old format: "URL description | tags". bm-migrate
      // converts it. Until then the first word is the URL.
      const words = line.trim().split(/\s+/);
      return { url: words[0], desc: words.slice(1).join(" "), tags: [] };
    }
    const url = fields[0].trim();
    if (url === "") return null;
    const tags = (fields[2] || "").split(" ").filter((t) => t !== "");
    return { url, desc: fields[1], tags };
  }

  return {
    /** The bookmarks in the text of a file. */
    parse(text) {
      const out = [];
      for (const raw of text.split("\n")) {
        const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
        if (line.trim() === "" || line.startsWith("#")) continue;
        const b = parseLine(line);
        if (b) out.push(b);
      }
      return out;
    },

    /** Text for one field: tabs and line breaks become spaces. */
    clean(text) {
      return text.replace(/[\t\r\n]/g, " ");
    },

    /** The line of a bookmark, without the newline. */
    format(b) {
      const tags = b.tags.flatMap((t) => t.split(/\s+/)).filter((t) => t !== "");
      return b.url.replace(/\s/g, "") + "\t" + Tsv.clean(b.desc) + "\t" + tags.join(" ");
    },

    /**
     * The same page for bm: two URLs match when they differ only in the
     * scheme, a leading www., trailing slashes or the case of the host.
     */
    norm(url) {
      const u = url.replace(scheme, "");
      const slash = u.indexOf("/");
      const host = (slash >= 0 ? u.slice(0, slash) : u).toLowerCase().replace(/^www\./, "");
      const rest = slash >= 0 ? u.slice(slash).replace(/\/+$/, "") : "";
      return host + rest;
    },

    /** The bookmark for the same page as url, or undefined. */
    find(bookmarks, url) {
      const n = Tsv.norm(url);
      return bookmarks.find((b) => Tsv.norm(b.url) === n);
    },

    /** The text to add to a file that holds text, so that line is a line of its own. */
    appendix(text, line) {
      return text === "" || text.endsWith("\n") ? line + "\n" : "\n" + line + "\n";
    },

    /** The host of a URL, for display. */
    host(url) {
      return url.replace(scheme, "").split(/[/?#]/)[0];
    },

    /**
     * Where text that is no bookmark goes, as in bm: one word with "://" or
     * a dot is an address. Other text is a web search.
     */
    target(text) {
      const t = text.trim();
      if (!t.includes(" ")) {
        if (t.includes("://")) return t;
        if (t.includes(".")) return "https://" + t;
      }
      return "https://duckduckgo.com/?q=" + encodeURIComponent(t).replace(/%20/g, "+");
    },
  };
})();

if (typeof module !== "undefined") module.exports = Tsv;
