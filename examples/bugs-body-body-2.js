app.post('/api/page/:slug', async (req, res) => {
  const filePath = slugToPath(req.params.slug);
  const body = req.body;
  console.log(body);
  await fs.writeFile(filePath, body);
  res.json({ status: 'ok' });
});