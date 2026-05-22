"use strict";

/**
 * @param {string} content content
 * @param {object=} sourceMap source map
 * @returns {string} test loader output
 */
function testLoader(content, sourceMap) {
  const result = { css: content };

  if (sourceMap) {
    result.map = sourceMap;
  }

  return `export default ${JSON.stringify(result)}`;
}

module.exports = testLoader;
