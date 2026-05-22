import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  context: __dirname,
  entry: "./index.js",
  output: {
    path: path.join(__dirname, "./tmp"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.styl$/,
        use: [
          {
            loader: path.join(__dirname, "./testLoader.js"),
          },
          {
            loader: path.join(__dirname, "../../../dist/cjs.js"),
            options: {},
          },
        ],
      },
    ],
  },
};
