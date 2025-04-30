// public/movie.js
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get("id");
const contentType = urlParams.get("type");

async function fetchMovieDetails() {
  try {
    // Fetch movie details from the backend API
    const res = await fetch(`/api/movie?id=${movieId}&type=${contentType}`);
    const movie = await res.json();

    if (!movie) {
      document.getElementById("movieDetails").innerHTML = "<p>Movie details not found.</p>";
      return;
    }

    // Fetch trailer link for the movie
    const trailerLink = await fetchTrailer(movieId, contentType);

    const container = document.getElementById("movieDetails");

    // Populate the movie details in the container
    container.innerHTML = `
      <div class="movie-card">
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" class="movie-poster" alt="${movie.title || movie.name}" />
        <div class="movie-info">
          <h3 class="movie-title">${movie.title || movie.name}</h3>
          <p class="movie-overview">${movie.overview || "No overview available."}</p>
          <p class="movie-date"><strong>Release Date:</strong> ${movie.release_date || movie.first_air_date}</p>
          
          <!-- Trailer Section -->
          ${trailerLink ? `
            <h4>Trailer</h4>
            <iframe width="100%" height="315" src="${trailerLink}" frameborder="0" allowfullscreen></iframe>
          ` : '<p>No trailer available.</p>'}
          
          <!-- Sample Movie Section -->
          <h4>Sample Movie</h4>
          <video controls width="100%">
            <source src="/videos/sample.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    document.getElementById("movieDetails").innerHTML = "<p>Failed to load movie details.</p>";
  }
}

// Fetch trailer for the movie
async function fetchTrailer(id, type) {
  try {
    const res = await fetch(`/api/videos?id=${id}&type=${type}`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
      if (trailer) return `https://www.youtube.com/embed/${trailer.key}`;
    }
  } catch (e) {
    console.error("Error fetching trailer:", e);
  }
  return "";
}

// Call the function to fetch and display movie details
fetchMovieDetails();

// movie.js

// Get the selected movie from localStorage
const selectedMovie = JSON.parse(localStorage.getItem("selectedMovie"));

// Get the container where details will be shown
const container = document.getElementById("movieDetails");

// Check if movie data exists
if (!selectedMovie) {
  container.innerHTML = "<p>No movie data available. Please go back and select a movie.</p>";
} else {
  container.innerHTML = `
    <div class="movie-detail-card">
      <img src="https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}" alt="${selectedMovie.title}" class="movie-detail-poster" />
      <div class="movie-detail-info">
        <h2>${selectedMovie.title}</h2>
        <p><strong>Release Date:</strong> ${selectedMovie.release_date}</p>
        <p><strong>Overview:</strong> ${selectedMovie.overview}</p>
        ${selectedMovie.trailer ? `
          <div class="movie-trailer">
            <iframe width="100%" height="315" src="${selectedMovie.trailer}" 
              title="YouTube trailer" frameborder="0" allowfullscreen></iframe>
          </div>` : `<p><em>No trailer available.</em></p>`}
      </div>
    </div>
  `;
}


