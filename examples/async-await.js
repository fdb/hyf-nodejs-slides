const fs = require('fs').promises;

async function convertFileToUpperCase(inputFile, outputFile) {
  try {
    const text = await fs.readFile(inputFile, 'utf-8');
    await fs.writeFile(outputFile, text.toUpperCase());
    console.log('Done');
  } catch (err) {
    console.error(`Error: ${err}.`);
  }
}

convertFileToUpperCase(process.argv[2], process.argv[3]);
