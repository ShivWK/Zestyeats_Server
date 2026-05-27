import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    unique: true,
    required: true,
    ref: 'User',
  },

  cartItems: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  itemsToBeAddedInCart: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  wishListedItems: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  favRestaurants: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },

  recentLocations: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
});

const UserActivityModal = mongoose.model('UserActivity', userActivitySchema);
export default UserActivityModal;
