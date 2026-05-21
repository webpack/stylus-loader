import Module, { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const parentRequire = createRequire(import.meta.url);

export default (code) => {
  const resource = "test.js";
  const parent = parentRequire.cache[parentRequire.resolve("./index.js")];
  const module = new Module(resource, parent);

  module.paths = Module._nodeModulePaths(
    path.resolve(__dirname, "../fixtures"),
  );
  module.filename = resource;

  module._compile(code, resource);

  return module.exports;
};
