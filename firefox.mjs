// Stages the package for addons.mozilla.org in build/firefox. Firefox
// ignores background.service_worker, and the linter of addons.mozilla.org
// warns about it, so the staged manifest.json leaves it out. Chrome needs
// it, so manifest.json keeps it. "npm run build:firefox" builds the zip from
// the staged copy.
import { cpSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const out = "build/firefox";
const skip = new Set(["build", "node_modules", "web-ext-artifacts", ".git"]);

rmSync(out, { recursive: true, force: true });
for (const name of readdirSync(".")) {
  if (!skip.has(name)) cpSync(name, `${out}/${name}`, { recursive: true });
}
const manifest = JSON.parse(readFileSync(`${out}/manifest.json`, "utf8"));
delete manifest.background.service_worker;
writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
