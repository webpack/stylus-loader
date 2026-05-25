import path from "node:path";
// eslint-disable-next-line n/no-deprecated-api
import { parse, pathToFileURL } from "node:url";

import normalizePath from "normalize-path";
import stylus from "stylus";
// @ts-expect-error no types are shipped for this internal entry point
import DepsResolver from "stylus/lib/visitor/deps-resolver.js";
import { escapePath, glob, isDynamicPattern } from "tinyglobby";

// eslint-disable-next-line jsdoc/reject-any-type
/** @typedef {any} EXPECTED_ANY */

const {
  Compiler: StylusCompiler,
  Evaluator: StylusEvaluator,
  Parser: StylusParser,
  nodes,
  utils,
} = stylus;
const Compiler = StylusCompiler;
const Evaluator = StylusEvaluator;
const Parser = StylusParser;

/** @typedef {import("webpack").LoaderContext<LoaderOptions>} LoaderContext */
/** @typedef {import("stylus/lib/renderer.js")} Renderer */

/** @typedef {import("stylus").RenderOptions} RenderOptions */

/**
 * @typedef {object} StylusResolveUrlOptions
 * @property {boolean=} nocheck true when no need to check on disk, otherwise false
 */

/**
 * @callback StylusPluginFn
 * @param {object} renderer renderer
 * @returns {void}
 */

/**
 * @typedef {object} StylusSourceMapOptions
 * @property {boolean=} comment append the source map URL comment to the CSS.
 * @property {string=} sourceRoot root URL for the source files.
 * @property {string=} basePath base path to resolve relative source map paths.
 * @property {boolean=} inline embed the source map directly into the CSS as Base64.
 */

/**
 * @typedef {object} NoTypesStylusOptions
 * @property {string=} dest destination
 * @property {string | StylusPluginFn | (string | StylusPluginFn)[]=} use stylus plugins
 * @property {string[]=} import files to import
 * @property {string[]=} include include paths
 * @property {boolean=} compress true if compressed output, otherwise false
 * @property {boolean=} includeCSS true if include CSS on `@import`, otherwise false
 * @property {boolean=} hoistAtrules true if hoist at-rules, otherwise false
 * @property {boolean=} lineNumbers true if line numbers are emitted, otherwise false
 * @property {boolean=} disableCache true if cache is disabled, otherwise false
 * @property {boolean | StylusSourceMapOptions=} sourcemap source map
 * @property {boolean | StylusResolveUrlOptions=} resolveURL `resolveURL` options
 * @property {(Record<string, EXPECTED_ANY> | ([string, EXPECTED_ANY] | [string, EXPECTED_ANY, boolean])[])=} define list of definitions
 * @property {{ path: string }[]=} _imports list of imports
 */

/** @typedef {RenderOptions & NoTypesStylusOptions} StylusOptions */

/**
 * @typedef {object} LoaderOptions
 * @property {(string | ((source: string, options: StylusOptions) => Renderer))=} implementation stylus implementation
 * @property {(StylusOptions | ((loaderContext: LoaderContext) => StylusOptions))=} stylusOptions stylus options
 * @property {boolean=} sourceMap true if source map is enabled, otherwise false
 * @property {boolean=} webpackImporter true if webpack importer is enabled, otherwise false
 * @property {(string | ((content: string, loaderContext: LoaderContext) => string | Promise<string>))=} additionalData prepends/appends `Stylus` code to the actual entry file
 */

/** @typedef {Error & { filename?: string }} StylusError */

/**
 * @typedef {object} RawSourceMap
 * @property {number} version version
 * @property {string[]} sources sources
 * @property {string[]} names names
 * @property {string=} sourceRoot source root
 * @property {string[]=} sourcesContent sources content
 * @property {string} mappings mappings
 * @property {string=} file file
 */

/** @typedef {(context: string, request: string) => Promise<string>} Resolver */

/**
 * Extracts the non-glob base directory from a glob pattern.
 * Replaces fast-glob's generateTasks()[0].base.
 * @param {string} pattern a glob pattern
 * @returns {string} the static base path, or "." if there is none
 */
