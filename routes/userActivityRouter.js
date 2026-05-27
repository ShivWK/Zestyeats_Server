import express from 'express';

import {
  checkSessionId,
  protectionCheck,
  getUserActivityData,
  setUserCartData,
  setUserFavRestaurantData,
  setUserItemsToBeAddedInCartData,
  setUserRecentLocationData,
  setUserWishListData,
  getLiveSessions,
  logTheUserOut,
  deleteAccount,
  verifyDeleteOtp,
  sendEditOTP,
  updateProfile,
  getUserProfile,
  verifyCredentials,
  getOrders,
} from '../controllers/userActivityControllers.js';

import {
  getUserAddress,
  setUserAddress,
  updateUserAddress,
  deleteUserAddress
} from '../controllers/addressController.js';

const userActivityRouter = express.Router();

userActivityRouter.use(checkSessionId);
userActivityRouter.use(protectionCheck);

userActivityRouter.route('/userActivityData').get(getUserActivityData);
userActivityRouter.route('/loggedInSession').get(getLiveSessions);
userActivityRouter
  .route('/userAddress')
  .get(getUserAddress)
  .post(setUserAddress)
  .delete(deleteUserAddress)
  .put(updateUserAddress);

userActivityRouter.route('/deleteAccount/:mode').post(deleteAccount);
userActivityRouter.route('/deleteOTP').post(verifyDeleteOtp);

userActivityRouter.route('/orders').get(getOrders);

userActivityRouter.route('/logout/:mode').post(logTheUserOut);
userActivityRouter.route('/editOTP/:mode/:action').post(sendEditOTP);
userActivityRouter.route('/profile').post(updateProfile).get(getUserProfile);
userActivityRouter.route('/verification/:mode').post(verifyCredentials);

userActivityRouter.route('/userCartData').patch(setUserCartData);
userActivityRouter.route('/userWishListData').patch(setUserWishListData);
userActivityRouter
  .route('/userFavRestaurantData')
  .patch(setUserFavRestaurantData);
userActivityRouter
  .route('/userItemsToBeAddedInCartData')
  .patch(setUserItemsToBeAddedInCartData);
userActivityRouter
  .route('/userRecentLocationData')
  .patch(setUserRecentLocationData);

export default userActivityRouter;
