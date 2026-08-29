import path from "node:path";
import { fileURLToPath } from "node:url";

import { Volume, createFsFromVolume } from "memfs";
import webpack from "webpack";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates a compiler which handles the generated CSS using the built-in CSS
 * support of webpack (i.e. `experiments.css` and the `css/auto` module type),
 * like the examples in the `README.md`.
 * @param {string} fixture fixture
 * @param {object=} loaderOptions loader options
 * @param {object=} config webpack config
 * @returns {import("webpack").Compiler} compiler
 */
export default (fixture, loaderOptions = {}, config = {}) => {
  const fullConfig = {
    mode: "development",
    devtool: config.devtool || false,
    context: path.resolve(__dirname, "../fixtures"),
    entry: path.resolve(__dirname, "../fixtures", fixture),
    output: {
      path: path.resolve(__dirname, "../outputs"),
      filename: "[name].bundle.js",
      chunkFilename: "[name].chunk.js",
      cssFilename: "[name].bundle.css",
      cssChunkFilename: "[name].chunk.css",
      assetModuleFilename: "[name][ext]",
      library: "stylusLoaderExport",
    },
    module: {
      rules: [
        {
          test: /\.styl$/i,
          // Handles the generated CSS using the built-in CSS support of webpack
          type: "css/auto",
          use: [
            {
              loader: path.resolve(__dirname, "../../src/index.js"),
              options: loaderOptions || {},
            },
          ],
        },
      ],
    },
    experiments: {
      // Enables the built-in CSS support of webpack
      css: true,
    },
    plugins: [],
    resolve: {
      extensions: [".js", ".css", ".styl"],
    },
    ...config,
  };

  const compiler = webpack(fullConfig);

  if (!config.outputFileSystem) {
    compiler.outputFileSystem = createFsFromVolume(new Volume());
  }

  return compiler;
};
