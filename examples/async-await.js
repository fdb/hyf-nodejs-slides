const fs = require('fs').promises;

async function convertFileToUpperCase(inputFile, outputFile) {
  if (!(await fs.exists)) return;
  const text = await fs.readFile(inputFile, 'utf-8');
  await fs.writeFile(outputFile, text.toUpperCase());
  console.log('Done');
}

convertFileToUpperCase(process.argv[2], process.argv[3]);
