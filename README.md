<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![discussion][discussion]][discussion-url]
[![size][size]][size-url]

# stylus-loader

A Stylus loader for webpack. Compiles Stylus files into CSS.

## Getting Started

To begin, you'll need to install `stylus` and `stylus-loader`:

```console
npm install stylus stylus-loader --save-dev
```

or

```console
yarn add -D stylus stylus-loader
```

or

```console
pnpm add -D stylus stylus-loader
```

Then add the loader to your `webpack` configuration. For example:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        // Uses the built-in CSS support of webpack, i.e. `.module.styl` files
        // are treated as CSS modules, other files are treated as plain CSS
        type: "css/auto",
        // Compiles Stylus to CSS
        use: ["stylus-loader"],
      },
    ],
  },
  experiments: {
    // Enables the built-in CSS support of webpack
    css: true,
  },
};
```

> [!NOTE]
>
> The built-in CSS support of webpack requires `experiments.css` to be enabled.
> Alternatively you can still chain the loader with [`css-loader`](https://github.com/webpack/css-loader) and [`style-loader`](https://github.com/webpack/style-loader) (or the [`mini-css-extract-plugin`](https://github.com/webpack/mini-css-extract-plugin)), see [Using `css-loader` and `style-loader`](#using-css-loader-and-style-loader).

Finally, run `webpack` using the method you normally use (e.g., via CLI or an npm script).

## Options

- **[`stylusOptions`](#stylusOptions)**
- **[`sourceMap`](#sourcemap)**
- **[`webpackImporter`](#webpackimporter)**
- **[`additionalData`](#additionalData)**
- **[`implementation`](#implementation)**

### `stylusOptions`

Type:

```ts
type stylusOptions =
  | {
      use: (string | ((stylusOptions: StylusOptions) => void))[];
      include: string[];
      import: string[];
      define: any[];
      includeCSS: false;
      resolveURL: boolean | object;
      lineNumbers: boolean;
      hoistAtrules: boolean;
      compress: boolean;
    }
  | ((loaderContext: LoaderContext) => string[]);
```

Default: `{}`

You can pass any Stylus specific options to the `stylus-loader` through the `stylusOptions` property in the [loader options](https://webpack.js.org/configuration/module/#ruleoptions--rulequery).

See the [Stylus documentation](https://stylus-lang.com/docs/js.html).

Options in dash-case should be written in camelCase.

#### `object`

Use an object to pass options through to Stylus.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              stylusOptions: {
                // eslint-disable-next-line jsdoc/no-restricted-syntax
                /**
                 * Specify Stylus plugins to use. Plugins may be passed as
                 * strings instead of importing them in your Webpack config.
                 * @type {(string | (renderer: object) => void)[]}
                 * @default []
                 */
                use: ["nib"],

                /**
                 * Add path(s) to the import lookup paths.
                 * @type {string[]}
                 * @default []
                 */
                include: [path.join(__dirname, "src/styl/config")],

                /**
                 * Import the specified Stylus files/paths.
                 * @type {string[]}
                 * @default []
                 */
                import: ["nib", path.join(__dirname, "src/styl/mixins")],

                /**
                 * Define Stylus variables or functions.
                 * @type {[string, string | number | boolean, boolean?] | Record<string, string | number | boolean>}
                 * @default {}
                 */
                // Array is the recommended syntax: [key, value, raw]
                define: [
                  ["$development", process.env.NODE_ENV === "development"],
                  ["rawVar", 42, true],
                ],
                // Object is deprecated syntax (there is no possibility to specify "raw')
                // define: {
                //   $development: process.env.NODE_ENV === 'development',
                //   rawVar: 42,
                // },

                /**
                 * Include regular CSS on \@import.
                 * @type {boolean}
                 * @default false
                 */
                includeCSS: false,

                /**
                 * Resolve relative url()'s inside imported files.
                 * @see https://stylus-lang.com/docs/js.html#stylusresolveroptions
                 * @type {boolean | { nocheck?: boolean, paths?: string[] }}
                 * @default { nocheck: true }
                 */
                resolveURL: true,
                // resolveURL: { nocheck: true },

                /**
                 * Emits comments in the generated CSS indicating the corresponding Stylus line.
                 * @see https://stylus-lang.com/docs/executable.html
                 * @type {boolean}
                 * @default false
                 */
                lineNumbers: true,

                /**
                 * Move \@import and \@charset to the top.
                 * @see https://stylus-lang.com/docs/executable.html
                 * @type {boolean}
                 * @default false
                 */
                hoistAtrules: true,

                /**
                 * Compress CSS output.
                 * In the "production" mode is `true` by default
                 * @see https://stylus-lang.com/docs/executable.html
                 * @type {boolean}
                 * @default false
                 */
                compress: true,
              },
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

#### `function`

Allows setting the options passed through to Stylus based off of the loader context.

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              stylusOptions: (loaderContext) => {
                // More information about available properties https://webpack.js.org/api/loaders/
                const { resourcePath, rootContext } = loaderContext;
                const relativePath = path.relative(rootContext, resourcePath);

                if (relativePath === "styles/foo.styl") {
                  return {
                    paths: ["absolute/path/c", "absolute/path/d"],
                  };
                }

                return {
                  paths: ["absolute/path/a", "absolute/path/b"],
                };
              },
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

### `sourceMap`

Type:

```ts
type sourceMap = boolean;
```

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

### `webpackImporter`

Type:

```ts
type webpackImporter = boolean;
```

Default: `true`

Enables/disables the default Webpack importer.

This can improve performance in some cases.
Use it with caution because aliases and `@import` at-rules starting with `~` will not work.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              webpackImporter: false,
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

### `additionalData`

Type:

```ts
type additionalData =
  | string
  | ((
      content: string | Buffer,
      loaderContext: LoaderContext,
      meta: any,
    ) => string);
