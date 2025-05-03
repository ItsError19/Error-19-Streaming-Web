// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchDropdown = document.getElementById('searchDropdown');
const contentTypeSelect = document.getElementById('contentType');
const genreSelect = document.getElementById('genreSelect');
const movieList = document.getElementById('movieList');
let searchTimeout;

// Search with dropdown functionality
if (searchInput) {
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.trim();
    
    if (query.length >= 2) {
      searchTimeout = setTimeout(() => {
        fetchSearchSuggestions(query);
      }, 300);
    } else {
      hideSearchDropdown();
    }
  });

  // Handle Enter key press
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchMovies();
    }
  });
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('.search-container')) {
    hideSearchDropdown();
  }
});

// Fetch search suggestions for dropdown
async function fetchSearchSuggestions(query) {
  try {
    const contentType = contentTypeSelect?.value || 'movie';
    const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=${contentType}`);
    const results = await response.json();
    
    if (results.length > 0) {
      displaySearchDropdown(results);
    } else {
      hideSearchDropdown();
    }
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    hideSearchDropdown();
  }
}

// Display search suggestions in dropdown
function displaySearchDropdown(results) {
  if (!searchDropdown) return;
  
  searchDropdown.innerHTML = '';
  
  results.slice(0, 5).forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'search-dropdown-item d-flex align-items-center p-2';
    itemElement.innerHTML = `
      <img src="${item.poster_path ? 
        `https://image.tmdb.org/t/p/w92${item.poster_path}` : 
        'placeholder-poster.jpg'}" 
           alt="${item.title || item.name}"
           class="rounded"
           onerror="this.src='placeholder-poster.jpg'"
           width="40" height="60">
      <div class="ms-2">
        <div class="title">${item.title || item.name}</div>
        <div class="details">
          ${item.release_date ? item.release_date.substring(0, 4) : ''}
          ${item.media_type === 'tv' ? ' (TV)' : ' (Movie)'}
        </div>
      </div>
    `;
    
    itemElement.addEventListener('click', () => {
      selectSearchItem(item);
    });
    
    searchDropdown.appendChild(itemElement);
  });
  
  searchDropdown.classList.remove('d-none');
}

// Hide search dropdown
function hideSearchDropdown() {
  if (searchDropdown) {
    searchDropdown.classList.add('d-none');
  }
}

// Handle selection from search dropdown
function selectSearchItem(item) {
  if (searchInput) {
    searchInput.value = item.title || item.name;
  }
  hideSearchDropdown();
  
  // Store selected item for movie page
  const selectedMovie = {
    id: item.id,
    title: item.title || item.name,
    overview: item.overview,
    poster_path: item.poster_path,
    release_date: item.release_date || item.first_air_date,
    media_type: item.media_type
  };
  localStorage.setItem('selectedMovie', JSON.stringify(selectedMovie));
  
  // Navigate to movie page
  window.location.href = `movie.html?id=${item.id}&type=${item.media_type}`;
}

// Main search function
async function searchMovies() {
  if (!movieList) return;
  
  const query = searchInput?.value.trim() || "new";
  const contentType = contentTypeSelect?.value || "movie";
  const genre = genreSelect?.value;

  let url = `/api/movies?q=${encodeURIComponent(query)}&type=${contentType}`;
  if (genre) url += `&genre=${genre}`;

  try {
    // Show loading state
    movieList.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="spinner-border text-warning" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `;

    const res = await fetch(url);
    const data = await res.json();

    movieList.innerHTML = "";

    if (!data.results || data.results.length === 0) {
      movieList.innerHTML = "<p class='text-center py-4'>No results found.</p>";
      return;
    }

    // Process and display results
    await displayMovieResults(data.results, contentType);
    
  } catch (error) {
    console.error("Error fetching movies:", error);
    movieList.innerHTML = `
      <div class="col-12 text-center py-4 text-danger">
        Error loading movies. Please try again.
      </div>
    `;
  }
}

// Display movie results in grid
async function displayMovieResults(results, contentType) {
  for (const item of results) {
    if (!item.poster_path) continue;

    const trailerLink = await fetchTrailer(item.id, contentType);

    const card = document.createElement("div");
    card.className = "col";
    card.innerHTML = `
      <div class="movie-card h-100">
        <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" 
             alt="${item.title || item.name}" 
             class="movie-poster w-100"
             onerror="this.src='fallback-poster.jpg'">
        <div class="movie-info p-2">
          <h3 class="movie-title">${item.title || item.name}</h3>
          <p class="movie-overview">${(item.overview || "").substring(0, 100)}...</p>
          <p class="movie-date"><strong>Release:</strong> ${item.release_date || item.first_air_date}</p>
          <button class="watch-btn btn btn-sm btn-warning w-100">▶ Watch</button>
        </div>
      </div>
    `;

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
}

// Fetch trailer for a movie/TV show
async function fetchTrailer(movieId, type) {
  try {
    const res = await fetch(`/api/videos?id=${movieId}&type=${type}`);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      const trailer = data.results.find(video => 
        video.type === "Trailer" && video.site === "YouTube"
      );
      if (trailer) return `https://www.youtube.com/embed/${trailer.key}`;
    }
  } catch (err) {
    console.error("Error fetching trailer", err);
  }
  return null;
}

// Video player functions
function playVideo(videoSrc) {
  const modalElement = document.getElementById('videoModal');
  if (!modalElement) return;
  
  const modal = new bootstrap.Modal(modalElement);
  const video = document.getElementById("videoPlayer");
  const youtube = document.getElementById("youtubePlayer");

  if (videoSrc.includes("youtube.com")) {
    video?.classList.add("d-none");
    youtube?.classList.remove("d-none");
    if (youtube) youtube.src = videoSrc + "?autoplay=1";
  } else {
    youtube?.classList.add("d-none");
    video?.classList.remove("d-none");
    if (video) {
      video.src = videoSrc;
      video.play();
    }
  }

  modal.show();
}

function closeVideo() {
  const modalElement = document.getElementById('videoModal');
  if (!modalElement) return;
  
  const modal = bootstrap.Modal.getInstance(modalElement);
  const video = document.getElementById("videoPlayer");
  const youtube = document.getElementById("youtubePlayer");

  modal?.hide();
  video?.pause();
  if (video) video.src = "";
  if (youtube) youtube.src = "";
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  // Load default movies if on homepage
  if (movieList && (!searchInput || !searchInput.value)) {
    searchMovies();
  }

  // Handle modal close event
  document.getElementById('videoModal')?.addEventListener('hidden.bs.modal', function () {
    closeVideo();
  });
});