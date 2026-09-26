"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

// The links in the "More apps" section of the options page: the name, the
// address and the attributes of each.
function moreApps() {
  const section = read("options.html").match(/<section id="more-apps">([\s\S]*?)<\/section>/);
  assert.ok(section, "options.html has no More apps section");
  return [...section[1].matchAll(/<a ([^>]*)>([^<]*)<\/a>/g)].map(([, attrs, name]) => ({
    name,
    attrs,
    href: (attrs.match(/href="([^"]*)"/) || [])[1],
  }));
}

test("More apps links to the other apps with https, each in a new tab", () => {
  const apps = moreApps();
  assert.ok(apps.length > 1);
  for (const app of apps) {
    assert.match(app.href, /^https:\/\/[^?#]+$/, app.name); // no tracking parameters
    assert.match(app.attrs, /target="_blank"/, app.name);
    assert.match(app.attrs, /rel="noopener"/, app.name);
  }
  assert.equal(new Set(apps.map((app) => app.href)).size, apps.length);
  assert.equal(apps.at(-1).href, "https://recentlywritten.com/projects.html");
});

test("More apps does not list the add-on itself", () => {
  for (const app of moreApps()) assert.doesNotMatch(app.href, /sbm-extension/, app.name);
});

test("the popup has one More apps link, to the section of the options page", () => {
  const links = read("popup.html").match(/<a [^>]*>More apps<\/a>/g) || [];
  assert.equal(links.length, 1);
  assert.match(links[0], /href="options\.html#more-apps"/);
  assert.match(links[0], /target="_blank"/);
  assert.match(links[0], /rel="noopener"/);
});

test("the add-on asks for no new permission and puts nothing into web pages", () => {
  const manifest = JSON.parse(read("manifest.json"));
  assert.deepEqual(manifest.permissions, ["storage", "activeTab", "alarms"]);
  assert.deepEqual(manifest.optional_host_permissions, ["https://*/*", "http://*/*"]);
  assert.equal(manifest.content_scripts, undefined);
});
