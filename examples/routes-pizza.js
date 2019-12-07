const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const PIZZA_KINDS = {
  'margherita': { name: 'Pizza Margherita', price: 4.95 },
  'funghi': { name: 'Pizza Prosciutto Funghi', price: 5.25 }
};

app.get('/pizza/:kind', (req, res) => {
  const pizza = PIZZA_KINDS[req.params.kind];
  if (!pizza) { return res.json({ status: 'notfound', message: 'Kind not found.' })}
  res.json({ status: 'ok', ...pizza });
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`);
});
