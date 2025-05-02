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
      movieList.innerHTML = "<p class='text-center py-4'>No results found.</p>";
      return;
    }

    for (const item of data.results) {
      if (!item.poster_path) continue;

      const trailerLink = await fetchTrailer(item.id, contentType);

      const card = document.createElement("div");
      card.className = "col";
      card.innerHTML = `
        <div class="movie-card h-100">
          <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}" class="movie-poster w-100" />
          <div class="movie-info p-2">
            <h3 class="movie-title">${item.title || item.name}</h3>
            <p class="movie-overview">${(item.overview || "").substring(0, 100)}...</p>
            <p class="movie-date"><strong>Release:</strong> ${item.release_date || item.first_air_date}</p>
            <button class="watch-btn btn btn-sm btn-warning w-100">▶ Watch</button>
          </div>
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
    const movieList = document.getElementById("movieList");
    if (movieList) {
      movieList.innerHTML = `<p class='text-center py-4 text-danger'>Error loading movies. Please try again.</p>`;
    }
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

// Function to play a video when clicked (using Bootstrap modal)
function playVideo(videoSrc) {
  const modal = new bootstrap.Modal(document.getElementById('videoModal'));
  const video = document.getElementById("videoPlayer");
  const youtube = document.getElementById("youtubePlayer");

  if (videoSrc.includes("youtube.com")) {
    video.classList.add("d-none");
    youtube.classList.remove("d-none");
    youtube.src = videoSrc + "?autoplay=1";
  } else {
    youtube.classList.add("d-none");
    video.classList.remove("d-none");
    video.src = videoSrc;
    video.play();
  }

  modal.show();
}

// Function to close the video modal
function closeVideo() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('videoModal'));
  const video = document.getElementById("videoPlayer");
  const youtube = document.getElementById("youtubePlayer");

  modal.hide();
  video.pause();
  video.src = "";
  youtube.src = "";
}

// Load default movies on page load
document.addEventListener("DOMContentLoaded", () => {
  // Handle search functionality
  const input = document.getElementById("searchInput");
  if (input) {
    input.value = "new"; // Default search query
    searchMovies();
  }

  // Handle movie grid population for homepage
  const movieGrid = document.getElementById("movieGrid");
  if (movieGrid) {
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
  }

  // Function to display movies in the grid
  function displayMovies(movies, contentType) {
    const movieGrid = document.getElementById("movieGrid");
    if (!movieGrid) return;

    movieGrid.innerHTML = "";

    movies.forEach(movie => {
      if (!movie.poster_path) return;

      const col = document.createElement("div");
      col.className = "col";

      const title = movie.title || movie.name;
      const posterPath = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

      col.innerHTML = `
        <div class="movie-card h-100">
          <img src="${posterPath}" alt="${title}" class="movie-poster w-100" />
          <div class="movie-info p-2">
            <h3 class="movie-title">${title}</h3>
            <button class="btn btn-sm btn-warning w-100 details-btn">View Details</button>
          </div>
        </div>
      `;

      // Add click listener to go to details page
      const detailsBtn = col.querySelector(".details-btn");
      detailsBtn.addEventListener("click", () => {
        const selectedMovie = {
          id: movie.id,
          title: title,
          overview: movie.overview,
          poster_path: movie.poster_path,
          release_date: movie.release_date || movie.first_air_date,
          type: contentType
        };
        localStorage.setItem("selectedMovie", JSON.stringify(selectedMovie));
        window.location.href = "movie.html";
      });

      movieGrid.appendChild(col);
    });
  }
});

// Event listener for modal close to reset video players
document.getElementById('videoModal')?.addEventListener('hidden.bs.modal', function () {
  const video = document.getElementById("videoPlayer");
  const youtube = document.getElementById("youtubePlayer");
  
  video.pause();
  video.src = "";
  youtube.src = "";
});

