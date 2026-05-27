import SessionModel from './../models/authModals/sessionModel.js';

const cleanGuestSessionData = async (gSid) => {
  try {
    await SessionModel.findByIdAndUpdate(gSid, {
      $set: {
        'data.cartItems': {},
        'data.itemsToBeAddedInCart': {},
        'data.wishListedItems': {},
        'data.favRestaurants': [],
        'data.recentLocations': [],
      },
    });
  } catch (err) {
    console.log('Error in cleaning the guest session', err);
  }
};

export default cleanGuestSessionData;
