import fetch from "node-fetch";

const API_BASE = "https://plankton-app-xhkom.ondigitalocean.app/api";

export async function getMovies() {
  const response = await fetch(API_BASE + "/movies");
  const payload = await response.json();
  const modifiedArray = payload.data.map((obj) => {
    return {
      id: obj.id,
      ...obj.attributes,
    };
  });
  return modifiedArray;
}

export async function getMovie(id) {
  const response = await fetch(API_BASE + "/movies/" + id);
  const payload = await response.json();
  return {
    id: payload.data.id,
    ...payload.data.attributes,
  };
}

export async function getMovieScreenings(cmsAdapter, id) {
  try {
    const payload = await cmsAdapter.loadAllMovieScreenings(id);
    return payload.data
      .map((screening) => ({
        id: screening.id,
        ...screening.attributes,
      }))
      .filter((screening) => {
        const screeningDate = new Date(screening.start_time);
        const currentDate = new Date();

        return screeningDate >= currentDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.start_time);
        const dateB = new Date(b.start_time);

        return dateA - dateB;
      });
  } catch (error) {
    console.log(error.message);
  }
}
export async function averageRating(id) {
  try {
    const response = await fetch(
      API_BASE + "/reviews?populate=movie&filters[movie]=" + id
    );
    const payload = await response.json();
    const newArray = payload.data.map((object) => {
      return {
        rating: object.attributes.rating,
        imdbId: object.attributes.movie.data.attributes.imdbId,
      };
    });
    const averageRatingValue = newArray.map((item) => {
      const ratingValues = item.rating;
      return ratingValues;
    });
    const changeList = averageRatingValue.filter((object) => object !== null);

    async function calculateAverage(array) {
      let sum = 0;
      let arraylength = array.length;

      array.forEach(async (obj) => {
        sum += obj;
        return sum;
      });
      const test = sum / arraylength;
      return test;
    }
    const averageValue = await calculateAverage(changeList);

    const imdbMovieID = newArray[0].imdbId;
    const OMDB_rating = await fetch(
      "https://www.omdbapi.com/?apikey=bf65b015&i=" + imdbMovieID
    );
    const OMDB_payload = await OMDB_rating.json();

    if (newArray.length < 15) {
      return OMDB_payload.imdbRating;
    } else {
      return averageValue.toFixed(1);
    }
  } catch (error) {
    console.log(error.message);
  }
}
