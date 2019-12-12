const fs = require('fs').promises;
const path = require('path');

function choice(l) {
  const randomIndex = Math.floor(Math.random() * l.length);
  return l[randomIndex];
}

async function main() {
  const quotesFile = path.join(__dirname, 'data', 'quotes.txt');
  let text = await fs.readFile(quotesFile, 'utf-8');
  text = text.trim();
  const quotes = text.split('\n');
  const quote = choice(quotes);
  console.log(quote);
}

main();
