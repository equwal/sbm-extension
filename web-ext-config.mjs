// Settings for web-ext (lint, build): the store package holds the add-on
// only, not its tests and tools.
export default {
  ignoreFiles: [
    "build",
    "firefox.mjs",
    "test",
    "icons/make-icons.ps1",
    "package.json",
    "package-lock.json",
    "store",
    "web-ext-config.mjs",
  ],
  build: { overwriteDest: true },
};
