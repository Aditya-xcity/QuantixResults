// Simple Express server to serve static frontend files
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public folder (root of this project)
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for single page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ResultEasyMaker server listening on http://localhost:${PORT}`);
});
