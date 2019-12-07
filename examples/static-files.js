const express = require('express');

const app = express();
app.use('/static', express.static('images'));

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.end(`<html><img src="/static/cat.jpg" alt="Cat"></html>`);
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`);
});
