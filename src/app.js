import express from "express";
import { engine } from "express-handlebars";
import cmsAdapterRecentScreenings from "./cmsAdapterRecentScreenings.js";
import getRecentScreenings from "./getRecentScreenings.js";
import {
  getMovie,
  getMovies,
  getMovieScreenings,
  averageRating,
} from "./movies.js";
import { marked } from "marked";
import getMovieReviews from "./getMovieReviews.js";
import paginateReviews from "./paginateReviews.js";
import cmsAdapterReviews from "./cmsAdapterReviews.js";
import { builder } from "./buildReviewBody.js";
import { parser as reviewParser } from "./postReviewParser.js";
import { postRequest } from "./reviewPostFunction.js";
import cmsAdapter from "./cmsAdapterScreenings.js";

const app = express();
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./templates");

//used for POST request.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const menu = [
  { name: "Movies", url: "/movies" },
  { name: "About us", url: "/aboutus" },
  { name: "News & events", url: "/newsevents" },
];

async function renderPage(response, page, extraData = {}) {
  response.render(page, {
    menuLink: menu.map((link) => {
      return {
        label: link.name,
        link: link.url,
      };
    }),
    ...extraData,
  });
}

app.get("/", async (request, response) => {
  renderPage(response, "index");
});

app.get("/api/movies/recent-screenings", async (request, response) => {
  const data = await getRecentScreenings(cmsAdapterRecentScreenings);
  response.json(data);
});

app.get("/movies", async (request, response) => {
  const movies = await getMovies();
  renderPage(response, "movies", { movies });
});

app.get("/movies/:movieId", async (request, response) => {
  try {
    const movie = await getMovie(request.params.movieId);
    movie.intro = marked(movie.intro);
    renderPage(response, "movie", { movie });
  } catch (error) {
    renderPage(response, "404");
  }
});

app.get("/aboutus", async (request, response) => {
  renderPage(response, "aboutus");
});

app.get("/newsevents", async (request, response) => {
  renderPage(response, "newsevents");
});

app.get("/api/movies/:id/screenings", async (request, response) => {
  try {
    const movieScreenings = await getMovieScreenings(
      cmsAdapter,
      request.params.id
    );
    response.json(movieScreenings);
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/aboutus", async (request, response) => {
  renderPage(response, "aboutus");
});

app.get("/newsevents", async (request, response) => {
  renderPage(response, "newsevents");
});

//get reviews for a movie
app.get("/api/movies/:movieId", async (request, response) => {
  try {
    const reviewsData = await getMovieReviews(
      request.params.movieId,
      cmsAdapterReviews
    );
    const reviewArray = await paginateReviews(
      reviewsData,
      request.query.page,
      request.query.limit
    );

    if (reviewArray.length > 1) {
      response.status(200).json(reviewArray);
    } else {
      response.sendStatus(404).json({ message: error.message });
    }
  } catch (error) {
    response.sendStatus(404);
  }
});

app.post("/api/movies/review", (request, response) => {
  //Extracts URL-Query string to object
  const reviewAtributes = reviewParser(request);
  console.log(reviewAtributes);
  // Convert the JavaScript object to a JSON string
  const jsonData = JSON.stringify(builder(reviewAtributes)) + "\n";
  // response.status(200).send('ok');
  //Print out the json-string to make sure its correct.
  console.log("review attr: ", jsonData);

  //Url to DB for post-function
  const url = "https://plankton-app-xhkom.ondigitalocean.app/api/reviews";

  //request the post command with url and json-string.
  postRequest(url, jsonData, response);
});

app.get("/api/movies/rating/:id", async (req, res) => {
  try {
    const data = await averageRating(req.params.id);
    res.json(data);
  } catch (error) {
    console.log(error.message);
  }
});

app.use("/static", express.static("./static"));
app.use("/public", express.static("./public"));

export default app;