```

Default: `undefined`

Prepends `Stylus` code before the actual entry file.
In this case, the `stylus-loader` will not override the source but will simply **prepend** the entry's content.

This is especially useful when some of your Stylus variables depend on the environment.

> [!NOTE]
>
> Since you're injecting code, this will break the source mappings in your entry file.
> Often there's a simpler solution than this, such as using multiple Stylus entry files.

#### `string`

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              additionalData: `@env: ${process.env.NODE_ENV};`,
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

#### `function`

##### Sync

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              additionalData: (content, loaderContext) => {
                // More information about available properties https://webpack.js.org/api/loaders/
                const { resourcePath, rootContext } = loaderContext;
                const relativePath = path.relative(rootContext, resourcePath);

                if (relativePath === "styles/foo.styl") {
                  return `value = 100px${content}`;
                }

                return `value = 200px${content}`;
              },
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

##### Async

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              additionalData: async (content, loaderContext) => {
                // More information about available properties https://webpack.js.org/api/loaders/
                const { resourcePath, rootContext } = loaderContext;
                const relativePath = path.relative(rootContext, resourcePath);

                if (relativePath === "styles/foo.styl") {
                  return `value = 100px${content}`;
                }

                return `value = 200px${content}`;
              },
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

### `implementation`

Type:

```ts
type implementation = (() => typeof import("stylus")) | string;
```

The `implementation` option allows you to specify which `Stylus implementation` to use.
It overrides the locally installed `peerDependency` version of `stylus`.

#### `function`

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              implementation: require("stylus"),
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

#### `string`

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              implementation: require.resolve("stylus"),
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

## Examples

### Normal Usage

Set the module `type` to `css/auto` and enable `experiments.css` to let webpack handle the generated CSS with its built-in CSS support, without any extra loaders or plugins.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto", // Handles the generated CSS using the built-in CSS support of webpack
        use: ["stylus-loader"], // Compiles Stylus to CSS
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

The `css/auto` module type treats `*.module.styl` files as [CSS modules](#css-modules) and any other file as plain CSS.
Use `type: "css"` to always treat the file as plain CSS, or `type: "css/module"` to always treat it as a CSS module.

### Using `css-loader` and `style-loader`

The built-in CSS support of webpack is not mandatory, you can still chain the `stylus-loader` with [`css-loader`](https://github.com/webpack/css-loader) and [`style-loader`](https://github.com/webpack/style-loader) to immediately apply all styles to the DOM.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        use: [
          {
            loader: "style-loader", // Creates style nodes from JS strings
          },
          {
            loader: "css-loader", // Translates CSS into CommonJS
          },
          {
            loader: "stylus-loader", // Compiles Stylus to CSS
          },
        ],
      },
    ],
  },
};
```

Note that in this case the `type` and `experiments.css` options should not be set for this rule, and options like `sourceMap` have to be enabled for the `css-loader` too.

### Source maps

To enable sourcemaps for CSS, you'll need to pass the `sourceMap` property in the loader's options.
If this is not passed, the loader will respect the setting for webpack source maps, set in `devtool`.

**webpack.config.js**

```javascript
module.exports = {
  devtool: "source-map", // any "source-map"-like devtool is possible
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

### Using nib with stylus

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              stylusOptions: {
                use: [require("nib")()],
                import: ["nib"],
              },
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

### Import JSON files

Stylus does not provide resolving capabilities in the `json()` function.
Therefore webpack resolver does not work for `.json` files.
To handle this, use a [`stylus resolver`](#stylus-resolver).

**index.styl**

```styl
// Suppose the file is located here `node_modules/vars/vars.json`
json('vars.json')

