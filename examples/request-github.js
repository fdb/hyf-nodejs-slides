const express = require('express');
const request = require('request-promise-native');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const user = req.query.user || 'octocat';
  const options = {
    uri: `https://api.github.com/users/${user}`,
    headers: { 'User-Agent': 'request' },
    json: true
  };
  const userObject = await request.get(options);
  res.end(`On GitHub, ${userObject.name} has ${userObject.followers} followers.`);
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`);
});
