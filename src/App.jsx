import React from 'react'
import Search from './components/Search'
import {useEffect, useState} from 'react'
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce} from 'react-use'
import { updateSearchCount } from './appwrite';

// ---------------------------------------------
// How to Build, How the App Works, and Code Explanation
// ---------------------------------------------
/*

How to Build/Run the App:
1. Make sure you have Node.js and npm installed on your machine.
2. Clone the repository or download the project files.
3. In the project root, run `npm install` to install all dependencies.
4. Create a `.env` file in the root directory and add your TMDB API key as:
   VITE_TMDB_API_KEY=your_tmdb_api_key_here
5. Start the development server with `npm run dev`.
6. Open your browser and go to the local server URL (usually http://localhost:5173/).

How the App Works (High-Level):
- The app fetches a list of popular movies from the TMDB API when it loads.
- Users can search for movies using the search bar at the top. As you type, the app fetches and displays movies matching your search term.
- The main movie list is displayed using the `MovieCard` component for each movie.
- Loading and error states are handled and displayed to the user.
- The app uses React hooks (`useState`, `useEffect`) for state management and side effects.
- API requests are made using the Fetch API with the appropriate endpoint and authorization headers.
- The UI is styled with CSS and includes a hero banner, search bar, and a responsive movie grid.
- This application uses App write which is an open source BAAS 

Detailed Code Explanation (Step-by-Step):

1. **Imports and Setup**
   - The app imports React, useState, useEffect, and child components (`Search`, `Spinner`, `MovieCard`).
   - API constants are defined: the base URL, the API key (from environment variables), and the fetch options (including the Bearer token for authorization).

2. **State Management**
   - `searchTerm`: Stores the current value of the search input.
   - `errorMessage`: Stores any error messages to display to the user.
   - `movieList`: Stores the array of movies fetched from the API.
   - `isLoading`: Boolean to indicate if data is being loaded (for showing a spinner/loading message).

3. **Fetching Movies**
   - The `fetchMovies` function is responsible for fetching movies from the TMDB API.
   - It accepts an optional `query` parameter. If a search term is provided, it uses the `/search/movie` endpoint; otherwise, it fetches popular movies using `/discover/movie?sort_by=popularity.desc`.
   - The function sets loading state to true and clears any previous error messages.
   - It makes a fetch request with the correct endpoint and options.
   - If the response is not OK, it throws an error.
   - The response is parsed as JSON. If the API returns an error (e.g., no results), it sets an error message and clears the movie list.
   - Otherwise, it updates `movieList` with the array of movies from `data.results`.
   - Loading is set to false in a finally block to ensure the spinner is hidden after the request completes.

4. **Effect Hook for Fetching on Search**
   - `useEffect` is used to call `fetchMovies` whenever `searchTerm` changes (including on initial mount).
   - This means the app fetches popular movies on load, and fetches search results as the user types.

5. **Rendering the UI**
   - The main structure is a `<main>` element containing a wrapper div.
   - The header includes a hero image, a title, and the `Search` component (which takes `searchTerm` and `setSearchTerm` as props).
   - The current search term is displayed below the header.
   - The movies section displays a heading, and then:
     - If loading, shows the `Spinner` component.
     - If there's an error, shows the error message in red.
     - Otherwise, maps over `movieList` and renders a `MovieCard` for each movie, passing the movie object as a prop.

6. **Search Component**
   - Renders an input field and a search icon.
   - The input is controlled by `searchTerm` and updates the parent state via `setSearchTerm` on change.
   - As the user types, the parent `App` component fetches new results.

7. **MovieCard Component**
   - Receives a `movie` object as a prop.
   - Destructures relevant properties (title, vote_average, poster_path, etc.).
   - Renders the movie's title, rating, and (optionally) poster image and other details.
   - Each card is given a unique `key` prop using the movie's `id`.

8. **Spinner Component**
   - Displays a loading spinner or animation while data is being fetched.

9. **Styling**
   - The app uses CSS files for styling (`App.css`, `index.css`).
   - Images and icons are stored in the `public` folder and referenced by relative paths.

10. **Environment Variables**
    - The API key is stored in a `.env` file and accessed via `import.meta.env.VITE_TMDB_API_KEY` for security.

11. **Error Handling**
    - If the API call fails or returns no results, an error message is displayed to the user.
    - The app gracefully handles loading and error states for a smooth user experience.

12. **Extending the App**
    - You can add more features, such as movie details, pagination, or filtering, by expanding the state and UI components.

By following these notes, you can rebuild the app from scratch:
- Set up a React project (e.g., with Vite or Create React App)
- Create the main `App` component with state and fetch logic
- Build child components for search, movie cards, and loading spinner
- Style the app and connect to the TMDB API using your API key
- Handle loading, error, and empty states for a robust UI

*/

// API - Application programming interface - a set of rules that allows one software application to talk to another 
// start using it by API base URL 
// then your API key
// then define the API options, get, what you will be accepting and authorization key
// then create a function that then allows you to fetch those movies
// when fetching it is good practice to use a try catch
// if you dont get it console.log error, then set state error message , then display it on the UI
// in the try block we need to define the exact endpoint that we are trying to call 
// after that we need to fetch the data using the fetch function,using the endpoint and API options 





const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () =>{
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); 

  useDebounce(()=> setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async(query = '')=>{
    try{
      setIsLoading(true);
      setErrorMessage(''); 
      const endpoint = query
      ? `${API_BASE_URL}/search/movie?query=${encodeURI(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if(!response.ok){
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();
      
      if(data.response === 'False'){
          setErrorMessage(data.error || "Failed to fetch movies");
          setMovieList([]);
          return; 
      } 
      console.log(data);
      setMovieList(data.results || []);

      updateSearchCount();


    }catch(error){
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Please try again later.');
    } finally{
      setIsLoading(false);
    }

  }
   
  useEffect(()=>{
    fetchMovies(debouncedSearchTerm);
  },[debouncedSearchTerm])
  
  return (
    <main>
      <div className= "pattern"/>
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner "/>
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>
        <h1>{searchTerm}</h1>
        <section className='all-movies '>
          <h2 className='mt-[40px]'>All Movies</h2>

          {isLoading ? (
            <Spinner/>
          ): errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ):(
            <ul>
              {movieList.map((movie)=>(
                <MovieCard key={movie.id} movie={movie}/>
              ))}
            </ul>
          )}
         </section>
      </div>
    </main>
  )
}

export default App