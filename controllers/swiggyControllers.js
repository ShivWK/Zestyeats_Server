import axios from 'axios';
import { JSDOM } from 'jsdom';

const client = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: process.env.BASE_URL,
    Origin: process.env.BASE_URL,
  },
});

const asyncErrorHandler = (func) => {
  return (req, res, next) => {
    func(req, res, next).catch((err) => {
      console.log('Failed to fetch', err);
      res.status(500).json({
        status: 'failed',
        error: err.message || 'Something went wrong',
      });
    });
  };
};

const missingParamsError = (msg, res) => {
  return res.status(400).json({
    status: 'failed',
    message: msg,
  });
};

export const homePageData = async (req, res) => {
  console.log(req.headers);
  console.log(req.signedCookies);

  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: 'Both lat and lng query parameters are required' });
    }

    const mainUrl = `${process.env.BASE_URL}/dapi/restaurants/list/v5?lat=${lat}&lng=${lng}&page_type=DESKTOP_WEB_LISTING`;

    const response = await client.get(mainUrl);

    const origin = req.headers.origin;
    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET',
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Swiggy Proxy Error:', error.message);
    res.status(404).json({
      status: 'failed',
      error: error.message,
    });
  }
};

export const addressRecommend = async (req, res) => {
  try {
    const { place_id } = req.query;

    if (!place_id) {
      return res
        .status(400)
        .json({ error: 'place_id query parameter is required' });
    }

    const mainUrl = `${process.env.BASE_URL}/dapi/misc/address-recommend?place_id=${place_id}`;

    const response = await client.get(mainUrl);
    const origin = req.headers.origin;

    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET',
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Address Recommend Error:', error.message);
    res.status(404).json({
      status: 'failed',
      error: error.message,
    });
  }
};

export const addressAutoComplete = async (req, res) => {
  try {
    const { input } = req.query;

    if (!input) {
      return res
        .status(400)
        .json({ error: 'Input query parameter is required' });
    }

    const mainUrl = `${process.env.BASE_URL}/dapi/misc/place-autocomplete?input=${input}&types=`;

    const response = await client.get(mainUrl);
    const origin = req.headers.origin;

    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET',
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Place Autocomplete Error:', error.message);
    res.status(404).json({
      status: 'failed',
      error: error.message,
    });
  }
};

export const addressFromCoordinates = async (req, res) => {
  try {
    const { lat1, lng1 } = req.query;

    if (!lat1 || !lng1) {
      return res.status(400).json({
        error: 'Both lat and lng query parameters are required',
      });
    }

    const mainUrl = `${process.env.BASE_URL}/dapi/misc/address-recommend?latlng=${lat1}%2C${lng1}`;

    const response = await client.get(mainUrl);
    const origin = req.headers.origin;

    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET',
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Address from Coordinates Error:', error.message);
    res.status(404).json({
      status: 'failed',
      error: error.message,
    });
  }
};

export const specificRestaurantData = asyncErrorHandler(async (req, res, next) => {
  const { lat, lng, id } = req.query;

  if (!lat || !lng || !id) {
    return res.status(400).json({
      error: 'lat, lng and id are required',
    });
  }

  const mainUrl = `${process.env.BASE_URL}/dapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=${lat}&lng=${lng}&restaurantId=${id}&catalog_qa=undefined&submitAction=ENTER`;

  const response = await client.get(mainUrl);
  const origin = req.headers.origin;

  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET',
  });

  return res.status(200).json(response.data);
});

export const dishSearchData = async (req, res) => {
  const { lat, lng, restro_Id, searchTerm } = req.query;

  console.log(lat, lng, restro_Id, searchTerm);

  if (!lat || !lng || !restro_Id || !searchTerm) {
    return res.status(400).json({
      error: 'lat, lng, restro_id and searchTerm are required',
    });
  }

  const searchUrl = `${process.env.BASE_URL}/dapi/menu/pl/search?lat=${lat}&lng=${lng}&restaurantId=${restro_Id}&isMenuUx4=true&query=${searchTerm}&submitAction=ENTER`;

  // console.log(searchUrl);

  try {
    const response = await client.get(searchUrl);
    // console.log(response);
    const origin = req.headers.origin;

    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET',
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.log("Dish search data can't be fetched; ", err);
    res.status(404).json({
      status: 'failed',
      error: err.message,
    });
  }
};

export const specificFoodCategoryData = asyncErrorHandler(async (req, res) => {
  const { lat, lng, collection_id, tags } = req.query;

  if (!lat || !lng || !collection_id || !tags) {
    return res.status(400).json({
      error: 'lat, lng, collection_id, and tags are required',
    });
  }

  const mainUrl = `${process.env.BASE_URL}/dapi/restaurants/list/v5?lat=${lat}&lng=${lng}&collection=${collection_id}&tags=${tags}&sortBy=&filters=&type=rcv2&offset=0&page_type=null`;

  const response = await client.get(mainUrl);
  const origin = req.headers.origin;

  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET',
  });

  return res.status(200).json(response?.data);
});

export const searchHomeData = asyncErrorHandler(async (req, res, next) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      status: 'fail',
      error: 'Provide lat and lng',
    });
  }

  const mainUrl = `${process.env.BASE_URL}/dapi/landing/PRE_SEARCH`;

  const result = await client.get(mainUrl, {
    params: {
      lat,
      lng,
    },
  });

  const origin = req.headers.origin;

  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET',
  });

  return res.status(200).json(result?.data);
});

