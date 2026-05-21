import assert from "node:assert";
import fs from "node:fs";
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

describe('"sourceMap" options', () => {
  it('should generate source maps when value is "true"', async (t) => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(testId, {
      sourceMap: true,
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      assert.strictEqual(path.isAbsolute(source), true);
      assert.strictEqual(source, path.normalize(source));
      assert.strictEqual(
        fs.existsSync(path.resolve(map.sourceRoot, source)),
        true,
      );

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replaceAll("\\", "/");
    });

    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(css);
    t.assert.snapshot(map);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should generate source maps when the "devtool" value is "source-map"', async (t) => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          paths: ["test/fixtures/paths"],
        },
      },
      {
        devtool: "source-map",
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      assert.strictEqual(path.isAbsolute(source), true);
      assert.strictEqual(source, path.normalize(source));
      assert.strictEqual(
        fs.existsSync(path.resolve(map.sourceRoot, source)),
        true,
      );

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replaceAll("\\", "/");
    });

    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(css);
    t.assert.snapshot(map);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should generate source maps when value is "true" and the "devtool" value is "false"', async (t) => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(
      testId,
      {
        sourceMap: true,
        stylusOptions: {
          paths: ["test/fixtures/paths"],
        },
      },
      {
        devtool: false,
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      assert.strictEqual(path.isAbsolute(source), true);
      assert.strictEqual(source, path.normalize(source));
      assert.strictEqual(
        fs.existsSync(path.resolve(map.sourceRoot, source)),
        true,
      );

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replaceAll("\\", "/");
    });
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(css);
    t.assert.snapshot(map);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should not generate source maps when value is "false"', async (t) => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(testId, {
      sourceMap: false,
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(css);
    assert.strictEqual(map, undefined);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should not generate source maps when the "devtool" value is "false"', async (t) => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          paths: ["test/fixtures/paths"],
        },
      },
      {
        devtool: false,
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(css);
    assert.strictEqual(map, undefined);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should not generate source maps when value is "false" and the "devtool" value is "source-map"', async (t) => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(
      testId,
      {
        sourceMap: false,
        stylusOptions: {
          paths: ["test/fixtures/paths"],
        },
      },
      {
        devtool: "source-map",
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(css);
    assert.strictEqual(map, undefined);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should generate nested source maps when value is "true"', async (t) => {
    const testId = "./source-map/index.styl";
    const compiler = getCompiler(testId, {
      sourceMap: true,
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      assert.strictEqual(path.isAbsolute(source), true);
      assert.strictEqual(source, path.normalize(source));
      assert.strictEqual(
        fs.existsSync(path.resolve(map.sourceRoot, source)),
        true,
      );

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replaceAll("\\", "/");
    });

    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(css);
    t.assert.snapshot(map);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should work and allow to override source maps options", async (t) => {
    const testId = "./basic.styl";
    const stylusOptions = {
      sourcemap: {
        comment: true,
        inline: true,
      },
    };
    const compiler = getCompiler(testId, { stylusOptions });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, { stylusOptions });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });
});
