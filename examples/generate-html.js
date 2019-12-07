const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const name = req.query.name || 'Stranger';
  res.end(`<html><h1>Hello, ${name}!</h1></html>`);
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`);
});
