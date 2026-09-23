"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const Preview = require("../lib/preview.js");

const https = fc.webUrl({ validSchemes: ["https"], withQueryParameters: true, withFragments: true });
const http = fc.webUrl({ validSchemes: ["http"], withQueryParameters: true, withFragments: true });

test("an https page shows at its own address", () => {
  fc.assert(fc.property(https, (u) => {
    assert.equal(Preview.address(u), new URL(u).href);
  }), { numRuns: 1000 });
});

test("an http page shows at the same address with https", () => {
  fc.assert(fc.property(http, (u) => {
    const shown = new URL(Preview.address(u));
    const asked = new URL(u);
    assert.equal(shown.protocol, "https:");
    assert.equal(shown.host, asked.host);
    assert.equal(shown.pathname + shown.search + shown.hash, asked.pathname + asked.search + asked.hash);
  }), { numRuns: 1000 });
});

test("the frame only ever loads https addresses", () => {
  fc.assert(fc.property(fc.oneof(https, http, fc.string(), fc.webUrl({ validSchemes: ["ftp", "file", "data"] })), (u) => {
    const a = Preview.address(u);
    if (a !== null) {
      assert.equal(new URL(a).protocol, "https:");
      assert.equal(Preview.address(a), a);
    }
  }), { numRuns: 2000 });
});

test("addresses that are no web page have no preview", () => {
  for (const u of ["javascript:alert(1)", "JavaScript:alert(1)", "data:text/html,<b>x</b>", "file:///etc/passwd",
    "ftp://example.org/", "about:blank", "chrome://settings", "example.org", "", "https://", "http://"]) {
    assert.equal(Preview.address(u), null, u);
  }
});

test("the highlight stays on a row of the list", () => {
  fc.assert(fc.property(fc.integer({ min: 1, max: 60 }), fc.integer({ min: -5, max: 70 }), fc.integer({ min: -100, max: 100 }),
    (n, i, step) => {
      const j = Preview.move(i, step, n);
      assert.ok(j >= 0 && j < n, `${i} + ${step} in ${n} rows gave ${j}`);
    }), { numRuns: 1000 });
});

test("a move inside the list goes exactly that many rows", () => {
  fc.assert(fc.property(fc.integer({ min: 1, max: 60 }).chain((n) => fc.tuple(fc.constant(n), fc.nat(n - 1), fc.nat(n - 1))),
    ([n, i, j]) => {
      assert.equal(Preview.move(i, j - i, n), j);
    }), { numRuns: 1000 });
});