function getGlobBase(pattern) {
  const parts = pattern.split("/");
  const base = [];

  for (const part of parts) {
    if (isDynamicPattern(part)) {
      break;
    }

    base.push(part);
  }

  return base.join("/") || ".";
}

// Examples:
// - ~package
// - ~package/
// - ~@org
// - ~@org/
// - ~@org/package
// - ~@org/package/
const IS_MODULE_IMPORT =
  /^~([^/]+|[^/]+\/|@[^/]+[/][^/]+|@[^/]+\/?|@[^/]+[/][^/]+\/)$/;
const MODULE_REQUEST_REGEX = /^[^?]*~/;

/**
 * @param {LoaderContext} loaderContext loader context
 * @returns {boolean} true when mode is production, otherwise false
 */
function isProductionLikeMode(loaderContext) {
  return loaderContext.mode === "production" || !loaderContext.mode;
}

/**
 * Derives the stylus options from the loader context and normalizes its values with sane defaults.
 * @param {LoaderContext} loaderContext loader context
 * @param {LoaderOptions} loaderOptions loader options
 * @returns {Promise<StylusOptions>} stylus options
 */
async function getStylusOptions(loaderContext, loaderOptions) {
  /** @type {StylusOptions} */
  const options =
    typeof loaderOptions.stylusOptions === "function"
      ? loaderOptions.stylusOptions(loaderContext) || {}
      : loaderOptions.stylusOptions || {};
  /** @type {StylusOptions} */
  const stylusOptions = {
    filename: loaderContext.resourcePath,
    dest: path.dirname(loaderContext.resourcePath),
    ...options,
    // Keep track of imported files (used by Stylus CLI watch mode)

    // Don't allow to override, because it is internally
    _imports: [],
  };

  if (typeof stylusOptions.use !== "undefined") {
    const resolve = loaderContext.getResolve({
      dependencyType: "stylus",
      conditionNames: ["..."],
      mainFields: ["main", "..."],
      mainFiles: ["index", "..."],
      extensions: [".js", ".cjs", ".mjs"],
      preferRelative: true,
    });

    stylusOptions.use = await Promise.all(
      (Array.isArray(stylusOptions.use)
        ? stylusOptions.use
        : [stylusOptions.use]
      ).map(async (item) => {
        if (typeof item === "string") {
          try {
            const resolved = await resolve(loaderContext.context, item);

            loaderContext.addBuildDependency(resolved);

            const { default: plugin } = await import(
              pathToFileURL(resolved).href
            );

            return plugin(stylusOptions);
          } catch (error) {
            throw new Error(
              `Failed to load "${item}" Stylus plugin. Are you sure it's installed?\n${error}`,
              { cause: error },
            );
          }
        }

        return item;
      }),
    );
  }

  // https://github.com/stylus/stylus/issues/2119
  stylusOptions.resolveURL =
    typeof stylusOptions.resolveURL === "boolean" && !stylusOptions.resolveURL
      ? false
      : typeof stylusOptions.resolveURL === "object"
        ? { ...stylusOptions.resolveURL }
        : { nocheck: true };

  if (
    typeof stylusOptions.compress === "undefined" &&
    isProductionLikeMode(loaderContext)
  ) {
    stylusOptions.compress = true;
  }

  return stylusOptions;
}

/**
 * This function is not Webpack-specific and can be used by tools wishing to mimic `stylus-loader`'s behaviour, so its signature should not be changed.
 * @param {LoaderContext} loaderContext loader context
 * @param {LoaderOptions["implementation"]} implementation stylus implementation
 * @returns {Promise<(source: string, options: StylusOptions) => Renderer>} resolved stylus implementation
 */
async function getStylusImplementation(loaderContext, implementation) {
  if (!implementation || typeof implementation === "string") {
    const specifier = implementation || "stylus";
    const { default: resolved } = await import(
      path.isAbsolute(specifier) ? pathToFileURL(specifier).href : specifier
    );

    return resolved;
  }

  return implementation;
}

/**
 * @param {LoaderContext} loaderContext loader context
 * @param {string} filename filename
 * @returns {string[]} possible requests
 */
