const fs = require('fs');

fs.readFile('message.txt', 'utf-8', (err, text) => {
  if (err) {
    console.error(`Could not read the file: ${err}.`);
    return;
  }
  console.log(text);
});
