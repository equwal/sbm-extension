"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

// Most sites do not let a page of another site show them in a frame
// (X-Frame-Options or frame-ancestors), YouTube among them. A preview of a
// bookmark in a frame of the popup stays empty for them, so the popup has
// no frame.
test("the popup shows no page of another site in a frame", () => {
  for (const file of ["popup.html", "popup.js"]) {
    assert.doesNotMatch(read(file), /iframe/i, file);
  }
});
