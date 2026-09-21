"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const Fuzzy = require("../lib/fuzzy.js");

const text = fc.stringMatching(/^[a-z ]{0,30}$/);

test("every subsequence of a text matches it", () => {
  fc.assert(fc.property(text, fc.array(fc.boolean(), { maxLength: 30 }), (t, keep) => {
    const word = [...t.replace(/ /g, "")].filter((_, i) => keep[i]).join("");
    assert.notEqual(Fuzzy.score(word, t), null);
  }), { numRuns: 1000 });
});

test("a letter that the text lacks gives no match", () => {
  fc.assert(fc.property(text, (t) => {
    const missing = [..."abcdefghijklmnopqrstuvwxyz"].find((c) => !t.includes(c));
    if (missing) assert.equal(Fuzzy.score(missing, t), null);
  }), { numRuns: 1000 });
});

test("every word of the query must match", () => {
  fc.assert(fc.property(text, text, (a, b) => {
    const both = Fuzzy.score(a + " " + b, "x");
    if (Fuzzy.score(a, "x") === null || Fuzzy.score(b, "x") === null) assert.equal(both, null);
  }), { numRuns: 1000 });
});

test("case does not matter", () => {
  fc.assert(fc.property(text, text, (q, t) => {
    assert.equal(Fuzzy.score(q.toUpperCase(), t), Fuzzy.score(q, t.toUpperCase()));
  }), { numRuns: 1000 });
});

test("filter keeps exactly the items that match", () => {
  fc.assert(fc.property(fc.array(text, { maxLength: 20 }), text, (items, q) => {
    const got = Fuzzy.filter(items, q, (x) => x);
    const want = q.trim() === "" ? items : items.filter((x) => Fuzzy.score(q, x) !== null);
    assert.deepEqual([...got].sort(), [...want].sort());
  }), { numRuns: 1000 });
});

test("a blank query keeps the order", () => {
  assert.deepEqual(Fuzzy.filter(["b", "a"], "  ", (x) => x), ["b", "a"]);
});

test("a whole word ranks above scattered letters", () => {
  assert.deepEqual(Fuzzy.filter(["d w m x", "dwm"], "dwm", (x) => x), ["dwm", "d w m x"]);
});

test("the start of a word ranks above the inside of a word", () => {
  assert.deepEqual(Fuzzy.filter(["xwiki", "wiki x"], "wiki", (x) => x), ["wiki x", "xwiki"]);
});

test("Japanese text matches", () => {
  assert.notEqual(Fuzzy.score("辞書", "Jisho: 日本語の辞書"), null);
});
