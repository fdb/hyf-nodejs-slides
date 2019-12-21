app.post('/api/page/:slug', async (req, res) => {
  const filePath = slugToPath(req.params.slug);
  await fs.writeFile(filePath, req.body);
  res.json({ status: 'ok' });
});