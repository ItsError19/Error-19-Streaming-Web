
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 19121;

app.use(express.static('public'));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

app.get('/api/movies', async (req, res) => {
  const query = req.query.q;
  const type = req.query.type || 'movie';
  const genre = req.query.genre;
  const apiKey = process.env.TMDB_API_KEY;

  let url = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    let results = response.data.results;
    if (genre) {
      results = results.filter(item =>
        item.genre_ids && item.genre_ids.includes(parseInt(genre))
      );
    }
    res.json({ results });
  } catch (err) {
    console.error("TMDB API Error:", err.message);
    res.status(500).json({ error: "Failed to fetch data from TMDB" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
