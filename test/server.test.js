"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const defaultServer = (file) => read(file).match(/const DEFAULT_SERVER = "([^"]+)";/)[1];

test("the add-on can reach its default server and the old address", () => {
  assert.equal(defaultServer("background.js"), "https://sbmsync.com");
  assert.equal(defaultServer("options.js"), "https://sbmsync.com");
  // Sign-ins from before the move keep the old address.
  const hosts = JSON.parse(read("manifest.json")).host_permissions;
  assert.deepEqual(hosts, ["https://sbmsync.com/*", "https://sbm.subread.space/*"]);
});
