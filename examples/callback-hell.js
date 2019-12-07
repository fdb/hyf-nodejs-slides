const fs = require('fs');

function convertFileToUpperCase(inputFile, outputFile, callback) {
  fs.exists(inputFile, (exists) => {
    if (!exists) return;
    fs.readFile(inputFile, 'utf-8', (err, text) => {
      if (err) return;
      fs.writeFile(outputFile, text.toUpperCase(), (err) => {
        callback(err);
      });
    });
  });
}

convertFileToUpperCase(process.argv[2], process.argv[3], () => {
  console.log('Done');
});
