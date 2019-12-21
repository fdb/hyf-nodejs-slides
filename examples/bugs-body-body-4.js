app.post('/api/page/:slug', async (req, res) => {
  const filePath = slugToPath(req.params.slug);
  const text = req.body.body;
  await fs.writeFile(filePath, text);
  res.json({ status: 'ok' });
});