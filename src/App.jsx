import { useState, useEffect } from "react";
import {useDebounce} from 'react-use';
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedsearchTerm, setDebouncedSearchTerm] = useState('');
  
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isTrendingLoading, setTrendingLoading] = useState(false);
  const [trendingerror, setTrendingError] = useState(null);


  // this debounce the search term to prevent making too much request to the server. the second parameter is the delay in millisecond
  // i.e it waits for the user to stop tying for 1000 ms.
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm] )
  const fetchMovies = async (query='') => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const endpoint =  query ?
                        `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` 
                        :
                        `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to Fetch movies");
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);
      
      if (query && data.results.length > 0){
        await updateSearchCount(query, data.results[0])
      }
    } catch (error) {
      console.error(`Error fetching movies ${error}`);
      setErrorMessage("Error fetching movies please try again later");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    setTrendingLoading(true);
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    }catch (error){
      console.error("Error fetching trending movies");
      setTrendingError("Error fetching trending movies");
    }finally {
      setTrendingLoading(false);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedsearchTerm);
  }, [debouncedsearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, [])

  return (
    <main className="overflow-hidden">
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle
          </h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {/* Trending movies */}
        {trendingMovies.length > 0 && (
          
          <section className="trending">
            <h2>Trending Movies</h2>

            {isTrendingLoading ? (
              <Spinner />
            ) : trendingerror ? (
              <p className="text-red-500">{}</p>
            ) : (

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
            )}


          </section>
        )}

        {/* All movies section  */}
        <section className="all-movies">
          <h2 className="mt-[40px]">All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
