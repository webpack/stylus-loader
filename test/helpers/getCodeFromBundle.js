import vm from "node:vm";

import readAsset from "./readAsset.js";

/**
 * @param {import("webpack").Stats} stats stats
 * @param {import("webpack").Compiler} compiler compiler
 * @param {string=} asset asset name
 * @returns {unknown} code from bundle
 */
function getCodeFromBundle(stats, compiler, asset) {
  let code = null;

  if (
    stats &&
    stats.compilation &&
    stats.compilation.assets &&
    stats.compilation.assets[asset || "main.bundle.js"]
  ) {
    code = readAsset(asset || "main.bundle.js", compiler, stats);
  }

  if (!code) {
    throw new Error("Can't find compiled code");
  }

  const result = vm.runInNewContext(
    `${code};\nmodule.exports = stylusLoaderExport;`,
    {
      module: {},
    },
  );

  return result.__esModule ? result.default : result;
}

export default getCodeFromBundle;
