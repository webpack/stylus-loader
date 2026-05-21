---
"stylus-loader": major
---

Migrated source and published bundles to ECMAScript modules. The package
is now ESM (`"type": "module"`) and exposes both an ESM build at
`./dist/esm/index.js` and a CommonJS build at `./dist/cjs/index.js` via
the `exports` field. The `main` entry now points to `./dist/cjs/index.js`.
