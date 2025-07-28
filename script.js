// API Credentials
const API_URL = "https://www.omdbapi.com/?";
const API_KEY = "b6b2e94d";

// DOM Elements
const searchInput = document.getElementById("input");
const displaySearchList = document.querySelector(".favContainer");
const favContainer = document.querySelector(".fav-container");
const mainBody = document.querySelector(".mainBody");

// State Variables
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

let DEFAULT_RANDOM_MOVIES = [
  'sci', 'act', 'come', 'fan', 'hor', 'love', 'super', 'doc'
];

function getRandomSearchTerm() {
  const searchTerm = DEFAULT_RANDOM_MOVIES[Math.floor(Math.random() * DEFAULT_RANDOM_MOVIES.length)];
  console.log(`Search term : ${searchTerm}`);
  return searchTerm;
}

// Event Listeners
let timer;
searchInput?.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    displaySearchList.innerHTML = "";
    findMovies(searchInput.value.trim())
  }, 500);
});

function searchMovies(event) {
  if (event.key === "Enter") {
    displaySearchList.innerHTML = "";
    findMovies(searchInput.value.trim());
  }
}

searchInput?.addEventListener("keydown", throttle(searchMovies, 500));

window.onload = function () {
  if (favContainer) favoritesMovieLoader();
  if (document.querySelector(".movieContainer")) singleMovie();
  if (mainBody) {
    findMovies(getRandomSearchTerm());
    mainBody.addEventListener("scroll", throttle(handleScroll, 500));
  }
};

// Core Functions
async function findMovies(searchTerm = getRandomSearchTerm()) {
  if (isLoading) return;
  isLoading = true;
  try {
    const res = await fetch(`${API_URL}s=${searchTerm}&page=${currentPage}&apikey=${API_KEY}`);
    const data = await res.json();

    if (data.Response === "True") {
      totalPages = Math.ceil(data.totalResults / 10);
      if (currentPage === 1) {
        displaySearchList.innerHTML = "";
      }
      displayMovies(data.Search);
      currentPage++;
    } else {
      displayFallback();
    }
  } catch (error) {
    displayFallback();
  }
  isLoading = false;
}

function displayMovies(movies) {
  const movieHTML = movies.map((movie) => `
    <div class="movieCard">
      <img src="${movie.Poster}" class="card-img-top" alt="" onerror="this.onerror=null; this.src='./images/movieimage.avif';">
      <h4 class='movieTitle'>${movie.Title}</h4>
      <div class='addToFavAndMore'> 
        <button class="btn btn-success btn-sm addToFavBtn" onclick="addToFavorites('${movie.imdbID}')">Add Favourites</button>
        <a href="singlemovie.html?id=${movie.imdbID}" class="btn btn-sm moreBtn">More</a>
      </div>
    </div>
  `).join("");
  displaySearchList.insertAdjacentHTML("beforeend", movieHTML);
}

function displayFallback() {
  displaySearchList.innerHTML = `
    <div class="startExploring">
      <img class="fallbackImg" src="./images/coffee-cup-svgrepo-com.svg" alt="Coffee Cup" />
      <span>Try to search something else!</span>
    </div>`;
}

async function addToFavorites(imdbID) {
  const movie = await getMovieDetails(imdbID);
  if (!movie) return;

  const favouritesList = JSON.parse(localStorage.getItem("favourites")) || [];

  if (!favouritesList.some(m => m.imdbID === imdbID)) {
    favouritesList.push(movie);
    localStorage.setItem("favourites", JSON.stringify(favouritesList));
    showToast(`✅ ${movie.Title} is added to your favourites`, 'info');
  } else {
    showToast(`🔁 ${movie.Title} is already added in your favourites`, 'info');
  }
}

async function getMovieDetails(imdbID) {
  const res = await fetch(`${API_URL}i=${imdbID}&apikey=${API_KEY}`);
  const data = await res.json();
  return data.Response === "True" ? data : null;
}

