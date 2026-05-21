import assert from "node:assert";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

import {
  compile,
  getCodeFromBundle,
  getCodeFromStylus,
  getCompiler,
  getErrors,
  getWarnings,
} from "./helpers/index.js";

const require = createRequire(import.meta.url);

describe("implementation option", () => {
  it("should work", async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      implementation: require("stylus"),
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should work when implementation option is string", async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      implementation: require.resolve("stylus"),
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should throw error when unresolved package", async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      implementation: "unresolved",
    });
    const stats = await compile(compiler);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });
});
