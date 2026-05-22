import path from "node:path";
import { fileURLToPath } from "node:url";

import { Volume, createFsFromVolume } from "memfs";
import webpack from "webpack";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      library: "stylusLoaderExport",
    },
    module: {
      rules: [
        {
          test: /\.styl$/i,
          rules: [
            {
              loader: path.resolve(__dirname, "./testLoader.cjs"),
            },
            {
              loader: path.resolve(__dirname, "../../src/index.js"),
              options: loaderOptions || {},
            },
          ],
        },
      ],
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
