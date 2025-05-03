// public/movie.js
document.addEventListener('DOMContentLoaded', function() {
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get("id");
    const contentType = urlParams.get("type") || "movie"; // Default to movie if type not specified

    // Check if we have localStorage data (your existing approach)
    const selectedMovie = JSON.parse(localStorage.getItem("selectedMovie"));

    // Decide which data source to use
    if (selectedMovie) {
        displayMovieDetailsFromLocalStorage(selectedMovie);
    } else if (movieId) {
        fetchMovieDetails(movieId, contentType);
    } else {
        displayError("No movie ID provided. Please select a movie from the homepage.");
    }
});

async function fetchMovieDetails(movieId, contentType) {
    try {
        // Show loading state
        document.getElementById("movieDetails").innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-warning" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading movie details...</p>
            </div>
        `;

        // Fetch movie details
        const [movieResponse, videosResponse] = await Promise.all([
            fetch(`/api/movie?id=${movieId}&type=${contentType}`),
            fetch(`/api/videos?id=${movieId}&type=${contentType}`)
        ]);

        if (!movieResponse.ok || !videosResponse.ok) {
            throw new Error('Failed to fetch movie data');
        }

        const movie = await movieResponse.json();
        const videosData = await videosResponse.json();

        if (!movie) {
            throw new Error('Movie data not found');
        }

        // Display the movie details
        displayMovieDetails(movie, videosData.results || []);

    } catch (error) {
        console.error("Error fetching movie details:", error);
        displayError("Failed to load movie details. Please try again later.");
    }
}

function displayMovieDetails(movie, videos) {
    const container = document.getElementById("movieDetails");
    
    // Find the best trailer (official YouTube trailer preferred)
    const trailer = videos.find(v => 
        v.type === "Trailer" && v.site === "YouTube"
    ) || videos.find(v => v.site === "YouTube");

    // Create the HTML content
    container.innerHTML = `
        <div class="row">
            <div class="col-md-4 mb-4 mb-md-0">
                <img src="${movie.poster_path ? 
                    `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
                    'fallback-poster.jpg'}" 
                     alt="${movie.title || movie.name}" 
                     class="img-fluid rounded shadow movie-detail-poster"
                     onerror="this.src='fallback-poster.jpg'">
            </div>
            <div class="col-md-8">
                <h2 class="text-warning">${movie.title || movie.name}</h2>
                ${movie.tagline ? `<p class="text-muted font-italic">${movie.tagline}</p>` : ''}
                
                <div class="mb-3">
                    <span class="badge bg-primary me-2">${movie.vote_average ? movie.vote_average.toFixed(1) + ' ★' : 'NR'}</span>
                    ${movie.release_date || movie.first_air_date ? 
                        `<span class="text-light me-2">${movie.release_date || movie.first_air_date}</span>` : ''}
                    ${movie.runtime ? `<span class="text-light">${Math.floor(movie.runtime/60)}h ${movie.runtime%60}m</span>` : ''}
                </div>
                
                <h4 class="text-warning mt-4">Overview</h4>
                <p>${movie.overview || "No overview available."}</p>
                
                ${movie.genres && movie.genres.length > 0 ? `
                    <div class="mb-3">
                        <strong>Genres:</strong> 
                        ${movie.genres.map(genre => `<span class="badge bg-secondary me-1">${genre.name}</span>`).join('')}
                    </div>
                ` : ''}
                
                <!-- Trailer Section -->
                <h4 class="text-warning mt-4">Trailer</h4>
                ${trailer ? `
                    <div class="ratio ratio-16x9 mb-4">
                        <iframe src="https://www.youtube.com/embed/${trailer.key}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen
                                class="rounded"></iframe>
                    </div>
                ` : `
                    <div class="alert alert-info">
                        No trailer available for this movie.
                    </div>
                `}
                
                <!-- Sample Video Section (if you want to keep this) -->
                <h4 class="text-warning mt-4">Preview</h4>
                <div class="ratio ratio-16x9">
                    <video controls class="rounded">
                        <source src="/videos/sample.mp4" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    `;
}

function displayMovieDetailsFromLocalStorage(movie) {
    const container = document.getElementById("movieDetails");
    
    container.innerHTML = `
        <div class="row">
            <div class="col-md-4 mb-4 mb-md-0">
                <img src="${movie.poster_path ? 
                    `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
                    'fallback-poster.jpg'}" 
                     alt="${movie.title}" 
                     class="img-fluid rounded shadow movie-detail-poster"
                     onerror="this.src='fallback-poster.jpg'">
            </div>
            <div class="col-md-8">
                <h2 class="text-warning">${movie.title}</h2>
                
                <div class="mb-3">
                    ${movie.release_date ? `<span class="text-light me-2">${movie.release_date}</span>` : ''}
                </div>
                
                <h4 class="text-warning mt-4">Overview</h4>
                <p>${movie.overview || "No overview available."}</p>
                
                <!-- Trailer Section -->
                <h4 class="text-warning mt-4">Trailer</h4>
                ${movie.trailer ? `
                    <div class="ratio ratio-16x9 mb-4">
                        <iframe src="${movie.trailer}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen
                                class="rounded"></iframe>
                    </div>
                ` : `
                    <div class="alert alert-info">
                        No trailer available for this movie.
                    </div>
                `}
            </div>
        </div>
    `;
}

function displayError(message) {
    const container = document.getElementById("movieDetails") || document.body;
    container.innerHTML = `
        <div class="alert alert-danger">
            ${message}
            <div class="mt-2">
                <a href="index.html" class="btn btn-warning">Back to Homepage</a>
            </div>
        </div>
    `;
}

