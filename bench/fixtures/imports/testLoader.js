/**
 * @param {string} content content
 * @returns {string} test loader output
 */
function testLoader(content) {
  return `export default ${JSON.stringify(content)}`;
}

export default testLoader;
