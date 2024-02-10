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