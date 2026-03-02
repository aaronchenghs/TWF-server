import { cpSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const sourceDirectory = resolve(repositoryRoot, "src", "tierSets", "presets");
const destinationDirectory = resolve(
  repositoryRoot,
  "dist",
  "tierSets",
  "presets",
);

rmSync(destinationDirectory, {
  force: true,
  recursive: true,
});

cpSync(sourceDirectory, destinationDirectory, {
  force: true,
  recursive: true,
});
