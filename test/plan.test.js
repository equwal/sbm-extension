"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const Plan = require("../lib/plan.js");

// Any text in the place of an address: a web address, another scheme, or none.
const address = fc.oneof(
  fc.webUrl(),
  fc.string(),
  fc.constantFrom("javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "ftp://example.org/"),
);

test("each payment link is a web address", () => {
  fc.assert(fc.property(address, address, address, address, address, (support, manage, teams, large, terms) => {
    for (const l of Plan.links({ support, manage, teams, teams_large: large, terms })) {
      assert.match(l.href, /^https?:\/\//);
      assert.equal(new URL(l.href).href, l.href);
    }
  }), { numRuns: 1000 });
});

test("a web address stays", () => {
  fc.assert(fc.property(fc.webUrl(), (u) => {
    assert.equal(Plan.web(u), new URL(u).href);
    assert.equal(Plan.links({ support: u }).length, 1);
  }), { numRuns: 1000 });
});

test("the links of the server, in the order of the server", () => {
  // An answer of GET /api/account, as the server gives it.
  const info = JSON.parse('{"email":"me@example.org","state":"Sync is on.","plans":[],"portal":false,' +
    '"terms":"https://sbm.example.org/terms","support":"https://buy.stripe.com/support",' +
    '"manage":"https://billing.stripe.com/p/login/x","teams":"https://buy.stripe.com/small",' +
    '"teams_large":"https://buy.stripe.com/large"}');
  assert.deepEqual(Plan.links(info).map((l) => l.text + " = " + l.href), [
    "Become a supporter = https://buy.stripe.com/support",
    "Manage or cancel a supporter subscription = https://billing.stripe.com/p/login/x",
    "Team bookmarks: up to 10 people = https://buy.stripe.com/small",
    "Team bookmarks: 11 people or more = https://buy.stripe.com/large",
    "Terms of sale = https://sbm.example.org/terms",
  ]);
  assert.deepEqual(Plan.links({ email: "me@example.org", state: "Sync is on.", plans: [], portal: false }), []);
});

test("other schemes go", () => {
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "not an address", "", undefined]) {
    assert.equal(Plan.web(bad), "", String(bad));
  }
});

test("a Stripe page must use https", () => {
  assert.equal(Plan.web("https://checkout.stripe.com/c/pay/cs_test_1", ["https:"]), "https://checkout.stripe.com/c/pay/cs_test_1");
  assert.equal(Plan.web("http://checkout.stripe.com/c/pay/cs_test_1", ["https:"]), "");
});
