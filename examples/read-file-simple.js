const fs = require('fs').promises;

async function readFile(filename) {
  let text = await fs.readFile(filename, 'utf-8');
  console.log(text);
}

const filename = process.argv[2];
readFile(filename);
