import assert from "node:assert";
import fs from "node:fs";
import { createRequire } from "node:module";
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
  validateDependencies,
} from "./helpers/index.js";

// eslint-disable-next-line jsdoc/reject-any-type
/** @typedef {any} EXPECTED_ANY */

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("loader", () => {
  it("should work", async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("shouldn't import css", async (t) => {
    const testId = "./import-css.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should import css", async (t) => {
    const testId = "./import-css.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        includeCSS: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        includeCSS: true,
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should import stylus", async (t) => {
    const testId = "./import-styl.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should import stylus from process.cwd", async (t) => {
    const testId = "./import-cwd.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("shouldn't process urls", async (t) => {
    const testId = "./urls.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should work when stylusOptions is function", async (t) => {
    /**
     * @returns {(style: EXPECTED_ANY) => void} stylus plugin
     */
    function plugin() {
      return (style) => {
        style.define("add", (a, b) => a.operate("+", b));
      };
    }

    const testId = "./webpack.config-plugin.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: (loaderContext) => {
        const { resourcePath, rootContext } = loaderContext;
        const relativePath = path.relative(rootContext, resourcePath);

        if (relativePath === "webpack.config-plugin.styl") {
          return { use: plugin() };
        }

        return {};
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        use: plugin(),
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("with option, should resolve urls relatively", async (t) => {
    const testId = "./shallow-deep.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        resolveURL: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    // TODO - stylus has a bug with URLs on windows
    // const codeFromStylus = await getCodeFromStylus(testId, {
    //   stylusOptions: {
    //     // In stylus-loader nocheck option enable to default
    //     resolveURL: { nocheck: true },
    //   },
    // });

    // assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("with option, should resolve urls relatively with loader inline syntax", async (t) => {
    const testId = "./shallow-deep-webpack.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        resolveURL: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    // const codeFromStylus = await getCodeFromStylus(testId);

    // Stylus url-resolver does not work with loader inline syntax
    // assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("with option, should not resolve urls relatively", async (t) => {
    const testId = "./shallow-deep-webpack.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        resolveURL: false,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        resolveURL: undefined,
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  // TODO - stylus has a bug on windows

  it.skip('with option resolveURL nocheck is "false", should not resolve missing urls relatively', async (t) => {
    const testId = "./shallow-deep.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        resolveURL: {
          nocheck: false,
        },
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        resolveURL: { nocheck: false },
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("with option, should resolve urls relatively when literal", async (t) => {
    const testId = "./shallow-deep-literal.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        includeCSS: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        resolveURL: { nocheck: true },
        includeCSS: true,
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('with option, should resolve urls relatively when is set "dest"', async (t) => {
    const testId = "./shallow-deep-literal.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        dest: path.resolve(__dirname, "fixtures/"),
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    // TODO - stylus has a bug with URLs on windows
    // const codeFromStylus = await getCodeFromStylus(testId, {
    //   stylusOptions: {
    //     resolveURL: { nocheck: true },
    //     dest: path.resolve(__dirname, "fixtures/"),
    //   },
    // });

    // assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("with paths, find deps and load like normal stylus", async (t) => {
    const testId = "./import-paths.styl";
    const compiler = getCompiler(testId, {
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

  it("stylus can find modules in node_modules", async (t) => {
    const testId = "./import-fakenib.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("resolve with webpack if stylus can't find it", async (t) => {
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

  it("resolve prefer-relative with webpack", async (t) => {
    const testId = "./import-webpack-prefer-relative.styl";
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            preferRelativeAlias: "prefer-relative/style",
          },
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

  it("in a nested import load module from paths", async (t) => {
    const testId = "./shallow-paths.styl";
    const compiler = getCompiler(testId, {
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

  it("should work indented import", async (t) => {
    const testId = "./shallow-indent.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    const { fileDependencies } = stats.compilation;

    validateDependencies(fileDependencies);

    const fixturesDir = path.resolve(__dirname, "fixtures");
    const fixtures = [
      path.resolve(fixturesDir, "basic.styl"),
      path.resolve(fixturesDir, "deep", "import-fakenib.styl"),
      path.resolve(fixturesDir, "node_modules", "fakenib", "index.styl"),
      path.resolve(fixturesDir, "shallow-indent.styl"),
    ];

    for (const fixture of fixtures) {
      assert.strictEqual(fileDependencies.has(fixture), true);
    }

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should work binop import", async (t) => {
    const testId = "./import-binop.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);
    const { fileDependencies } = stats.compilation;

    validateDependencies(fileDependencies);

    const fixturesDir = path.resolve(__dirname, "fixtures");
    const fixtures = [
      path.resolve(fixturesDir, "deep", "import-fakenib-binop.styl"),
      path.resolve(fixturesDir, "node_modules", "fakenib", "index.styl"),
      path.resolve(fixturesDir, "import-binop.styl"),
    ];

    for (const fixture of fixtures) {
      assert.strictEqual(fileDependencies.has(fixture), true);
    }

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("in a nested import load module from node_modules", async (t) => {
    const testId = "./shallow-fakenib.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("in a nested import load module from webpack", async (t) => {
    const testId = "./shallow-webpack.styl";
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

  it("in a nested import specified in options", async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          import: ["shallow-webpack.styl"],
        },
      },
      {
        resolve: {
          modules: [path.join(__dirname, "fixtures", "web_modules")],
        },
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ["shallow-webpack.styl"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in options with nested glob import", async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          import: ["import-glob-webpack.styl"],
        },
      },
      {
        resolve: {
          alias: {
            globAlias: path.resolve(__dirname, "fixtures", "glob-webpack-2"),
            globAlias2: path.resolve(__dirname, "fixtures", "glob"),
          },
        },
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ["import-glob-webpack.styl"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("resolves css with webpack but does not import it", async (t) => {
    const testId = "./import-webpack-css.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("resolves broken css with webpack but does not import it", async (t) => {
    const testId = "./import-webpack-css-keyframe.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work "use" option', async (t) => {
    /**
     * @returns {(style: EXPECTED_ANY) => void} stylus plugin
     */
    function plugin() {
      return (style) => {
        style.define("add", (a, b) => a.operate("+", b));
      };
    }

    const testId = "./webpack.config-plugin.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: [plugin()],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        use: [plugin()],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work "use" option #1', async (t) => {
    /**
     * @returns {(style: EXPECTED_ANY) => void} stylus plugin
     */
    function plugin() {
      return (style) => {
        style.define("add", (a, b) => a.operate("+", b));
      };
    }

    const testId = "./webpack.config-plugin.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: plugin(),
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        use: plugin(),
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work "use" option as string', async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: "nib",
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        use: require("nib")(),
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work "use" option as Array<string>', async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: ["nib"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        use: require("nib")(),
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should work with bootstrap", async (t) => {
    const testId = "./lib-bootstrap.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: ["bootstrap-styl"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    // TODO - stylus has a bug with URLs on windows
    // const codeFromStylus = await getCodeFromStylus(testId, {
    //   stylusOptions: {
    //     use: require("bootstrap-styl")(),
    //     resolveURL: { nocheck: true },
    //   },
    // });

    // assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should work with plugin using bootstrap", async (t) => {
    const bootstrap = require("bootstrap-styl");

    /**
     * @returns {(styl: EXPECTED_ANY) => void} stylus plugin
     */
    function plugin() {
      return (styl) => {
        bootstrap()(styl);

        // assume that /lib/StylusLibA contains all the .styl files.
        styl.include(path.resolve(__dirname, "./lib/"));
      };
    }
    const testId = "./lib-bootstrap.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: [plugin()],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    // TODO - stylus has a bug with URLs on windows
    // const codeFromStylus = await getCodeFromStylus(testId, {
    //   stylusOptions: {
    //     use: [plugin()],
    //     resolveURL: { nocheck: true },
    //   },
    // });
    //
    // assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work "define" option', async (t) => {
    const testId = "./webpack.config-plugin.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        define: {
          add: (a, b) => a.operate("+", b),
        },
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        define: {
          add: (a, b) => a.operate("+", b),
        },
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work "define" option with raw', async (t) => {
    const testId = "./defineRaw.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        define: [
          ["rawVar", { nestedVar: 42 }, true],
          ["castedVar", { disc: "outside" }, true],
          ["rawDefine", ["rawVar"], true],
        ],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        define: [
          ["rawVar", { nestedVar: 42 }, true],
          ["castedVar", { disc: "outside" }, true],
          ["rawDefine", ["rawVar"], true],
        ],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("correctly compiles mixin calls inside imported files", async (t) => {
    const testId = "./import-mixins/index.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should compile an @import URL through the CSS loader", async (t) => {
    const testId = "./import-google-font.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in option argument", async (t) => {
    const testId = "./stylus.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ["urls.styl"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    // TODO - stylus has a bug with URLs on windows
    // const codeFromStylus = await getCodeFromStylus(testId, {
    //   stylusOptions: {
    //     import: ["urls.styl"],
    //   },
    // });

    // assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in option argument stylus paths style", async (t) => {
    const testId = "./stylus.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ["in-paths.styl"],
        paths: [path.join(__dirname, "./fixtures/paths")],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ["in-paths.styl"],
        paths: [path.join(__dirname, "./fixtures/paths")],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in option argument webpack style", async (t) => {
    const testId = "./stylus.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          import: ["fakenib"],
        },
      },
      {
        resolve: {
          modules: ["node_modules"],
        },
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ["fakenib"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in option argument with tilde", async (t) => {
    const testId = "./stylus.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          import: ["~fakenib"],
        },
      },
      {
        resolve: {
          modules: ["node_modules"],
        },
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ["~fakenib"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('imports files listed in option "style" package.json', async (t) => {
    const testId = "./import-fakestylus.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in option argument and deps", async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ["import-styl.styl"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ["import-styl.styl"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("with paths, find deps with spaces and load like normal stylus", async (t) => {
    const testId = "./import-paths space.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        paths: [path.resolve(__dirname, "fixtures", "paths with space")],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: [path.resolve(__dirname, "fixtures", "paths with space")],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work "include" option', async (t) => {
    const testId = "./include-option.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        include: [path.join(__dirname, "./fixtures/paths")],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        include: [path.join(__dirname, "./fixtures/paths")],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  // TODO - stylus has a bug on windows

  it.skip('should work "nib"', async (t) => {
    const testId = "./basic-nib.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: [require("nib")()],
        import: ["nib"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        use: [require("nib")()],
        import: ["nib"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in glob with deps", async (t) => {
    const testId = "./import-glob.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    const { fileDependencies, contextDependencies } = stats.compilation;

    validateDependencies(fileDependencies);
    validateDependencies(contextDependencies);

    const fixturesDir = path.resolve(__dirname, "fixtures");

    for (const fixture of [
      path.resolve(fixturesDir, "import-glob.styl"),
      path.resolve(fixturesDir, "glob", "a.styl"),
      path.resolve(fixturesDir, "glob", "b.styl"),
      path.resolve(fixturesDir, "glob-files", "index.styl"),
      path.resolve(fixturesDir, "glob-files", "dir", "a.styl"),
      path.resolve(fixturesDir, "glob-files", "dir", "b.styl"),
    ]) {
      assert.strictEqual(fileDependencies.has(fixture), true);
    }

    for (const fixture of [
      fixturesDir,
      path.resolve(fixturesDir, "glob"),
      path.resolve(fixturesDir, "glob-files"),
    ]) {
      assert.strictEqual(contextDependencies.has(fixture), true);
    }

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files with special characters listed in glob", async (t) => {
    const testId = "./import-glob-special.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    // Support characters that it supports native stylus
    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in glob with webpack import with deps", async (t) => {
    const testId = "./import-glob-webpack.styl";
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            globAlias: path.resolve(__dirname, "fixtures", "glob-webpack-2"),
            globAlias2: path.resolve(__dirname, "fixtures", "glob"),
          },
        },
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);
    const { fileDependencies, contextDependencies } = stats.compilation;

    validateDependencies(fileDependencies);
    validateDependencies(contextDependencies);

    const fixturesDir = path.resolve(__dirname, "fixtures");

    for (const fixture of [
      path.resolve(fixturesDir, "glob-webpack-2", "a.styl"),
      path.resolve(fixturesDir, "glob-webpack-2", "b.styl"),
      path.resolve(fixturesDir, "glob-webpack-2", "index.styl"),
      path.resolve(fixturesDir, "glob-webpack", "a.styl"),
      path.resolve(fixturesDir, "glob-webpack", "b.styl"),
      path.resolve(fixturesDir, "glob", "a.styl"),
      path.resolve(fixturesDir, "glob", "b.styl"),
      path.resolve(fixturesDir, "import-glob-webpack.styl"),
      path.resolve(fixturesDir, "node_modules", "glob_package", "a.styl"),
      path.resolve(fixturesDir, "node_modules", "glob_package", "b.styl"),
      path.resolve(fixturesDir, "node_modules", "glob_package", "index.styl"),
    ]) {
      assert.strictEqual(fileDependencies.has(fixture), true);
    }

    for (const fixture of [
      path.resolve(fixturesDir, "glob"),
      path.resolve(fixturesDir, "glob-webpack"),
      path.resolve(fixturesDir, "glob-webpack-2"),
      path.resolve(fixturesDir, "node_modules", "glob_package"),
    ]) {
      assert.strictEqual(contextDependencies.has(fixture), true);
    }

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in glob **/* with deps", async (t) => {
    const testId = "./import-glob-all.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    const { fileDependencies } = stats.compilation;

    validateDependencies(fileDependencies);

    const rootDir = path.resolve(__dirname, "fixtures", "glob-all");
    const fixtures = [
      path.resolve(rootDir, "..", "import-glob-all.styl"),
      path.resolve(rootDir, "a.styl"),
      path.resolve(rootDir, "a-glob", "file.styl"),
      path.resolve(rootDir, "a-glob", "a-deep", "a-deep.styl"),
      path.resolve(rootDir, "a-glob", "a-deep", "sub-deep", "sub-deep.styl"),
      path.resolve(rootDir, "b-glob", "file.styl"),
    ];

    for (const fixture of fixtures) {
      assert.strictEqual(fileDependencies.has(fixture), true);
    }

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in glob with webpack import 2", async (t) => {
    const testId = "./import-glob-webpack-2.styl";
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            globAliasDot: path.resolve(__dirname, "fixtures", "glob-webpack-2"),
            globAlias2: path.resolve(__dirname, "fixtures", "glob"),
          },
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

  it("imports unsupported webpack", async (t) => {
    const testId = "./import-webpack-unsupported.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in nested glob import", async (t) => {
    const testId = "./import-glob-nested.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in nested glob with webpack import", async (t) => {
    const testId = "./import-glob-webpack-nested.styl";
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            aliasNested: path.resolve(__dirname, "fixtures", "glob-nested"),
          },
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

  it("should emit error when imports files listed as glob in empty directory", async (t) => {
    const testId = "./import-glob-empty-dir.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await assert.rejects(getCodeFromStylus(testId), (err) =>
      err.message.includes("failed to locate @import file empty-dir/*.styl"),
    );
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in glob import package", async (t) => {
    const testId = "./import-glob-package.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in glob import package through webpack", async (t) => {
    const testId = "./import-glob-webpack-package.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files in dir like a glob", async (t) => {
    const rootdir = path.resolve(__dirname, "fixtures", "node_modules");
    const exampleDir = path.resolve(rootdir, "example-like-a-glob");
    const pathDir =
      process.platform === "win32"
        ? path.resolve(rootdir, "like-a-glob")
        : path.resolve(rootdir, "like-a-glob*");

    if (!fs.existsSync(pathDir)) {
      fs.mkdirSync(pathDir);
      fs.copyFileSync(
        path.resolve(exampleDir, "package.json"),
        path.resolve(pathDir, "package.json"),
      );
      fs.copyFileSync(
        path.resolve(exampleDir, "index.styl"),
        path.resolve(pathDir, "index.styl"),
      );
    }

    const testId = "./import-dir-like-a-glob.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in option as glob", async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ["glob/*"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ["glob/*"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports files listed in option as glob with webpack import", async (t) => {
    const testId = "./import-glob-alias.styl";
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            globSimpleAlias: path.resolve(__dirname, "fixtures", "glob"),
          },
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

  it("imports and paths deps", async (t) => {
    const testId = "./import-paths.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        paths: [path.join(__dirname, "./fixtures/paths")],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: [path.join(__dirname, "./fixtures/paths")],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports and webpack deps", async (t) => {
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

  it("imports and webpack alias", async (t) => {
    const testId = "./import-webpack-alias.styl";
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            alias: path.resolve(__dirname, "fixtures", "alias"),
          },
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

  it('imports in option "import" and webpack alias', async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          import: ["alias/1", "~alias/2"],
        },
      },
      {
        resolve: {
          alias: {
            alias: path.resolve(__dirname, "fixtures", "alias"),
          },
        },
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ["alias/1", "~alias/2"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("imports the right file based on context", async (t) => {
    const testId = "./context";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should not be resolved when url begin with "#"', async (t) => {
    const testId = "./no-import.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: { resolveURL: { nocheck: true } },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work "hoistAtrules" option', async (t) => {
    const testId = "./hoist-atrules.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        hoistAtrules: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        hoistAtrules: true,
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work "prefix" option', async (t) => {
    const testId = "./prefix.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        prefix: "prefix-",
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        prefix: "prefix-",
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  // TODO - stylus has a bug on windows

  it.skip('should work "lineNumbers" option', async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        lineNumbers: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        lineNumbers: true,
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(
      codeFromBundle.css
        .replaceAll(process.cwd(), "")
        .replaceAll("\\\\?\\", "")
        .replaceAll("\\", "/"),
    );
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work "compress" option', async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        compress: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        compress: true,
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work compress in "production" mode', async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {}, { mode: "production" });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        compress: true,
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work and respect the "compress" option with the "true" value', async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          compress: true,
        },
      },
      { mode: "production" },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        compress: true,
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work and respect the "compress" option with the "false" value', async (t) => {
    const testId = "./basic.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          compress: false,
        },
      },
      { mode: "production" },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        compress: false,
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should use .json file", async (t) => {
    const testId = "./json/index.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        paths: ["test/fixtures/node_modules/vars"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/node_modules/vars"],
      },
    });

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should emit error when unresolved import", async (t) => {
    const testId = "./import-unresolve.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const { fileDependencies } = stats.compilation;

    validateDependencies(fileDependencies);

    const fixturesDir = path.resolve(__dirname, "fixtures");
    const fixtures = [path.resolve(fixturesDir, "import-unresolve.styl")];

    for (const fixture of fixtures) {
      assert.strictEqual(fileDependencies.has(fixture), true);
    }

    await assert.rejects(getCodeFromStylus(testId), (err) =>
      err.message.includes("failed to locate @import file unresolve.styl"),
    );
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should emit warning when use unresolved plugin", async (t) => {
    const testId = "./webpack.config-plugin.styl";
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: ["unresolved"],
      },
    });
    const stats = await compile(compiler);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should emit error when import self", async (t) => {
    const testId = "./imports/self.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await assert.rejects(getCodeFromStylus(testId), (err) =>
      err.message.includes("failed to locate @import file self.styl"),
    );
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(
      getErrors(stats).map((item) =>
        // Due bug in `node-glob`
        process.platform === "win32"
          ? item.replace(
              "failed to locate @import file self.styl",
              "import loop has been found",
            )
          : item,
      ),
    );
  });

  it("should emit error when import loop", async (t) => {
    const testId = "./import-recursive.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await assert.rejects(getCodeFromStylus(testId), (err) =>
      err.message.includes("Not found"),
    );
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should emit error when parse error", async (t) => {
    const testId = "./parse-error.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await assert.rejects(getCodeFromStylus(testId), (err) =>
      err.message.includes('expected "indent", got "eos"'),
    );
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should emit error when empty import", async (t) => {
    const testId = "./empty-import.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    await assert.rejects(getCodeFromStylus(testId), (err) =>
      err.message.includes("@import string expected"),
    );
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should emit error when unresolved import glob", async (t) => {
    const testId = "./import-unresolve-glob.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await assert.rejects(getCodeFromStylus(testId), (err) =>
      err.message.includes("failed to locate @import file unresolve/*.styl"),
    );
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should throw an error on circular imports", async (t) => {
    const testId = "./circular.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await assert.rejects(getCodeFromStylus(testId), (err) =>
      err.message.includes("failed to locate @import file circular.styl"),
    );

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should work and respect the 'resolve.byDependency.less' option", async (t) => {
    const testId = "./by-dependency.styl";
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          byDependency: {
            stylus: {
              mainFiles: ["custom"],
            },
          },
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

  it('should work with a package with "styl" and "exports" fields and a custom condition (theme1)', async (t) => {
    const testId = "./import-package-with-exports-and-custom-condition.styl";
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          conditionNames: ["theme1", "..."],
        },
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(
      testId,
      {},
      {
        packageExportsCustomConditionTestVariant: 1,
      },
    );

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it('should work with a package with "styl" and "exports" fields and a custom condition (theme2)', async (t) => {
    const testId = "./import-package-with-exports-and-custom-condition.styl";
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          conditionNames: ["theme2", "..."],
        },
      },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(
      testId,
      {},
      {
        packageExportsCustomConditionTestVariant: 2,
      },
    );

    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should throw an error", async (t) => {
    const testId = "./broken.styl";
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should work and don't override loader options", async (t) => {
    const testId = "./basic.styl";
    const stylusOptions = {
      compress: false,
      resolveURL: {
        nocheck: false,
      },
      sourcemap: {
        comment: true,
        inline: true,
      },
    };
    const compiler = getCompiler(
      testId,
      { stylusOptions },
      { mode: "production" },
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, { stylusOptions });

    assert.deepStrictEqual(stylusOptions, {
      compress: false,
      resolveURL: {
        nocheck: false,
      },
      sourcemap: {
        comment: true,
        inline: true,
      },
    });
    assert.strictEqual(codeFromBundle.css, codeFromStylus.css);
    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });
});
