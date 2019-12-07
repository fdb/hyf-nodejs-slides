const fs = require('fs').promises;

async function encrypt(filename) {
  let text = await fs.readFile(filename, 'utf-8');
  text = text.toUpperCase();
  let output = '';
  for (let letter of text) {
    if (letter >= 'A' && letter <= 'Z') {
      let code = letter.charCodeAt(0) - 65;
      code = (code + 13) % 26;
      letter = String.fromCharCode(code + 65);
    }
    output += letter;
  }
  console.log(output);
}

encrypt(process.argv[2]);
