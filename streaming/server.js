require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 19121;

const TMDB_API_KEY = process.env.TMDB_API_KEY;

app.use(express.static('public'));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// Route to search movies or TV shows
app.get('/api/movies', async (req, res) => {
  const query = req.query.q;
  const type = req.query.type || 'movie';
  const genre = req.query.genre;

  let url = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    let results = response.data.results;

    // Filter by genre if specified
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

// Route to get details of a specific movie or TV show
app.get('/api/movie', async (req, res) => {
  const id = req.query.id;
  const type = req.query.type || 'movie';

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}`);
    res.json(response.data);
  } catch (err) {
    console.error("TMDB Movie Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// ❗NEW: Route to get trailers (videos) for a movie or TV show
app.get('/api/videos', async (req, res) => {
  const id = req.query.id;
  const type = req.query.type || 'movie';

  try {
    const url = `https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data); // includes video "key", "site", etc.
  } catch (err) {
    console.error("TMDB Trailer Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch video trailer" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
