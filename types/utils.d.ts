export type LoaderContext = import("webpack").LoaderContext<LoaderOptions>;
export type Renderer = import("stylus/lib/renderer.js");
export type RenderOptions = import("stylus").RenderOptions;
export type StylusResolveUrlOptions = {
  /**
   * true when no need to check on disk, otherwise false
   */
  nocheck?: boolean | undefined;
  /**
   * additional paths
   */
  paths?: string[] | undefined;
};
export type StylusPluginFn = (renderer: EXPECTED_ANY) => void;
export type StylusSourceMapOptions = {
  /**
   * append the source map URL comment to the CSS.
   */
  comment?: boolean | undefined;
  /**
   * root URL for the source files.
   */
  sourceRoot?: string | undefined;
  /**
   * base path to resolve relative source map paths.
   */
  basePath?: string | undefined;
  /**
   * embed the source map directly into the CSS as Base64.
   */
  inline?: boolean | undefined;
};
export type NoTypesStylusOptions = {
  /**
   * destination
   */
  dest?: string | undefined;
  /**
   * stylus plugins
   */
  use?: (StylusPluginFn[] | StylusPluginFn) | undefined;
  /**
   * files to import
   */
  import?: string[] | undefined;
  /**
   * include paths
   */
  include?: string[] | undefined;
  /**
   * true if compressed output, otherwise false
   */
  compress?: boolean | undefined;
  /**
   * true if include CSS on `@import`, otherwise false
   */
  includeCSS?: boolean | undefined;
  /**
   * true if hoist at-rules, otherwise false
   */
  hoistAtrules?: boolean | undefined;
  /**
   * true if line numbers are emitted, otherwise false
   */
  lineNumbers?: boolean | undefined;
  /**
   * true if cache is disabled, otherwise false
   */
  disableCache?: boolean | undefined;
  /**
   * source map
   */
  sourcemap?: (boolean | StylusSourceMapOptions) | undefined;
  /**
   * `resolveURL` options
   */
  resolveURL?: (boolean | StylusResolveUrlOptions) | undefined;
  /**
   * list of definitions
   */
  define?:
    | (
        | Record<string, EXPECTED_ANY>
        | ([string, EXPECTED_ANY] | [string, EXPECTED_ANY, boolean])[]
      )
    | undefined;
  /**
   * list of imports
   */
  _imports?:
    | {
        path: string;
      }[]
    | undefined;
};
export type StylusOptions = RenderOptions & NoTypesStylusOptions;
export type LoaderOptions = {
  /**
   * stylus implementation
   */
  implementation?:
    | (string | ((source: string, options: StylusOptions) => Renderer))
    | undefined;
  /**
   * stylus options
   */
  stylusOptions?:
    | (StylusOptions | ((loaderContext: LoaderContext) => StylusOptions))
    | undefined;
  /**
   * true if source map is enabled, otherwise false
   */
  sourceMap?: boolean | undefined;
  /**
   * true if webpack importer is enabled, otherwise false
   */
  webpackImporter?: boolean | undefined;
  /**
   * prepends/appends `Stylus` code to the actual entry file
   */
  additionalData?:
    | (
        | string
        | ((
            content: string,
            loaderContext: LoaderContext,
          ) => string | Promise<string>)
      )
    | undefined;
};
export type StylusError = Error & {
  filename?: string;
};
export type RawSourceMap = {
  /**
   * version
   */
  version: number;
  /**
   * sources
   */
  sources: string[];
  /**
   * names
   */
  names: string[];
  /**
   * source root
   */
  sourceRoot?: string | undefined;
  /**
   * sources content
   */
  sourcesContent?: string[] | undefined;
  /**
   * mappings
   */
  mappings: string;
  /**
   * file
   */
  file?: string | undefined;
};
export type Resolver = (context: string, request: string) => Promise<string>;
export type Dependency = {
  /**
   * original line number
   */
  originalLineno: number;
  /**
   * original column
   */
  originalColumn: number;
  /**
   * original node path
   */
  originalNodePath: string;
  /**
   * resolved path(s)
   */
  resolved: undefined | string | string[] | Promise<string | string[]>;
  /**
   * resolve error, when failed
   */
  error?: Error | undefined;
};
export type EXPECTED_ANY = any;
/**
 * @param {LoaderContext} loaderContext loader context
 * @param {string} code code
 * @param {StylusOptions} options stylus options
 * @returns {Promise<Evaluator>} custom evaluator class
 */
export function createEvaluator(
  loaderContext: LoaderContext,
  code: string,
  options: StylusOptions,
): Promise<{
  new (): {};
}>;
/**
 * This function is not Webpack-specific and can be used by tools wishing to mimic `stylus-loader`'s behaviour, so its signature should not be changed.
 * @param {LoaderContext} loaderContext loader context
 * @param {LoaderOptions["implementation"]} implementation stylus implementation
 * @returns {Promise<(source: string, options: StylusOptions) => Renderer>} resolved stylus implementation
 */
export function getStylusImplementation(
  loaderContext: LoaderContext,
  implementation: LoaderOptions["implementation"],
): Promise<(source: string, options: StylusOptions) => Renderer>;
/**
 * Derives the stylus options from the loader context and normalizes its values with sane defaults.
 * @param {LoaderContext} loaderContext loader context
 * @param {LoaderOptions} loaderOptions loader options
 * @returns {Promise<StylusOptions>} stylus options
 */
export function getStylusOptions(
  loaderContext: LoaderContext,
  loaderOptions: LoaderOptions,
): Promise<StylusOptions>;
/**
 * @param {RawSourceMap} map source map
 * @param {string} rootContext root context
 * @returns {RawSourceMap} normalized source map
 */
export function normalizeSourceMap(
  map: RawSourceMap,
  rootContext: string,
): RawSourceMap;
/**
 * @param {LoaderContext["fs"]} inputFileSystem input file system
 * @param {string} filepath file path
 * @returns {Promise<Buffer>} file contents
 */
export function readFile(
  inputFileSystem: LoaderContext["fs"],
  filepath: string,
): Promise<Buffer>;
/**
 * @param {LoaderContext} loaderContext loader context
 * @param {Resolver} fileResolver file resolver
 * @param {Resolver} globResolver glob resolver
 * @param {boolean} isGlob true when filename is a glob pattern, otherwise false
 * @param {string} context context
 * @param {string} filename filename
 * @returns {Promise<string | string[]>} resolved filename or list of files (when glob)
 */
export function resolveFilename(
  loaderContext: LoaderContext,
  fileResolver: Resolver,
  globResolver: Resolver,
  isGlob: boolean,
  context: string,
  filename: string,
): Promise<string | string[]>;
/**
 * @param {{ nocheck?: boolean, paths?: string[] } | boolean=} options url resolver options
 * @returns {EXPECTED_ANY} url resolver function
 */
export function urlResolver(
  options?:
    | (
        | {
            nocheck?: boolean;
            paths?: string[];
          }
        | boolean
      )
    | undefined,
): EXPECTED_ANY;
