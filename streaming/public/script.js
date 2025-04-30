// Function to search for movies based on user input
async function searchMovies() {
  const query = document.getElementById("searchInput")?.value.trim();
  const contentType = document.getElementById("contentType")?.value || "movie";
  const genre = document.getElementById("genreSelect")?.value;

  // Set default query to "new" if no query is provided
  let url = `/api/movies?q=${encodeURIComponent(query || "new")}&type=${contentType}`;
  if (genre) url += `&genre=${genre}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const movieList = document.getElementById("movieList");
    if (!movieList) return;

    movieList.innerHTML = "";

    if (!data.results || data.results.length === 0) {
      movieList.innerHTML = "<p>No results found.</p>";
      return;
    }

    for (const item of data.results) {
      if (!item.poster_path) continue;

      const trailerLink = await fetchTrailer(item.id, contentType);

      const card = document.createElement("div");
      card.className = "movie-card";
      card.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" class="movie-poster" />
        <div class="movie-info">
          <h3 class="movie-title">${item.title || item.name}</h3>
          <p class="movie-overview">${(item.overview || "").substring(0, 100)}...</p>
          <p class="movie-date"><strong>Release:</strong> ${item.release_date || item.first_air_date}</p>
          <button class="watch-btn">▶ Watch</button>
        </div>
      `;

      // Attach click event to "Watch" button
      const watchBtn = card.querySelector(".watch-btn");
      watchBtn.addEventListener("click", () => {
        const selectedMovie = {
          id: item.id,
          title: item.title || item.name,
          overview: item.overview,
          poster_path: item.poster_path,
          release_date: item.release_date || item.first_air_date,
          trailer: trailerLink,
          type: contentType
        };
        localStorage.setItem("selectedMovie", JSON.stringify(selectedMovie));
        window.location.href = "movie.html";
      });

      movieList.appendChild(card);
    }
  } catch (error) {
    console.error("Error fetching movies:", error);
  }
}


// Function to fetch the trailer of a movie
async function fetchTrailer(movieId, type) {
  try {
    const res = await fetch(`/api/videos?id=${movieId}&type=${type}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const trailer = data.results.find(video => video.type === "Trailer" && video.site === "YouTube");
      if (trailer) {
        return `https://www.youtube.com/embed/${trailer.key}`;
      }
    }
  } catch (err) {
    console.error("Error fetching trailer", err);
  }
  return null;
}

// Function to play a video when clicked
function playVideo(videoSrc) {
  const modal = document.getElementById("videoModal");
  const video = document.getElementById("videoPlayer");
  const youtube = document.getElementById("youtubePlayer");

  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.add("active"), 45);

  if (videoSrc.includes("youtube.com")) {
    video.classList.add("hidden");
    youtube.classList.remove("hidden");
    youtube.src = videoSrc + "?autoplay=1";
  } else {
    youtube.classList.add("hidden");
    video.classList.remove("hidden");
    video.src = videoSrc;
    video.play();
  }
}

// Function to close the video modal
function closeVideo() {
  const modal = document.getElementById("videoModal");
  const video = document.getElementById("videoPlayer");
  const youtube = document.getElementById("youtubePlayer");

  modal.classList.remove("active");

  setTimeout(() => {
    modal.classList.add("hidden");
    video.pause();
    video.src = "";
    youtube.src = "";
  }, 300);
}

// Load default movies on page load
window.onload = () => {
  const input = document.getElementById("searchInput");
  if (input) {
    input.value = "new"; // Default search query
    searchMovies();
  }
};

// Fallback if using separate homepage grid
document.addEventListener("DOMContentLoaded", () => {
  const movieGrid = document.getElementById("movieGrid");
  if (!movieGrid) return; // Return early if movieGrid is not found

  const category = "popular"; // You can change this category to "top_rated", "now_playing", etc.
  const contentType = "movie"; // Change this to "tv" for TV shows

  fetch(`/api/movies?category=${category}&type=${contentType}`)
    .then(response => response.json())
    .then(data => {
      displayMovies(data.results, contentType);
    })
    .catch(error => {
      console.error("Error fetching movies:", error);
    });

  // Function to display movies in the grid
  function displayMovies(movies, contentType) {
    movieGrid.innerHTML = "";

    movies.forEach(movie => {
      const card = document.createElement("div");
      card.classList.add("movie-card");

      const title = movie.title || movie.name;
      const posterPath = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "https://via.placeholder.com/500x750?text=No+Image";

      card.innerHTML = `
        <img src="${posterPath}" class="movie-poster" />
        <h3 class="movie-title">${title}</h3>
      `;

      // Add click listener to go to details page
      card.addEventListener("click", () => {
        window.location.href = `movie.html?id=${movie.id}&type=${contentType}`;
      });

      movieGrid.appendChild(card);
    });
  }
});

