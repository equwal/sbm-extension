"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const Tsv = require("../lib/tsv.js");

const url = fc.stringMatching(/^[!-~]{1,40}$/).filter((u) => !u.startsWith("#"));
const desc = fc.string({ maxLength: 40 }).filter((d) => !/[\t\r\n]/.test(d));
const tag = fc.stringMatching(/^[a-z0-9-]{1,10}$/);
const bookmark = fc.record({ url, desc, tags: fc.array(tag, { maxLength: 5 }) });

test("a formatted bookmark parses back to itself", () => {
  fc.assert(fc.property(bookmark, (b) => {
    // fc.record gives objects without a prototype; parse gives plain objects.
    assert.deepEqual(Tsv.parse(Tsv.format(b) + "\n"), [{ ...b }]);
  }), { numRuns: 1000 });
});

test("a file of bookmarks parses back to its bookmarks, with LF or CRLF", () => {
  fc.assert(fc.property(fc.array(bookmark, { maxLength: 20 }), fc.boolean(), (bs, crlf) => {
    const end = crlf ? "\r\n" : "\n";
    const text = bs.map((b) => Tsv.format(b) + end).join("");
    assert.deepEqual(Tsv.parse(text), bs.map((b) => ({ ...b })));
  }), { numRuns: 1000 });
});

test("norm ignores the scheme, www., trailing slashes and the case of the host", () => {
  const host = fc.stringMatching(/^[a-z0-9]{1,10}\.(org|com)$/);
  const path = fc.stringMatching(/^(\/[A-Za-z0-9]{1,8}){0,3}$/);
  fc.assert(fc.property(host, path, fc.constantFrom("http://", "https://", ""), fc.boolean(), fc.nat(3),
    (h, p, s, www, slashes) => {
      const other = s + (www ? "WWW." : "") + h.toUpperCase() + p + "/".repeat(slashes);
      assert.equal(Tsv.norm(other), Tsv.norm("https://" + h + p));
    }), { numRuns: 1000 });
});

test("the case of the path counts", () => {
  assert.notEqual(Tsv.norm("https://example.org/A"), Tsv.norm("https://example.org/a"));
});

test("comments, blank lines and old lines", () => {
  const text = "# notes\n\nhttps://a.example\tA\tcode sec\nhttps://b.example B site | tag\n";
  assert.deepEqual(Tsv.parse(text), [
    { url: "https://a.example", desc: "A", tags: ["code", "sec"] },
    { url: "https://b.example", desc: "B site | tag", tags: [] },
  ]);
});

test("format cleans the fields", () => {
  const b = { url: " https://a.example/x ", desc: "one\ttwo\nthree", tags: ["a b", "c"] };
  assert.equal(Tsv.format(b), "https://a.example/x\tone two three\ta b c");
});

test("find gives the same page, as bm finds it", () => {
  const known = Tsv.parse("https://www.example.com/a/\tA\t\n");
  assert.equal(Tsv.find(known, "http://example.com/a"), known[0]);
  assert.equal(Tsv.find(known, "https://example.com/b"), undefined);
});

test("appendix puts the line on a line of its own", () => {
  assert.equal(Tsv.appendix("", "x"), "x\n");
  assert.equal(Tsv.appendix("a\n", "x"), "x\n");
  assert.equal(Tsv.appendix("a", "x"), "\nx\n");
});

test("target: an address, or a web search, as in bm", () => {
  assert.equal(Tsv.target("suckless.org/dwm"), "https://suckless.org/dwm");
  assert.equal(Tsv.target("gopher://x.org"), "gopher://x.org");
  assert.equal(Tsv.target("posix sh printf"), "https://duckduckgo.com/?q=posix+sh+printf");
  assert.equal(Tsv.target("a&b"), "https://duckduckgo.com/?q=a%26b");
});

test("host", () => {
  assert.equal(Tsv.host("https://jisho.org/word/x?y#z"), "jisho.org");
  assert.equal(Tsv.host("example.org?q=1"), "example.org");
});
