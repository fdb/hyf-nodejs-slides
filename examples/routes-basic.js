const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/users', (req, res) => {
  res.json({ status: 'ok', users: ['Ada', 'Marcel', 'Naveen', 'Prateek', 'Yulduz'] });
});

app.get('/projects', (req, res) => {
  res.json({ status: 'ok', users: ['Alpha', 'Beta', 'Gamma'] });
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`);
});