export const specificFoodSearchSuggestions = asyncErrorHandler(
  async (req, res, next) => {
    const { lat, lng, food } = req.query;

    if (!lat || !lng || !food) {
      return missingParamsError('Please provide lat , lng, and food', res);
    }

    const mainUrl = `${process.env.BASE_URL}/dapi/restaurants/search/suggest?trackingId=null&includeIMItem=true`;

    let response = await client.get(mainUrl, {
      params: {
        lat,
        lng,
        str: food,
      },
    });

    const origin = req.headers.origin;

    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET',
    });

    res.status(200).json(response.data);
  },
);

export const extraSuggestionsData = asyncErrorHandler(async (req, res, next) => {
  const { lat, lng, food } = req.query;

  if (!lat || !lng || !food) {
    return missingParamsError('Please provide lat , lng, and food', res);
  }

  const mainUrl = `${process.env.BASE_URL}/dapi/restaurants/search/v3?trackingId=null&submitAction=DEFAULT_SUGGESTION&queryUniqueId=14731ed6-27b3-ab73-ccc8-2c29158c3c5d`;

  let response = await client.get(mainUrl, {
    params: {
      lat,
      lng,
      str: food,
    },
  });

  const origin = req.headers.origin;

  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET',
  });

  res.status(200).json(response.data);
});

export const suggestedDataHandler = asyncErrorHandler(async (req, res, next) => {
  const { lat, lng, str, metadata } = req.query;

  if (!lat || !lng || !str || !metadata) {
    return missingParamsError(
      'Please provide lat , lng, str and metadata',
      res,
    );
  }

  const mainUrl = `${process.env.BASE_URL}/dapi/restaurants/search/v3?trackingId=b3988e37-6215-174a-2625-44876a86072b&submitAction=SUGGESTION&queryUniqueId=`;

  let response = await client.get(mainUrl, {
    params: {
      lat,
      lng,
      str,
      metadata,
    },
  });

  const origin = req.headers.origin;

  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET',
  });

  res.status(200).json(response.data);
});

export const searchOnTabClick = asyncErrorHandler(async (req, res, next) => {
  const { lat, lng, str, submitAction, selectedPLTab } = req.query;

  if (!lat || !lng || !str || !submitAction || !selectedPLTab) {
    return missingParamsError('Please provide lat , lng, and ', res);
  }

  const mainUrl = `${process.env.BASE_URL}/dapi/restaurants/search/v3?trackingId=undefined&queryUniqueId=`;

  let response = await client.get(mainUrl, {
    params: {
      lat,
      lng,
      str,
      submitAction,
      selectedPLTab,
    },
  });

  const origin = req.headers.origin;

  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET',
  });

  res.status(200).json(response.data);
});

export const cityLocalityCuisineCardHandler = asyncErrorHandler(
  async (req, res, next) => {
    const { city, type } = req.query;

    if (!city) {
      return missingParamsError(
        'Please provide city or locality or cuisine type',
        res,
      );
    }

    const mainUrl = `${process.env.BASE_URL}/city/${city}/${type ? type : ''}order-online`;

    console.log(mainUrl);

    const html = await client.get(mainUrl);
    const dom = new JSDOM(html.data);
    const scriptContent =
      dom.window.document.getElementById('__NEXT_DATA__')?.textContent;

    if (!scriptContent) {
      throw new Error('Script tag with restaurants data not found.');
    }

    const restaurantData = JSON.parse(scriptContent);

    const origin = req.headers.origin;

    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET',
    });

    res.status(200).json(restaurantData);
  },
);

export const restaurantChainInCityHandler = asyncErrorHandler(
  async (req, res, next) => {
    const { city, restaurant } = req.query;
    console.log('hit', restaurant, city);

    if (!city || !restaurant)
      return missingParamsError('Please provide city and restaurant name', res);

    const mainUrl = `${process.env.BASE_URL}/city/${city}/${restaurant}`;

    const html = await client.get(mainUrl);
    const dom = new JSDOM(html.data);
    const scriptContent =
      dom.window.document.getElementById('__NEXT_DATA__')?.textContent;

    if (!scriptContent) {
      throw new Error('Script tag with restaurants data not found.');
    }

    const restaurantData = JSON.parse(scriptContent);

    const origin = req.headers.origin;

    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET',
    });

    res.status(200).json(restaurantData);
  },
);

export const dishesInCityHandler = asyncErrorHandler(async (req, res, next) => {
  const { city, dish } = req.query;
  console.log('hit', dish, city);

  if (!city || !dish)
    return missingParamsError('Please provide city and dish', res);

  const mainUrl = `${process.env.BASE_URL}/city/${city}/${dish}-dish-restaurants`;

  const html = await client.get(mainUrl);
  const dom = new JSDOM(html.data);
  const scriptContent =
    dom.window.document.getElementById('__NEXT_DATA__')?.textContent;

  if (!scriptContent) {
    throw new Error('Script tag with restaurants data not found.');
  }

  const restaurantData = JSON.parse(scriptContent);

  const origin = req.headers.origin;

  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET',
  });

  res.status(200).json(restaurantData);
});
