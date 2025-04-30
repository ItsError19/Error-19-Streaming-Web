async function searchMovies() {
  const query = document.getElementById("searchInput").value.trim();
  const contentType = document.getElementById("contentType").value;
  const genre = document.getElementById("genreSelect").value;
  
  let url = `/api/movies?q=${encodeURIComponent(query)}&type=${contentType}`;
  if (genre) url += `&genre=${genre}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  const movieList = document.getElementById("movieList");
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
        <button onclick="playVideo('${trailerLink || '/videos/sample.mp4'}')">▶ Watch</button>
      </div>
    `;
    movieList.appendChild(card);
  }
}

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

function playVideo(videoSrc) {
  const modal = document.getElementById("videoModal");
  const video = document.getElementById("videoPlayer");
  const youtube = document.getElementById("youtubePlayer");

  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.add("active"), 45);

  if (videoSrc.includes("youtube.com")) {
    video.classList.add("hidden");
    youtube.classList.remove("hidden");
    youtube.src = videoSrc + "?autoplay=1"; // auto play YouTube
  } else {
    youtube.classList.add("hidden");
    video.classList.remove("hidden");
    video.src = videoSrc;
    video.play();
  }
}

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

// On page load, search for "New Releases"
window.onload = () => {
  document.getElementById("searchInput").value = "new";
  searchMovies();
};