@media queries-small
  body
    display nope

```

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              stylusOptions: {
                // Specify the path. where to find files
                paths: ["node_modules/vars"],
              },
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

### In production

The built-in CSS support of webpack always extracts style sheets into dedicated files, so your styles are not dependent on JavaScript, which improves performance and cacheability.
The name of the generated files can be configured using the [`output.cssFilename`](https://webpack.js.org/configuration/output/#outputcssfilename) and [`output.cssChunkFilename`](https://webpack.js.org/configuration/output/#outputcsschunkfilename) options.

When you chain the loader with `css-loader` and `style-loader` instead, it's recommended to extract the style sheets into a dedicated CSS file in production using the [MiniCssExtractPlugin](https://github.com/webpack/mini-css-extract-plugin). This way your styles are not dependent on JavaScript.

### webpack resolver

Webpack provides an [advanced mechanism to resolve files](https://webpack.js.org/configuration/resolve/).
The `stylus-loader` applies the webpack resolver when processing queries.
Thus you can import your Stylus modules directly from `node_modules`.

```styl
@import 'bootstrap-styl/bootstrap/index.styl';
```

Using `~` prefix is deprecated and can be removed from your code (**we recommended**), but we still support it for historical reasons.

Why you can removed it? The loader will first try to resolve `@import`/`@require` as relative, if it cannot be resolved, the loader will try to resolve `@import`/`@require` inside [`node_modules`](https://webpack.js.org/configuration/resolve/#resolvemodules).

Just prepend them with a `~` which tells webpack to look up the [`modules`](https://webpack.js.org/configuration/resolve/#resolvemodules).

```styl
@import "~bootstrap-styl/bootstrap/index.styl";
```

It's important to only prepend it with `~`, because `~/` resolves to the home-directory, which is different.

Webpack needs to distinguish between `bootstrap` and `~bootstrap`, because CSS and Stylus files have no special syntax for importing relative files.

Writing `@import "file"` is the same as `@import "./file";`

### Stylus resolver

If you specify the `paths` option, modules will be searched in the given `paths`.
This is the default Stylus behavior.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: [
          {
            loader: "stylus-loader",
            options: {
              stylusOptions: {
                paths: [path.resolve(__dirname, "node_modules")],
              },
            },
          },
        ],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

### Extracting style sheets

Bundling CSS with webpack has some nice advantages like referencing images and fonts with hashed URLs or [hot module replacement](https://webpack.js.org/concepts/hot-module-replacement/) in development.
In production, on the other hand, it's not a good idea to apply your style sheets depending on JS execution.
Rendering may be delayed or even a [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) might be visible. Thus it's often still better to have them as separate files in your final production build.

The built-in CSS support of webpack does this out of the box: every entry point and chunk gets its own style sheet, no extra plugin required.
When you chain the loader with the `css-loader` instead, use the [MiniCssExtractPlugin](https://github.com/webpack/mini-css-extract-plugin) to extract a style sheet from the bundle.

### CSS modules

With the built-in CSS support of webpack, `*.module.styl` files are treated as [CSS modules](https://github.com/css-modules/css-modules) when the module `type` is `css/auto`, and all files are treated as CSS modules when the module `type` is `css/module`:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        type: "css/auto",
        use: ["stylus-loader"],
      },
    ],
  },
  experiments: {
    css: true,
  },
};
```

**index.js**

```js
import * as styles from "./style.module.styl";

document.body.className = styles.box;
```

## Contributing

We welcome all contributions!
If you're new here, please take a moment to review our contributing guidelines before submitting issues or pull requests.

[CONTRIBUTING](https://github.com/webpack/stylus-loader?tab=contributing-ov-file#contributing)

## License

[MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/stylus-loader.svg
[npm-url]: https://npmjs.com/package/stylus-loader
[node]: https://img.shields.io/node/v/stylus-loader.svg
[node-url]: https://nodejs.org
[tests]: https://github.com/webpack/stylus-loader/workflows/stylus-loader/badge.svg
[tests-url]: https://github.com/webpack/stylus-loader/actions
[cover]: https://codecov.io/gh/webpack/stylus-loader/branch/main/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack/stylus-loader
[discussion]: https://img.shields.io/github/discussions/webpack/webpack
[discussion-url]: https://github.com/webpack/webpack/discussions
[size]: https://packagephobia.now.sh/badge?p=stylus-loader
[size-url]: https://packagephobia.now.sh/result?p=stylus-loader
