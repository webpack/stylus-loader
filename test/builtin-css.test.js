import assert from "node:assert";
import { describe, it } from "node:test";

import {
  compile,
  getCodeFromBundle,
  getCssCompiler,
  getErrors,
  getWarnings,
  readAsset,
} from "./helpers/index.js";

describe("built-in CSS support of webpack", () => {
  it("should work", async (t) => {
    const testId = "./basic.styl";
    const compiler = getCssCompiler(testId);
    const stats = await compile(compiler);

    t.assert.snapshot(readAsset("main.bundle.css", compiler, stats));
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work with "@import"', async (t) => {
    const testId = "./import-styl.styl";
    const compiler = getCssCompiler(testId);
    const stats = await compile(compiler);

    t.assert.snapshot(readAsset("main.bundle.css", compiler, stats));
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work with "url()"', async (t) => {
    const testId = "./urls.styl";
    const compiler = getCssCompiler(testId);
    const stats = await compile(compiler);

    // The built-in CSS support of webpack handles `url()` as an asset module
    assert.strictEqual("img.png" in stats.compilation.assets, true);

    t.assert.snapshot(readAsset("main.bundle.css", compiler, stats));
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should work with CSS modules", async (t) => {
    const testId = "./css-modules/index.js";
    const compiler = getCssCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    // Exported CSS modules class names
    t.assert.snapshot({ ...codeFromBundle });
    t.assert.snapshot(readAsset("main.bundle.css", compiler, stats));
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should generate source maps", async (t) => {
    const testId = "./source-map.styl";
    const compiler = getCssCompiler(
      testId,
      { sourceMap: true, stylusOptions: { paths: ["test/fixtures/paths"] } },
      { devtool: "source-map" },
    );
    const stats = await compile(compiler);
    const css = readAsset("main.bundle.css", compiler, stats);
    const map = JSON.parse(readAsset("main.bundle.css.map", compiler, stats));

    assert.strictEqual(css.includes("sourceMappingURL"), true);
    assert.deepStrictEqual(
      map.sources.map((source) => source.replaceAll("\\", "/")).toSorted(),
      [
        "webpack://stylusLoaderExport/./basic.styl",
        "webpack://stylusLoaderExport/./paths/in-paths.styl",
        "webpack://stylusLoaderExport/./source-map.styl",
      ],
    );

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should throw an error", async (t) => {
    const testId = "./broken.styl";
    const compiler = getCssCompiler(testId);
    const stats = await compile(compiler);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });
});