function getPossibleRequests(loaderContext, filename) {
  let request = filename;

  // A `~` makes the url an module
  if (MODULE_REQUEST_REGEX.test(filename)) {
    request = request.replace(MODULE_REQUEST_REGEX, "");
  }

  if (IS_MODULE_IMPORT.test(filename)) {
    request = request[request.length - 1] === "/" ? request : `${request}/`;
  }

  return [...new Set([request, filename])];
}

/**
 * @param {string} context context
 * @param {string[]} possibleRequests possible requests
 * @param {Resolver} resolve resolver
 * @returns {Promise<string>} resolved request
 */
async function resolveRequests(context, possibleRequests, resolve) {
  if (possibleRequests.length === 0) {
    throw new Error("Not found");
  }

  let result;

  try {
    result = await resolve(context, possibleRequests[0]);
  } catch (error) {
    const [, ...tailPossibleRequests] = possibleRequests;

    if (tailPossibleRequests.length === 0) {
      throw error;
    }

    result = await resolveRequests(context, tailPossibleRequests, resolve);
  }

  return result;
}

/**
 * @param {LoaderContext} loaderContext loader context
 * @param {Resolver} fileResolver file resolver
 * @param {Resolver} globResolver glob resolver
 * @param {boolean} isGlob true when filename is a glob pattern, otherwise false
 * @param {string} context context
 * @param {string} filename filename
 * @returns {Promise<string | string[]>} resolved filename or list of files (when glob)
 */
async function resolveFilename(
  loaderContext,
  fileResolver,
  globResolver,
  isGlob,
  context,
  filename,
) {
  const possibleRequests = getPossibleRequests(loaderContext, filename);

  let result;

  try {
    result = await resolveRequests(context, possibleRequests, fileResolver);
  } catch (error) {
    if (isGlob) {
      const globBase = getGlobBase(filename);

      if (globBase === ".") {
        throw new Error(
          'Glob resolving without a glob base ("~**/*") is not supported, please specify a glob base ("~package/**/*")',
          { cause: error },
        );
      }

      const possibleGlobRequests = getPossibleRequests(loaderContext, globBase);

      const globResult = await resolveRequests(
        context,
        possibleGlobRequests,
        globResolver,
      );

      loaderContext.addContextDependency(globResult);

      const patterns = filename.replace(
        new RegExp(`^${globBase}`),
        normalizePath(globResult),
      );

      const paths = await glob([patterns], {
        absolute: true,
        cwd: globResult,
      });

      return paths.toSorted().filter((file) => /\.styl$/i.test(file));
    }

    throw error;
  }

  return result;
}

/**
 * @param {LoaderContext["fs"]} inputFileSystem input file system
 * @param {string} filepath file path
 * @returns {Promise<Buffer>} file contents
 */
function readFile(inputFileSystem, filepath) {
  return new Promise((resolve, reject) => {
    inputFileSystem.readFile(filepath, (error, stats) => {
      if (error) {
        reject(error);
      }

      resolve(/** @type {Buffer} */ (stats));
    });
  });
}

