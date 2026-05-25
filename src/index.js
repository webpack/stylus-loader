import path from "node:path";

import schema from "./options.json" with { type: "json" };
import {
  createEvaluator,
  getStylusImplementation,
  getStylusOptions,
  normalizeSourceMap,
  readFile,
  urlResolver,
} from "./utils.js";

/** @typedef {import("webpack").LoaderContext<LoaderOptions>} LoaderContext */
/** @typedef {import("schema-utils/declarations/validate").Schema} Schema */
/** @typedef {import("./utils.js").LoaderOptions} LoaderOptions */
/** @typedef {import("./utils.js").StylusError} StylusError */
/** @typedef {import("./utils.js").StylusOptions} StylusOptions */
/** @typedef {import("./utils.js").EXPECTED_ANY} EXPECTED_ANY */

/**
 * The stylus-loader makes `Stylus` available to webpack modules.
 * @this {LoaderContext}
 * @param {string} source source
 * @returns {Promise<void>} loader result
 */
export default async function stylusLoader(source) {
  const options = this.getOptions(/** @type {Schema} */ (schema));
  const callback = this.async();

  let implementation;

  try {
    implementation = await getStylusImplementation(
      this,
      options.implementation,
    );
  } catch (error) {
    callback(/** @type {Error} */ (error));

    return;
  }

  if (!implementation) {
    callback(
      new Error(
        `The Stylus implementation "${options.implementation}" not found`,
      ),
    );

    return;
  }

  let data = source;

  if (typeof options.additionalData !== "undefined") {
    data =
      typeof options.additionalData === "function"
        ? await options.additionalData(data, this)
        : `${options.additionalData}\n${data}`;
  }

  let stylusOptions;

  try {
    stylusOptions = await getStylusOptions(this, options);
  } catch (error) {
    callback(/** @type {Error} */ (error));
    return;
  }

  const styl = implementation(data, stylusOptions);

  // include regular CSS on @import
  if (stylusOptions.includeCSS) {
    styl.set("include css", true);
  }

  if (stylusOptions.hoistAtrules) {
    styl.set("hoist atrules", true);
  }

  if (stylusOptions.lineNumbers) {
    styl.set("linenos", true);
  }

  if (stylusOptions.disableCache) {
    styl.set("cache", false);
  }

  const useSourceMap =
    typeof options.sourceMap === "boolean" ? options.sourceMap : this.sourceMap;

  if (useSourceMap || stylusOptions.sourcemap) {
    styl.set(
      "sourcemap",
      useSourceMap
        ? {
            comment: false,
            sourceRoot: stylusOptions.dest,
            basePath: this.rootContext,
          }
        : stylusOptions.sourcemap,
    );
  }

  if (typeof stylusOptions.import !== "undefined") {
    for (const imported of stylusOptions.import) {
      styl.import(imported);
    }
  }

  if (typeof stylusOptions.include !== "undefined") {
    for (const included of stylusOptions.include) {
      styl.include(included);
    }
  }

  if (stylusOptions.resolveURL !== false) {
    styl.define("url", urlResolver(stylusOptions.resolveURL));
  }

  const shouldUseWebpackImporter =
    typeof options.webpackImporter === "boolean"
      ? options.webpackImporter
      : true;

  if (shouldUseWebpackImporter) {
    styl.set("Evaluator", await createEvaluator(this, source, stylusOptions));
  }

  if (typeof stylusOptions.define !== "undefined") {
    const definitions = Array.isArray(stylusOptions.define)
      ? stylusOptions.define
      : Object.entries(stylusOptions.define);

    for (const defined of definitions) {
      styl.define(.../** @type {[string, EXPECTED_ANY]} */ (defined));
    }
  }

  styl.render(
    /**
     * @param {StylusError | null} error error
     * @param {string} css css
     * @returns {Promise<void>} render result
     */
    async (error, css) => {
      if (error) {
        if (error.filename) {
          this.addDependency(path.normalize(error.filename));
        }

        const obj = new Error(error.message, { cause: error });

        obj.stack = /** @type {EXPECTED_ANY} */ (null);

        callback(obj);

        return;
      }

      if (stylusOptions._imports && stylusOptions._imports.length > 0) {
        for (const importData of stylusOptions._imports) {
          if (path.isAbsolute(importData.path)) {
            this.addDependency(
              path.normalize(
                path.sep === "\\"
                  ? importData.path.replace(/^\/\/\?\//, "")
                  : importData.path,
              ),
            );
          } else {
            this.addDependency(path.resolve(process.cwd(), importData.path));
          }
        }
      }

      // @ts-expect-error no types are shipped for this
      let map = styl.sourcemap;

      if (map && useSourceMap) {
        map = normalizeSourceMap(
          map,
          /** @type {string} */ (stylusOptions.dest),
        );

        try {
          map.sourcesContent = await Promise.all(
            map.sources.map(
              /**
               * @param {string} file file
               * @returns {Promise<string>} file contents
               */
              async (file) => (await readFile(this.fs, file)).toString(),
            ),
          );
        } catch (err) {
          callback(/** @type {Error} */ (err));

          return;
        }
      }

      callback(null, css, map);
    },
  );
}