function favoritesMovieLoader() {
  const favouritesList = JSON.parse(localStorage.getItem("favourites")) || [];
  favContainer.innerHTML = "";

  if (favouritesList.length === 0) {
    favContainer.innerHTML = "<h2 class='emptyMessage'>Your favourites list is empty</h2>";
    return;
  }

  favouritesList.forEach(movie => {
    const card = createMovieCard(movie);
    favContainer.appendChild(card);
  });
}

function createMovieCard(movie) {
  const movieCard = document.createElement("div");
  movieCard.innerHTML = `
    <div class="fav-card movieCard">
      <img src="${movie.Poster}" class="card-img-top" onerror="this.onerror=null; this.src='./images/movieImage.avif';">
      <div>
        <h4 class='movieTitle'>${movie.Title}</h4>
        <div class='addToFavAndMore'> 
          <button class="btn btn-danger btn-sm remove-button moreBtn" onclick="removeFav('${movie.imdbID}')">Remove from Favourites</button>
          <a href="singlemovie.html?id=${movie.imdbID}" class="btn btn-secondary btn-sm moreBtn">More</a>
        </div>
      </div>
    </div>`;
  return movieCard;
}

function removeFav(id) {
  let favouritesList = JSON.parse(localStorage.getItem("favourites")) || [];
  favouritesList = favouritesList.filter(movie => movie.imdbID !== id);
  localStorage.setItem("favourites", JSON.stringify(favouritesList));
  favoritesMovieLoader();
  showToast("✅ Movie removed from your favourites", "info")
}

function singleMovie() {
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get("id");
  if (!movieId) return console.error("Movie id not provided by the URL");
  fetchMovieDetails(movieId);
}

async function fetchMovieDetails(movieId) {
  const res = await fetch(`${API_URL}i=${movieId}&apikey=${API_KEY}`);
  const movieDetails = await res.json();
  displayMovieDetails(movieDetails);
}

function displayMovieDetails(movie) {
  const container = document.getElementById("movieContainer");
  if (!container || movie.Response !== "True") {
    container.innerHTML = "Movie details not found.";
    return;
  }

  container.innerHTML = `
    <div id="movie-container">
      <img src="${movie.Poster}" onerror="this.onerror=null; this.src='./images/movieImage.avif';" alt="${movie.Title}">
      <div id="movie-details">
        <div id="movie-head">
          <h2>${movie.Title} (${movie.Year})</h2>
        </div>
        <span class="genre"><strong>Genre:-</strong> ${movie.Genre}</span>
        <p><strong>IMDb RATING:-</strong> ${movie.imdbRating}/10 ⭐</p>
        <p class="mov-details"><strong>Creators:-</strong> ${movie.Director}</p>
        <p class="mov-details"><strong>Stars :-</strong> ${movie.Actors}</p>
        <p class="mov-details"><strong>Description:-</strong> ${movie.Plot}</p>
        <button class="btn btn-success btn-sm addToFavBtn" onclick="addToFavorites('${movie.imdbID}')">Add Favourites</button>
      </div>
    </div>`;
}

function throttle(fn, delay) {
  let lastCall = 0;
  return function () {
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    fn();
  };
}

function handleScroll() {
  if (!mainBody || isLoading || currentPage > totalPages) return;

  const scrollTop = mainBody.scrollTop;
  const scrollHeight = mainBody.scrollHeight;
  const clientHeight = mainBody.clientHeight;
  const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

  // Trigger when user is within 100px of bottom
  if (distanceFromBottom <= 300) {
    findMovies(getRandomSearchTerm());
  }
}

// Toastify fn
const showToast = (message, classType, ) => {
  Toastify({
  text: message,
  className: classType,
  gravity: "top",
  position: "right",
  style: {
    color: "#000",
    backgroundImage: "linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)",
  }
}).showToast();
}