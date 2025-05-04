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

    // Format duration
    let duration = '';
    if (movie.runtime) {
        const hours = Math.floor(movie.runtime / 60);
        const minutes = movie.runtime % 60;
        duration = `${hours}h ${minutes}m`;
    }

    // Find director from credits
    let director = '';
    if (movie.credits && movie.credits.crew) {
        const directorInfo = movie.credits.crew.find(person => person.job === "Director");
        director = directorInfo ? directorInfo.name : 'Unknown';
    }

    // Get top 5 actors
    let actors = [];
    if (movie.credits && movie.credits.cast) {
        actors = movie.credits.cast.slice(0, 5).map(actor => actor.name);
    }

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
                
                <!-- Movie Metadata Section -->
                <div class="movie-metadata mt-4 mb-4">
                    <!-- Ratings -->
                    <div class="metadata-item">
                        <h5 class="text-warning">Rating</h5>
                        <p>
                            <span class="badge bg-primary me-2">
                                ${movie.vote_average ? movie.vote_average.toFixed(1) + ' ★' : 'Not Rated'}
                            </span>
                            (${movie.vote_count ? movie.vote_count.toLocaleString() : '0'} votes)
                        </p>
                    </div>
                    
                    <!-- Release Date -->
                    <div class="metadata-item">
                        <h5 class="text-warning">Release Date</h5>
                        <p>${movie.release_date || movie.first_air_date ? formatDate(movie.release_date || movie.first_air_date) : 'Unknown'}</p>
                    </div>
                    
                    <!-- Duration -->
                    ${duration ? `
                    <div class="metadata-item">
                        <h5 class="text-warning">Duration</h5>
                        <p>${duration}</p>
                    </div>
                    ` : ''}
                    
                    <!-- Director -->
                    <div class="metadata-item">
                        <h5 class="text-warning">Director</h5>
                        <p>${director || 'Unknown'}</p>
                    </div>
                    
                    <!-- Actors -->
                    ${actors.length > 0 ? `
                    <div class="metadata-item">
                        <h5 class="text-warning">Main Cast</h5>
                        <p>${actors.join(', ')}</p>
                    </div>
                    ` : ''}
                    
                    <!-- Genres -->
                    ${movie.genres && movie.genres.length > 0 ? `
                    <div class="metadata-item">
                        <h5 class="text-warning">Genres</h5>
                        <div class="genres-list">
                            ${movie.genres.map(genre => `<span class="badge bg-secondary me-1">${genre.name}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Overview -->
                <div class="mb-4">
                    <h4 class="text-warning">Overview</h4>
                    <p>${movie.overview || "No overview available."}</p>
                </div>
                
                <!-- Trailer Section -->
                <div class="mb-4">
                    <h4 class="text-warning">Trailer</h4>
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
                </div>
            </div>
        </div>
    `;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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