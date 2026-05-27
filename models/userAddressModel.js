import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,

  country: {
    type: String,
    require: true,
  },

  countryCode: {
    type: String,
    required: true,
  },

  userName: {
    type: String,
    require: true,
  },

  userPhone: {
    type: Number,
    require: true,
  },

  flatNumber: {
    type: String,
    require: true,
  },

  landmark: String,

  pinCode: {
    type: Number,
    require: true,
  },

  state: {
    type: String,
    require: true,
  },

  latLong: mongoose.Schema.Types.Mixed,
});

const AddressModel = mongoose.model('Address', addressSchema);
export default AddressModel;
