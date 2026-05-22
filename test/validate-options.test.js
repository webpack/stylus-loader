import assert from "node:assert";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

import { compile, getCompiler } from "./helpers/index.js";

const require = createRequire(import.meta.url);

describe("validate options", () => {
  const tests = {
    stylusOptions: {
      success: [
        {},
        { resolveCss: true },
        { includeCSS: false },
        {
          define: [
            ["$development", process.env.NODE_ENV === "development"],
            ["rawVar", 42, true],
          ],
        },
        {
          define: {
            $development: process.env.NODE_ENV === "development",
            rawVar: 42,
          },
        },
        () => {},
        () => ({ resolveCss: true }),
      ],
      failure: [1, true, false, "test", []],
    },
    sourceMap: {
      success: [true, false],
      failure: ["string"],
    },
    webpackImporter: {
      success: [true, false],
      failure: ["string"],
    },
    additionalData: {
      success: ["color = coral", () => "bg = coral"],
      failure: [1, true, false, /test/, [], {}],
    },
    implementation: {
      success: [require("stylus"), "stylus"],
      failure: [true, false, {}, []],
    },
    unknown: {
      success: [],
      failure: [1, true, false, "test", /test/, [], {}, { foo: "bar" }],
    },
  };

  /**
   * @param {EXPECTED_ANY} value value
   * @returns {string} stringified value
   */
  function stringifyValue(value) {
    if (
      Array.isArray(value) ||
      (value && typeof value === "object" && value.constructor === Object)
    ) {
      return JSON.stringify(value);
    }

    return value;
  }

  /**
   * @param {string} key key
   * @param {EXPECTED_ANY} value value
   * @param {string} type type
   */
  function createTestCase(key, value, type) {
    it(`should ${
      type === "success" ? "successfully validate" : "throw an error on"
    } the "${key}" option with "${stringifyValue(value)}" value`, async (t) => {
      const compiler = getCompiler("./basic.styl", {
        [key]: value,
      });
      let stats;

      try {
        stats = await compile(compiler);
      } finally {
        if (type === "success") {
          assert.strictEqual(stats.hasErrors(), false);
        } else if (type === "failure") {
          const {
            compilation: { errors },
          } = stats;

          assert.strictEqual(errors.length, 1);
          t.assert.snapshot(
            ((fn) => {
              try {
                fn();
                return null;
              } catch (err) {
                return err.message;
              }
            })(() => {
              throw new Error(errors[0].error.message);
            }),
          );
        }
      }
    });
  }

  for (const [key, values] of Object.entries(tests)) {
    for (const type of Object.keys(values)) {
      for (const value of values[type]) {
        createTestCase(key, value, type);
      }
    }
  }
});
