import assert from "node:assert";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  compile,
  getCodeFromBundle,
  getCodeFromStylus,
  getCompiler,
  getErrors,
  getWarnings,
} from "./helpers/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("webpackImporter option", () => {
  it("should work when value is not specify", async (t) => {
    const testId = "./import-webpack.styl";
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          modules: [path.join(__dirname, "fixtures", "web_modules")],
        },
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work when value is "true"', async (t) => {
    const testId = "./import-webpack.styl";
    const compiler = getCompiler(
      testId,
      {
        webpackImporter: true,
      },
      {
        resolve: {
          modules: [path.join(__dirname, "fixtures", "web_modules")],
        },
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work when value is "false"', async (t) => {
    const testId = "./shallow-paths.styl";
    const compiler = getCompiler(testId, {
      webpackImporter: false,
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should throw an error on webpack import when value is "false"', async (t) => {
    const testId = "./import-webpack.styl";
    const compiler = getCompiler(
      testId,
      {
        webpackImporter: false,
      },
      {
        resolve: {
          modules: [path.join(__dirname, "fixtures", "web_modules")],
        },
      },
    );
    const stats = await compile(compiler);

    await assert.rejects(
      getCodeFromStylus(testId, {
        stylusOptions: { shouldUseWebpackImporter: false },
      }),
      /failed to locate @import file ~in-web-modules\.styl/,
    );
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });
});
