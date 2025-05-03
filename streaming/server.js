require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

// Constants
const PORT = process.env.PORT || 19121;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// TMDB API Client
const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: { api_key: TMDB_API_KEY },
  timeout: 5000
});

/**
 * API Controllers
 */

const searchController = async (req, res) => {
  try {
    const { query, type = 'movie' } = req.query;
    
    const response = await tmdb.get(`/search/${type}`, { params: { query } });

    const results = response.data.results.map(item => ({
      id: item.id,
      title: item.title || item.name,
      overview: item.overview,
      poster_path: item.poster_path,
      release_date: item.release_date || item.first_air_date,
      media_type: type === 'movie' ? 'movie' : 'tv'
    }));

    res.json(results);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
};

const moviesController = async (req, res) => {
  try {
    const { q, type = 'movie', genre, category = 'popular' } = req.query;
    
    let endpoint, params = {};
    if (q) {
      endpoint = `/search/${type}`;
      params.query = q;
    } else if (genre) {
      endpoint = `/discover/${type}`;
      params.with_genres = genre;
    } else {
      endpoint = `/${type}/${category}`;
    }

    const response = await tmdb.get(endpoint, { params });
    
    const results = response.data.results.map(item => ({
      id: item.id,
      title: item.title || item.name,
      overview: item.overview,
      poster_path: item.poster_path,
      release_date: item.release_date || item.first_air_date,
      vote_average: item.vote_average
    }));

    res.json({ results });
  } catch (error) {
    console.error('Movies error:', error.message);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
};

const videosController = async (req, res) => {
  try {
    const { id, type = 'movie' } = req.query;
    const response = await tmdb.get(`/${type}/${id}/videos`);
    
    const results = response.data.results.map(video => ({
      id: video.id,
      key: video.key,
      name: video.name,
      site: video.site,
      type: video.type,
      official: video.official
    }));

    res.json({ results });
  } catch (error) {
    console.error('Videos error:', error.message);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};

const movieDetailsController = async (req, res) => {
  try {
    const { id, type = 'movie' } = req.query;
    const response = await tmdb.get(`/${type}/${id}`, {
      params: { append_to_response: 'videos,credits' }
    });
    
    const data = response.data;
    const trailer = data.videos.results.find(v => 
      v.type === 'Trailer' && v.site === 'YouTube'
    );

    const result = {
      id: data.id,
      title: data.title || data.name,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date || data.first_air_date,
      runtime: data.runtime || data.episode_run_time?.[0],
      vote_average: data.vote_average,
      genres: data.genres,
      trailer: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
      cast: data.credits.cast.slice(0, 10).map(person => ({
        name: person.name,
        character: person.character,
        profile_path: person.profile_path
      }))
    };

    res.json(result);
  } catch (error) {
    console.error('Movie details error:', error.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
};

/**
 * API Routes
 */
app.get('/api/search', searchController);
app.get('/api/movies', moviesController);
app.get('/api/videos', videosController);
app.get('/api/movie', movieDetailsController);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});