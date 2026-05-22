import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import Benchmark from "benchmark";
import { Volume, createFsFromVolume } from "memfs";
import stylus from "stylus";
import webpack from "webpack";

import importWebpackConfig from "./fixtures/imports/webpack.config.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveOnComplete(fn) {
  return (...args) => {
    const _this = this;

    return new Promise((resolve) => {
      const result = fn.apply(_this, args);
      result.on("complete", () => {
        resolve();
      });
    });
  };
}

const sourceFile = path.resolve(__dirname, "fixtures", "imports", "index.styl");
const source = fs.readFileSync(sourceFile).toString();

const styl = stylus(source);

const compiler = webpack(importWebpackConfig);

compiler.outputFileSystem = createFsFromVolume(new Volume());

Promise.resolve()
  .then(
    resolveOnComplete(() => {
      const suite = new Benchmark.Suite();
      suite
        .add("Native stylus", {
          defer: true,
          fn(deferred) {
            styl
              .set("filename", sourceFile)
              // eslint-disable-next-line no-unused-vars
              .render((error, css) => {
                if (error) {
                  throw error;
                }

                deferred.resolve();
              });
          },
        })
        .on("cycle", (event) => {
          // eslint-disable-next-line no-console
          console.log(String(event.target));
        })
        .run({ async: true });

      return suite;
    }),
  )
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .then(
    resolveOnComplete(() => {
      const suite = new Benchmark.Suite();
      suite
        .add("Stylus loader", {
          defer: true,
          fn(deferred) {
            compiler.run((error, _stats) => {
              if (error) {
                throw error;
              }

              deferred.resolve();
            });
          },
        })
        .on("cycle", (event) => {
          // eslint-disable-next-line no-console
          console.log(String(event.target));
        })
        .run({ async: true });

      return suite;
    }),
  );
