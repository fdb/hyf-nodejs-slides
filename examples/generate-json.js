const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const name = req.query.name || 'Stranger';
  const result = { status: 'OK', message: `Hello ${name}!` };
  res.json(result);
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`);
});
