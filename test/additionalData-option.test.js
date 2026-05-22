import path from "node:path";
import { describe, it } from "node:test";

import {
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getWarnings,
} from "./helpers/index.js";

describe('"additionalData" option', () => {
  it("should work as a string", async (t) => {
    const testId = "./additional-data.styl";
    const additionalData = "color = coral";
    const compiler = getCompiler(testId, { additionalData });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should as a function", async (t) => {
    const testId = "./additional-data.styl";
    const additionalData = (content, loaderContext) => {
      const { resourcePath, rootContext } = loaderContext;

      const relativePath = path.relative(rootContext, resourcePath);

      return `
/* RelativePath: ${relativePath}; */

color = coral;
bg = gray;

${content}

.custom-class
  background: bg
        `;
    };
    const compiler = getCompiler(testId, { additionalData });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });

  it("should as an async function", async (t) => {
    const testId = "./additional-data.styl";
    const additionalData = async (content, loaderContext) => {
      const { resourcePath, rootContext } = loaderContext;

      const relativePath = path.relative(rootContext, resourcePath);

      return `
/* RelativePath: ${relativePath}; */

color = coral;
bg = gray;

${content}

.custom-class
  background: bg
        `;
    };
    const compiler = getCompiler(testId, { additionalData });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    t.assert.snapshot(codeFromBundle.css);
    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
  });
});
