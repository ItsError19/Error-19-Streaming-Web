// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchDropdown = document.getElementById('searchDropdown');
const contentTypeSelect = document.getElementById('contentType');
const genreSelect = document.getElementById('genreSelect');
const movieList = document.getElementById('movieList');
let searchTimeout;
let hideTimeout;
let currentHighlightedIndex = -1;

// Initialize search functionality
function initSearch() {
  if (!searchInput || !searchDropdown) return;

  // Input event with debouncing
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

  // Enter key to search
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchMovies();
      hideSearchDropdown();
    }
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', function(e) {
    const items = searchDropdown.querySelectorAll('.search-dropdown-item');
    if (!items.length) return;

    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentHighlightedIndex = Math.min(currentHighlightedIndex + 1, items.length - 1);
        highlightItem(items[currentHighlightedIndex]);
        break;
      case 'ArrowUp':
        e.preventDefault();
        currentHighlightedIndex = Math.max(currentHighlightedIndex - 1, -1);
        if (currentHighlightedIndex === -1) {
          removeHighlights(items);
          searchInput.focus();
        } else {
          highlightItem(items[currentHighlightedIndex]);
        }
        break;
      case 'Enter':
        if (currentHighlightedIndex >= 0) {
          e.preventDefault();
          items[currentHighlightedIndex].click();
        }
        break;
      case 'Escape':
        hideSearchDropdown();
        searchInput.focus();
        break;
    }
  });

  // Show dropdown when input is focused (if there are results)
  searchInput.addEventListener('focus', function() {
    if (searchDropdown.children.length > 0) {
      showSearchDropdown();
    }
  });

  // Prevent immediate hide when moving to dropdown
  searchDropdown.addEventListener('mouseenter', cancelHide);
  searchDropdown.addEventListener('mouseleave', function() {
    hideSearchDropdown();
  });
}

// Highlight dropdown item
function highlightItem(item) {
  const items = searchDropdown.querySelectorAll('.search-dropdown-item');
  items.forEach(i => i.classList.remove('highlighted'));
  if (item) {
    item.classList.add('highlighted');
    item.scrollIntoView({ block: 'nearest' });
  }
}

// Remove all highlights
function removeHighlights(items) {
  items.forEach(i => i.classList.remove('highlighted'));
  currentHighlightedIndex = -1;
}

// Fetch search suggestions for dropdown
async function fetchSearchSuggestions(query) {
  try {
    // Show loading state
    searchDropdown.innerHTML = '<div class="search-dropdown-item"><div class="text-center py-2">Loading...</div></div>';
    showSearchDropdown();
    
    const contentType = contentTypeSelect?.value || 'movie';
    const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=${contentType}`);
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const results = await response.json();
    
    if (results.length > 0) {
      displaySearchDropdown(results);
    } else {
      searchDropdown.innerHTML = '<div class="search-dropdown-item"><div class="text-center py-2">No results found</div></div>';
      showSearchDropdown();
    }
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    searchDropdown.innerHTML = '<div class="search-dropdown-item"><div class="text-center py-2 text-danger">Error loading results</div></div>';
    showSearchDropdown();
  }
}

// Display search suggestions in dropdown
function displaySearchDropdown(results) {
  if (!searchDropdown) return;
  
  searchDropdown.innerHTML = '';
  currentHighlightedIndex = -1;
  
  results.slice(0, 5).forEach((item, index) => {
    const itemElement = document.createElement('div');
    itemElement.className = 'search-dropdown-item';
    itemElement.tabIndex = 0;
    itemElement.innerHTML = `
      <img src="${item.poster_path ? 
        `https://image.tmdb.org/t/p/w92${item.poster_path}` : 
        'placeholder-poster.jpg'}" 
           alt="${item.title || item.name}"
           onerror="this.src='placeholder-poster.jpg'">
      <div>
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
    
    itemElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        selectSearchItem(item);
      }
    });
    
    itemElement.addEventListener('mouseenter', () => {
      currentHighlightedIndex = index;
      highlightItem(itemElement);
      cancelHide();
    });
    
    searchDropdown.appendChild(itemElement);
  });
  
  showSearchDropdown();
}

// Show search dropdown
function showSearchDropdown() {
  if (searchDropdown) {
    clearTimeout(hideTimeout);
    searchDropdown.style.display = 'block';
  }
}

// Hide search dropdown
function hideSearchDropdown() {
  if (searchDropdown) {
    hideTimeout = setTimeout(() => {
      searchDropdown.style.display = 'none';
      currentHighlightedIndex = -1;
    }, 200);
  }
}

// Cancel pending hide
function cancelHide() {
  clearTimeout(hideTimeout);
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

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initSearch();
  
  // Load default movies if on homepage
  if (movieList && (!searchInput || !searchInput.value)) {
    searchMovies();
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.search-container') && 
        !event.target.classList.contains('search-dropdown-item')) {
      hideSearchDropdown();
    }
  });
});