const URL_RE = /^(?:url\s*\(\s*)?['"]?(?:[#/]|(?:https?:)?\/\/)/i;

/**
 * @typedef {object} Dependency
 * @property {number} originalLineno original line number
 * @property {number} originalColumn original column
 * @property {string} originalNodePath original node path
 * @property {undefined | string | string[] | Promise<string | string[]>} resolved resolved path(s)
 * @property {Error=} error resolve error, when failed
 */

/**
 * @param {Map<string, Dependency[]>} resolvedDependencies resolved dependencies
 * @param {LoaderContext} loaderContext loader context
 * @param {Resolver} fileResolver file resolver
 * @param {Resolver} globResolver glob resolver
 * @param {Set<string>} seen seen files
 * @param {string} code code
 * @param {string} filename filename
 * @param {StylusOptions} options stylus options
 * @returns {Promise<void>} resolves once dependencies have been collected
 */
async function getDependencies(
  resolvedDependencies,
  loaderContext,
  fileResolver,
  globResolver,
  seen,
  code,
  filename,
  options,
) {
  seen.add(filename);

  // See https://github.com/stylus/stylus/issues/2108
  const newOptions = { ...options, filename, cache: false };
  // @ts-expect-error no types are shipped
  const parser = new Parser(code, newOptions);

  /** @type {EXPECTED_ANY} */
  let ast;

  try {
    // @ts-expect-error no types are shipped
    ast = parser.parse();
  } catch (error) {
    loaderContext.emitError(/** @type {Error} */ (error));

    return;
  }

  /** @type {(Dependency & { resolved?: undefined | string | string[] | Promise<string | string[]> })[]} */
  const dependencies = [];

  class ImportVisitor extends DepsResolver {
    /**
     * @param {import("stylus").nodes.Import} node import node
     * @returns {void}
     */
    visitImport(node) {
      let firstNode = node.path.first;

      if (
        /** @type {import("stylus").nodes.Call} */
        (firstNode).name === "url"
      ) {
        return;
      }

      if (!(/** @type {import("stylus").nodes.String} */ (firstNode).val)) {
        // @ts-expect-error no types are shipped for this
        const evaluator = new Evaluator(ast);

        // @ts-expect-error no types are shipped for this
        firstNode = evaluator.visit(firstNode).first;
      }

      const originalNodePath =
        // @ts-expect-error bad types
        (!firstNode.val.isNull &&
          /** @type {import("stylus").nodes.String} */ (firstNode).val) ||
        /** @type {import("stylus").nodes.Ident} */
        (firstNode).name;
      let nodePath = originalNodePath;

      if (!nodePath) {
        return;
      }

      let found;
      let oldNodePath;

      const literal = /\.css(?:"|$)/.test(nodePath);

      if (!literal && !/\.styl$/i.test(nodePath)) {
        oldNodePath = nodePath;
        nodePath += ".styl";
      }

      const isGlob = isDynamicPattern(nodePath);

      // @ts-expect-error no types are shipped for this
      let { filename, paths } = this;

      if (path.sep === "\\") {
        filename = filename.replace(/^\\\\\?\\/, "");
        paths = paths.map((/** @type {string} */ item) =>
          item.replace(/^\\\\\?\\/, ""),
        );
      }

      found = utils.find(nodePath, paths, filename);

      if (found && path.sep === "\\") {
        found = found.map((/** @type {string} */ item) =>
          item.replace(/^\/\/\?\//, ""),
        );
      }

      if (found && isGlob) {
        const globBase = getGlobBase(nodePath);
        const context =
          globBase === "."
            ? path.dirname(filename)
            : path.join(path.dirname(filename), globBase);

        loaderContext.addContextDependency(context);
      }

      if (!found && oldNodePath) {
        found = utils.lookupIndex(oldNodePath, paths, filename);

        if (found && path.sep === "\\") {
          found = found.map((/** @type {string} */ item) =>
            item.replace(/^\/\/\?\//, ""),
          );
        }
      }

      if (found) {
        dependencies.push({
          originalLineno: firstNode.lineno,
          originalColumn: firstNode.column,
          originalNodePath,
          resolved: found.map((/** @type {string} */ item) =>
            path.isAbsolute(item) ? item : path.join(process.cwd(), item),
          ),
        });

        return;
      }

      dependencies.push({
        originalLineno: firstNode.lineno,
        originalColumn: firstNode.column,
        originalNodePath,
        resolved: resolveFilename(
          loaderContext,
          fileResolver,
          globResolver,
          isGlob,
          path.dirname(filename),
          originalNodePath,
        ),
      });
    }
  }

  // @ts-expect-error no types are shipped for this
  const visitor = new ImportVisitor(ast, newOptions);

  // @ts-expect-error no types are shipped for this
  visitor.visit(ast);

  await Promise.all(
    [...dependencies].map(async (result) => {
      let { resolved } = result;

      try {
        resolved = await resolved;
      } catch (err) {
        const r = result;

        delete r.resolved;

        result.error = /** @type {Error} */ (err);

        return;
      }

      const isArray = Array.isArray(resolved);

      // `stylus` returns forward slashes on windows

      result.resolved = isArray
        ? /** @type {string[]} */ (resolved).map((item) => path.normalize(item))
        : path.normalize(/** @type {string} */ (resolved));

      const dependenciesOfDependencies = [];

      const items = /** @type {string[]} */ (
        isArray ? result.resolved : [result.resolved]
      );

      for (const dependency of items) {
        // Avoid loop, the file is imported by itself
        if (seen.has(dependency)) {
          return;
        }

        // Avoid search nested imports in .css
        if (path.extname(dependency) === ".css") {
          return;
        }

        loaderContext.addDependency(dependency);

        dependenciesOfDependencies.push(
          (async () => {
            let dependencyCode;

            try {
              dependencyCode = (
                await readFile(loaderContext.fs, dependency)
              ).toString();
            } catch (error) {
              loaderContext.emitError(/** @type {Error} */ (error));
            }

            await getDependencies(
              resolvedDependencies,
              loaderContext,
              fileResolver,
              globResolver,
              seen,
              /** @type {string} */ (dependencyCode),
              dependency,
              options,
            );
          })(),
        );
      }

      await Promise.all(dependenciesOfDependencies);
    }),
  );

  if (dependencies.length > 0) {
    resolvedDependencies.set(
      filename,
      /** @type {Dependency[]} */ (/** @type {unknown} */ (dependencies)),
    );
  }
}

/**
 * @param {import("stylus").nodes.Block[]} blocks blocks
 * @returns {import("stylus").nodes.Block | undefined} merged block
 */
function mergeBlocks(blocks) {
  /** @type {import("stylus").nodes.Block | undefined} */
  let finalBlock;

  for (const block of blocks) {
    if (finalBlock) {
      for (const node of block.nodes) {
        finalBlock.push(node);
      }
    } else {
      finalBlock = block;
    }
  }

  return finalBlock;
}

/**
 * @param {LoaderContext} loaderContext loader context
 * @param {string} code code
 * @param {StylusOptions} options stylus options
 * @returns {Promise<Evaluator>} custom evaluator class
 */
async function createEvaluator(loaderContext, code, options) {
  const fileResolve = loaderContext.getResolve({
    dependencyType: "stylus",
    conditionNames: ["styl", "stylus", "style", "..."],
    mainFields: ["styl", "style", "stylus", "main", "..."],
    mainFiles: ["index", "..."],
    extensions: [".styl", ".css"],
    restrictions: [/\.(css|styl)$/i],
    preferRelative: true,
  });

  // Get cwd for glob resolution
  // No need extra options, because they do not used when `resolveToContext` is `true`
  const globResolve = loaderContext.getResolve({
    conditionNames: ["styl", "stylus", "style", "..."],
    resolveToContext: true,
    preferRelative: true,
  });

  /** @type {Map<string, Dependency>} */
  const resolvedImportDependencies = new Map();
  /** @type {Map<string, Dependency[]>} */
  const resolvedDependencies = new Map();
  /** @type {Set<string>} */
  const seen = new Set();

  await getDependencies(
    resolvedDependencies,
    loaderContext,
    fileResolve,
    globResolve,
    seen,
    code,
    loaderContext.resourcePath,
    options,
  );

  /** @type {{ importPath: string, resolved: string | string[] | Promise<string | string[]>, error?: Error }[]} */
  const optionsImports = [];

  for (const importPath of options.imports || []) {
    const isGlob = isDynamicPattern(importPath);

    optionsImports.push({
      importPath,
      resolved: resolveFilename(
        loaderContext,
        fileResolve,
        globResolve,
        isGlob,
        path.dirname(loaderContext.resourcePath),
        importPath,
      ),
    });
  }

  await Promise.all(
    optionsImports.map(async (result) => {
      const { importPath } = result;
      let { resolved } = result;

      try {
        resolved = await resolved;
      } catch {
        return;
      }

      const isArray = Array.isArray(resolved);

      // `stylus` returns forward slashes on windows

      result.resolved = isArray
        ? /** @type {string[]} */ (resolved).map((item) => path.normalize(item))
        : path.normalize(/** @type {string} */ (resolved));

      resolvedImportDependencies.set(
        importPath,
        /** @type {Dependency} */ (/** @type {unknown} */ (result)),
      );

      const dependenciesOfImportDependencies = [];

      const items = /** @type {string[]} */ (
        isArray ? result.resolved : [result.resolved]
      );

      for (const dependency of items) {
        dependenciesOfImportDependencies.push(
          (async () => {
            let dependencyCode;

            try {
              dependencyCode = (
                await readFile(loaderContext.fs, dependency)
              ).toString();
            } catch (error) {
              loaderContext.emitError(/** @type {Error} */ (error));
            }

            await getDependencies(
              resolvedDependencies,
              loaderContext,
              fileResolve,
              globResolve,
              seen,
              /** @type {string} */ (dependencyCode),
              dependency,
              options,
            );
          })(),
        );
      }

      await Promise.all(dependenciesOfImportDependencies);
    }),
  );

  return class CustomEvaluator extends Evaluator {
    /**
     * @param {import("stylus").nodes.Import} imported imported
     * @returns {import("stylus").nodes.Block | import("stylus").nodes.Import | undefined} visit result
     */
    visitImport(imported) {
      const self = this;

      // @ts-expect-error internal logic
      self.return += 1;

      // @ts-expect-error no types are shipped for this
      const node = self.visit(imported.path).first;
      const nodePath = (!node.val.isNull && node.val) || node.name;

      // @ts-expect-error internal logic
      self.return -= 1;

      /** @type {Error & { details?: string, missing?: string[] } | undefined} */
      let webpackResolveError;

      if (node.name !== "url" && nodePath && !URL_RE.test(nodePath)) {
        /** @type {Dependency | undefined} */
        let dependency;

        let { filename } = node;

        if (path.sep === "\\") {
          filename = filename.replace(/^\/\/\?\//, "");
        }

        const isEntrypoint = loaderContext.resourcePath === filename;

        if (isEntrypoint) {
          dependency = resolvedImportDependencies.get(nodePath);
        }

        if (!dependency) {
          const dependencies = resolvedDependencies.get(
            path.normalize(filename),
          );

          if (dependencies) {
            dependency = dependencies.find((item) => {
              if (
                item.originalLineno === node.lineno &&
                item.originalColumn === node.column &&
                item.originalNodePath === nodePath
              ) {
                if (item.error) {
                  webpackResolveError = item.error;
                } else {
                  return Boolean(item.resolved);
                }
              }

              return false;
            });
          }
        }

        if (dependency) {
          const { resolved } = dependency;

          if (!Array.isArray(resolved)) {
            // Avoid re globbing when resolved import contains glob characters
            node.string = escapePath(/** @type {string} */ (resolved));
          } else if (resolved.length > 0) {
            let hasError = false;

            /** @type {import("stylus").nodes.Block[]} */
            const blocks = resolved.map((item) => {
              const clonedImported = imported.clone();
              // @ts-expect-error no types are shipped for this
              const clonedNode = self.visit(clonedImported.path).first;

              // Avoid re globbing when resolved import contains glob characters
              clonedNode.string = escapePath(item);

              let result;

              try {
                // @ts-expect-error no types are shipped for this
                result = super.visitImport(clonedImported);
              } catch {
                hasError = true;
              }

              return result;
            });

            if (!hasError) {
              return mergeBlocks(blocks);
            }
          }
        }
      }

      /** @type {import("stylus").nodes.Block | undefined} */
      let result;

      try {
        // @ts-expect-error no types are shipped for this
        result = super.visitImport(imported);
      } catch (error) {
        loaderContext.emitError(
          new Error(
            `Stylus resolver error: ${/** @type {Error} */ (error).message}${
              webpackResolveError
                ? `\n\nWebpack resolver error: ${webpackResolveError.message}${
                    webpackResolveError.details
                      ? `\n\nWebpack resolver error details:\n${webpackResolveError.details}`
                      : ""
                  }${
                    webpackResolveError.missing
                      ? `\n\nWebpack resolver error missing:\n${webpackResolveError.missing.join(
                          "\n",
                        )}`
                      : ""
                  }`
                : ""
            }`,
          ),
        );

        return imported;
      }

      return result;
    }
  };
}

/**
 * @param {{ nocheck?: boolean, paths?: string[] } | boolean=} options url resolver options
 * @returns {EXPECTED_ANY} url resolver function
 */
function urlResolver(options = {}) {
  /** @type {{ nocheck?: boolean, paths?: string[] }} */
  const resolverOptions = typeof options === "boolean" ? {} : options;

  /**
   * @this {import("stylus").Evaluator & { paths: string[], filename: string, includeCSS?: boolean }}
   * @param {import("stylus").nodes.Expression} url url node
   * @returns {import("stylus").nodes.Literal} a Literal node
   */
  function resolver(url) {
    // @ts-expect-error no types are shipped for this
    const compiler = new Compiler(url);
    let { filename } = url;

    if (path.sep === "\\") {
      filename = filename.replace(/^\/\/\?\//, "");
    }

    // @ts-expect-error no types are shipped for this
    compiler.isURL = true;

    // @ts-expect-error no types are shipped for this
    const visitedUrl = url.nodes.map((node) => compiler.visit(node)).join("");
    const splitted = visitedUrl.split("!");
    const parsedUrl = parse(/** @type {string} */ (splitted.pop()));

    // Parse literal
    const literal = new nodes.Literal(`url("${parsedUrl.href}")`);
    let { pathname } = parsedUrl;
    // @ts-expect-error no types are shipped for this
    let { dest } = this.options;

    let tail = "";
    let res;

    // Absolute or hash
    if (parsedUrl.protocol || !pathname || pathname[0] === "/") {
      return literal;
    }

    // Check that file exists
    if (!resolverOptions.nocheck) {
      const _paths = resolverOptions.paths || [];

      // @ts-expect-error bad types
      pathname = utils.lookup(pathname, [
        ..._paths,
        ...(path.sep === "\\"
          ? this.paths.map((/** @type {string} */ item) =>
              path.normalize(item.replace(/^\/\/\?\//, "")),
            )
          : this.paths),
      ]);

      if (path.sep === "\\" && pathname) {
        pathname = pathname.replace(/^\\\\\?\\/, "");
      }

      if (!pathname) {
        return literal;
      }
    }

    if (this.includeCSS && path.extname(pathname) === ".css") {
      return new nodes.Literal(parsedUrl.href);
    }

    if (parsedUrl.search) {
      tail += parsedUrl.search;
    }

    if (parsedUrl.hash) {
      tail += parsedUrl.hash;
    }

    if (dest && path.extname(dest) === ".css") {
      dest = path.dirname(dest);
    }

    res =
      path.relative(
        dest || path.dirname(this.filename),
        resolverOptions.nocheck
          ? path.join(path.dirname(filename), pathname)
          : pathname,
      ) + tail;

    if (path.sep === "\\") {
      res = normalizePath(res);
    }

    splitted.push(res);

    return new nodes.Literal(`url("${splitted.join("!")}")`);
  }

  resolver.options = resolverOptions;
  resolver.raw = true;

  return resolver;
}

const IS_NATIVE_WIN32_PATH = /^[a-z]:[/\\]|^\\\\/i;
const ABSOLUTE_SCHEME = /^[A-Za-z0-9+\-.]+:/;

/**
 * @param {string} source source
 * @returns {"absolute" | "scheme-relative" | "path-absolute" | "path-relative"} a type of URL
 */
function getURLType(source) {
  if (source[0] === "/") {
    if (source[1] === "/") {
      return "scheme-relative";
    }

    return "path-absolute";
  }

  if (IS_NATIVE_WIN32_PATH.test(source)) {
    return "path-absolute";
  }

  return ABSOLUTE_SCHEME.test(source) ? "absolute" : "path-relative";
}

/**
 * @param {RawSourceMap} map source map
 * @param {string} rootContext root context
 * @returns {RawSourceMap} normalized source map
 */
function normalizeSourceMap(map, rootContext) {
  const newMap = map;

  // result.map.file is an optional property that provides the output filename.
  // Since we don't know the final filename in the webpack build chain yet, it makes no sense to have it.

  delete newMap.file;

  newMap.sourceRoot = "";

  newMap.sources = newMap.sources.map((source) => {
    if (path.sep === "\\") {
      source = path.normalize(source.replace(/^\/\/\?\//, ""));
    }

    const sourceType = getURLType(source);

    // Do no touch `scheme-relative`, `path-absolute` and `absolute` types
    if (sourceType === "path-relative") {
      return path.resolve(rootContext, path.normalize(source));
    }

    return source;
  });

  return newMap;
}

export {
  createEvaluator,
  getStylusImplementation,
  getStylusOptions,
  normalizeSourceMap,
  readFile,
  resolveFilename,
  urlResolver,
};
