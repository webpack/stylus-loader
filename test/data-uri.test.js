import assert from "node:assert";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  compile,
  getCompiler,
  getErrors,
  getWarnings,
  readAsset,
} from "./helpers/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("data: URI resource", () => {
  it("should resolve imports from the loader's context", async () => {
    // An inline <style lang="stylus"> body from an HTML page reaches the loader as a data: URI.
    const compiler = getCompiler(
      "",
      {},
      {
        entry:
          "data:text/stylus;base64,QGltcG9ydCAiLi9kYXRhLXVyaS12YXJzLnN0eWwiCi5kYXRhLXVyaS1zdHlsdXMKICBjb2xvciBkYXRhLXVyaS1jb2xvcgo=",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          cssFilename: "[name].bundle.css",
        },
        module: {
          rules: [
            {
              mimetype: "text/stylus",
              type: "css/auto",
              loader: path.resolve(__dirname, "../src/index.js"),
            },
          ],
        },
        experiments: { css: true },
      },
    );
    const stats = await compile(compiler);

    assert.deepStrictEqual(getErrors(stats), []);
    assert.deepStrictEqual(getWarnings(stats), []);
    // `@import "./data-uri-vars.styl"` resolves from the context the data: URI is given.
    assert.match(
      readAsset("main.bundle.css", compiler, stats),
      /\.data-uri-stylus\s*\{\s*color: #008000;/,
    );
  });
});
