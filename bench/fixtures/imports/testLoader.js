function testLoader(content) {
  return `export default ${JSON.stringify(content)}`;
}

export default testLoader;
