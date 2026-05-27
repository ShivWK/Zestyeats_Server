import express from 'express';
const swiggyRouter = express.Router();

import {
  homePageData,
  addressAutoComplete,
  addressRecommend,
  addressFromCoordinates,
  specificFoodCategoryData,
  specificRestaurantData,
  dishSearchData,
  searchHomeData,
  specificFoodSearchSuggestions,
  suggestedDataHandler,
  extraSuggestionsData,
  searchOnTabClick,
  cityLocalityCuisineCardHandler,
  restaurantChainInCityHandler,
  dishesInCityHandler,
} from './../controllers/swiggyControllers.js';

swiggyRouter.get('/homepageData', homePageData);
swiggyRouter.get('/place-autocomplete', addressAutoComplete);
swiggyRouter.get('/address-recommend', addressRecommend);
swiggyRouter.get('/address-from-coordinates', addressFromCoordinates);
swiggyRouter.get('/specific-restaurants', specificRestaurantData);
swiggyRouter.get('/food-category', specificFoodCategoryData);
swiggyRouter.get('/dish-search', dishSearchData);
swiggyRouter.get('/search-home-data', searchHomeData);
swiggyRouter.get('/search-food-suggestions', specificFoodSearchSuggestions);
swiggyRouter.get('/extra-suggestions', extraSuggestionsData);
swiggyRouter.get('/suggested-data', suggestedDataHandler);
swiggyRouter.get('/search-tab-data', searchOnTabClick);
swiggyRouter.get('/city-locality-cuisine-data', cityLocalityCuisineCardHandler);
swiggyRouter.get('/restaurant-chain-in-city', restaurantChainInCityHandler);
swiggyRouter.get('/popular-dish-in-city', dishesInCityHandler);

export default swiggyRouter;
