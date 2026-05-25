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
export default function stylusLoader(
  this: import("webpack").LoaderContext<import("./utils.js").LoaderOptions>,
  source: string,
): Promise<void>;
export type LoaderContext = import("webpack").LoaderContext<LoaderOptions>;
export type Schema = import("schema-utils/declarations/validate").Schema;
export type LoaderOptions = import("./utils.js").LoaderOptions;
export type StylusError = import("./utils.js").StylusError;
export type StylusOptions = import("./utils.js").StylusOptions;
export type EXPECTED_ANY = import("./utils.js").EXPECTED_ANY;
