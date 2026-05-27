import AddressModel from '../models/userAddressModel.js';

export const getUserAddress = async (req, res, next) => {
  const userId = req.UserID;

  try {
    const result = await AddressModel.find({ userId });

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    console.log('Error occurred while fetching address', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const setUserAddress = async (req, res, next) => {
  const userId = req.UserID;
  const data = req.body.address;

  try {
    let searchString = `${data.flatNumber}, ${data.state}, ${data.pinCode}, ${data.country}`;
    searchString.replace(/^[^ ]+\s*/, '');

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${searchString}&key=${process.env.VITE_GOOGLE_MAPS_KEY}`,
    );

    const locationData = await response.json();
    const latLong = locationData?.results?.[0].geometry?.location;

    await AddressModel.create({
      userId,
      country: data.country,
      userName: data.name,
      userPhone: data.phone,
      flatNumber: data.flatNumber,
      landmark: data.landmark,
      pinCode: data.pinCode,
      state: data.state,
      countryCode: data.countryCode,
      latLong: latLong,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Address added successfully.',
    });
  } catch (err) {
    console.log('Error occurred while adding address', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const updateUserAddress = async (req, res, next) => {
  const userId = req.UserID;
  const data = req.body.address;

  try {
    await AddressModel.findByIdAndUpdate(data.addressId, {
      userId,
      country: data.country,
      userName: data.name,
      userPhone: data.phone,
      flatNumber: data.flatNumber,
      landmark: data.landmark,
      pinCode: data.pinCode,
      state: data.state,
      countryCode: data.countryCode,
      latLong: data.latLong,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Address updated successfully.',
    });
  } catch (err) {
    console.log('Error occurred while adding address', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const deleteUserAddress = async (req, res, next) => {
  console.log('delete hit');
  const id = req.body.addressId;

  if (!id) {
    return res.status(400).json({
      status: 'failed',
      message: 'Please provide address id.',
    });
  }

  try {
    await AddressModel.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'success',
      message: 'Address deleted successfully',
    });
  } catch (err) {
    console.log('Error occurred while fetching address', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
