const express = require('express');
const PDFDocument = require('pdfkit');
const app = express();
const port = process.env.PORT || 5555;

app.get('/', (req, res) => {
  const name = req.query.name || 'Stranger';
  const doc = new PDFDocument();
  doc.pipe(res);
  doc.text(`Hello, ${name}!`);
  doc.end();
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`);
});
