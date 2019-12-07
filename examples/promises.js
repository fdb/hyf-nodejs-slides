const fs = require('fs').promises;

function convertFileToUpperCase(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    fs.readFile(inputFile, 'utf-8')
      .then(text => {
        fs.writeFile(outputFile, text.toUpperCase())
          .then(() => resolve())
          .catch(err => console.error(`Write error: ${err}`));
      })
      .catch(err => console.error(`Read error: ${err}`));
  });
}

convertFileToUpperCase(process.argv[2], process.argv[3]).then(() => {
  console.log('Done.');
})
