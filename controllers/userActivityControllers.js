import UserActivityModal from './../models/userActivityModel.js';
import SessionModel from '../models/authModals/sessionModel.js';
import UserModal from '../models/userModel.js';
import OtpModel from '../models/authModals/otpModel.js';
import AddressModel from '../models/userAddressModel.js';
import OrderModel from '../models/ordersModel.js';

import deviceFingerPrinter from '../utils/deviceFingerPrinter.js';
import { UAParser } from 'ua-parser-js';
import calSessionValidationScore from '../utils/calSessionValidationScore.js';
import cleanGuestSessionData from '../utils/cleanGuestSessionData.js';

import mailTemplate from '../utils/emailTemplates/signupEmail.js';
import crypto from 'crypto';
import sendEmail from '../utils/email.js';
import sendSMS from '../utils/sms.js';

export const checkSessionId = (req, res, next) => {
  if (!req.signedCookies.rSid) {
    return res.status(400).json({
      status: 'failed',
      message: 'Session ID not found in signed cookies',
    });
  }

  next();
};

export const protectionCheck = async (req, res, next) => {
  const rSid = req.signedCookies.rSid;
  const headers = req.headers;
  const clientUa = headers['x-user-agent'];
  const uaResult = UAParser(clientUa);

  console.log('Protection HIT');
  const clientDeviceInfo = deviceFingerPrinter(uaResult, req);

  if (!rSid) {
    return res.status(401).json({
      status: 'failed',
      message: 'Missing session ID',
    });
  }

  try {
    const session = await SessionModel.findById(rSid);

    if (!session) {
      return res.status(401).json({
        status: 'failed',
        message: 'unauthorized',
      });
    }

    const sessionDeviceInfo = session.deviceInfo;
    const score = calSessionValidationScore(
      sessionDeviceInfo,
      clientDeviceInfo,
    );

    if (score < 10) {
      return res.status(401).json({
        status: 'failed',
        message: 'Not a valid session. Please login again.',
        login: true,
      });
    }

    req.UserID = session.userId;

    await SessionModel.findByIdAndUpdate(rSid, {
      $set: { createdAt: new Date() },
    });
    next();
  } catch (err) {
    console.log('Error in getting session', err);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const getUserActivityData = async (req, res, next) => {
  const userId = req.UserID;

  try {
    const doc = await UserActivityModal.findOneAndUpdate(
      { userId },
      {},
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: 'success',
      data: doc,
    });
  } catch (err) {
    console.log('Error in getting the doc', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const getLiveSessions = async (req, res, next) => {
  const userId = req.UserID;
  const sid = req.signedCookies.rSid;

  try {
    const sessions = await SessionModel.find({ userId, type: 'registered' });
    const resultArr = sessions.map((session) => {
      const activeNow = sid == session.id;

      return {
        id: session.id,
        data: session.deviceInfo,
        lastActive: session.createdAt,
        activeNow,
      };
    });

    return res.status(200).json({
      status: 'success',
      data: resultArr,
    });
  } catch (err) {
    console.log('Error in finding sessions', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const getUserAddress = async (req, res, next) => {
  const userId = req.UserID;

  try {
    const result = await UserModal.findById(userId);

    return res.status(200).json({
      status: 'success',
      data: result.address,
    });
  } catch (err) {
    console.log('Error in fetching user address', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error.',
    });
  }
};

export const setUserAddress = async (req, res, next) => {
  const userId = req.UserID;
  const data = req.body.address;

  if (!data) {
    return res.status(400).json({
      status: 'failed',
      message: 'Please Proved the address',
    });
  }

  try {
    const result = await UserModal.findByIdAndUpdate(userId, {
      $push: { address: data },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Address added successfully',
      data: result.address,
    });
  } catch (err) {
    console.log('Error in fetching user address', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error.',
    });
  }
};

export const setUserCartData = async (req, res, next) => {
  const data = req.body.cartItems;
  const userId = req.UserID;

  try {
    const doc = await UserActivityModal.findOneAndUpdate(
      { userId },
      { $set: { cartItems: data } },
      { new: true },
    );

    return res.status(200).json({
      status: 'success',
      data: doc,
    });
  } catch (err) {
    console.log('Error in getting the doc', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const setUserWishListData = async (req, res, next) => {
  const data = req.body.wishListedItems;
  const userId = req.UserID;

  try {
    const doc = await UserActivityModal.findOneAndUpdate(
      { userId },
      { $set: { wishListedItems: data } },
      { new: true },
    );

    return res.status(200).json({
      status: 'success',
      data: doc,
    });
  } catch (err) {
    console.log('Error in getting the doc', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const setUserFavRestaurantData = async (req, res, next) => {
  const data = req.body.favRestaurants;
  const userId = req.UserID;

  try {
    const doc = await UserActivityModal.findOneAndUpdate(
      { userId },
      { $set: { favRestaurants: data } },
      { new: true },
    );

    return res.status(200).json({
      status: 'success',
      data: doc,
    });
  } catch (err) {
    console.log('Error in getting the doc', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const setUserRecentLocationData = async (req, res, next) => {
  const data = req.body.recentLocations;
  const userId = req.UserID;

  try {
    const doc = await UserActivityModal.findOneAndUpdate(
      { userId },
      { $set: { recentLocations: data } },
      { new: true },
    );

    return res.status(200).json({
      status: 'success',
      data: doc,
    });
  } catch (err) {
    console.log('Error in getting the doc', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const setUserItemsToBeAddedInCartData = async (req, res, next) => {
  const data = req.body.itemsToBeAddedInCart;
  const userId = req.UserID;

  try {
    const doc = await UserActivityModal.findOneAndUpdate(
      { userId },
      { $set: { itemsToBeAddedInCart: data } },
      { new: true },
    );

    return res.status(200).json({
      status: 'success',
      data: doc,
    });
  } catch (err) {
    console.log('Error in getting the doc', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const logTheUserOut = async (req, res, next) => {
  const gSid = req.signedCookies.gSid;
  const mode = req.params.mode;
  const sessionId = req.body.id;
  const userId = req.UserID;

  if (mode === 'single') {
    if (!sessionId) {
      return res.status(400).json({
        status: 'failed',
        message: 'Session ID is required',
      });
    }

    try {
      const deletedSession = await SessionModel.findByIdAndDelete(sessionId);

      if (!deletedSession) {
        return res.status(404).json({
          status: 'failed',
          message: 'Session not found',
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'User logged out successfully',
      });
    } catch (err) {
      console.log('Error in logging the user out', err);

      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  } else {
    try {
      const deletedSession = await SessionModel.deleteMany({ userId });

      if (!deletedSession) {
        return res.status(404).json({
          status: 'failed',
          message: 'Sessions with the given user are not found',
        });
      }

      await cleanGuestSessionData(gSid);

      res.status(200).json({
        status: 'success',
        message: 'User logged out from all sessions successfully',
      });
    } catch (err) {
      console.log('Error in logging the user out', err);

      return res.status(500).json({
        status: 'error',
        login: 'Internal server error',
      });
    }
  }

  await cleanGuestSessionData(gSid);
};

export const verifyDeleteOtp = async (req, res, next) => {
  const otp = req.body.otp;
  const email = req.body.email;

  const userHashedOTP = crypto
    .createHash('sha256')
    .update(String(otp))
    .digest('hex');

  try {
    const otpDoc = await OtpModel.findOne({ email });

    if (!otpDoc) {
      return res.status(410).json({
        status: 'failed',
        message: 'OTP expired',
      });
    }

    if (userHashedOTP === otpDoc.hashedOtp) {
      await OtpModel.deleteOne({ _id: otpDoc._id });

      return res.status(200).json({
        status: 'success',
        message: 'OTP verified',
      });
    } else {
      return res.status(401).json({
        status: 'failed',
        message: 'invalid OTP',
      });
    }
  } catch (err) {
    console.log('Error in verifying the OTP', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Please try after sometime.',
    });
  }
};

export const deleteAccount = async (req, res, next) => {
  const userId = req.UserID;
  const mode = req.params.mode;

  try {
    if (mode === 'sendOTP') {
      const user = await UserModal.findById(userId);
      const email = user.email;

      await OtpModel.deleteMany({ email });

      const deleteOTP = crypto.randomInt(100000, 1000000);
      const text = mailTemplate(user.name, deleteOTP, 'account deletion');

      const resp = await sendEmail(email, text);

      console.log('deletion mail send', resp);

      const hashedOTP = crypto
        .createHash('sha256')
        .update(String(deleteOTP))
        .digest('hex');
      await OtpModel.create({
        email,
        for: 'delete',
        hashedOtp: hashedOTP,
      });

      return res.status(200).json({
        status: 'success',
        message: 'OTP send successfully to your email',
      });
    } else if (mode === 'deleteAccount') {
      await UserModal.findByIdAndDelete(userId);
      await SessionModel.findOneAndDelete({ userId, type: 'registered' });
      await AddressModel.findOneAndDelete({ userId });
      await UserActivityModal.findOneAndDelete({ userId });

      return res.status(200).json({
        status: 'success',
        message: 'Account deleted successfully',
      });
    }
  } catch (err) {
    console.log('Error in sending deletion OTP', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Please try after sometime.',
    });
  }
};

export const sendEditOTP = async (req, res, next) => {
  const forWhat = req.body.forWhat;
  const mode = req.params.mode;
  const action = req.params.action;
  const userId = req.UserID;

  if (!forWhat) {
    return req.status(400).json({
      status: 'failed',
      message: 'Please provide where to send the OTP',
    });
  }

  const editOTP = crypto.randomInt(100000, 1000000);
  const hashedOTP = crypto
    .createHash('sha256')
    .update(String(editOTP))
    .digest('hex');

  try {
    const user = await UserModal.findById(userId);

    if (mode === 'phone') {
      await OtpModel.deleteMany({ [mode]: forWhat });

      const text = `Hi, your OTP for verification is ${editOTP}. Do not share this code with anyone. This code is valid for 5 minutes.`;

      const result = await sendSMS(forWhat, text);
      console.log('OTP sms send', result);

      await OtpModel.create({
        phone: forWhat,
        for: 'verification',
        hashedOtp: hashedOTP,
      });

      return res.status(200).json({
        status: 'success',
        message: 'OTP successfully send to your phone number.',
      });
    } else if (mode === 'email') {
      await OtpModel.deleteMany({ [mode]: forWhat });
      const purpose =
        action === 'verification' ? 'verification' : 'account details update';
      const type = action === 'verification' ? 'verification' : 'edit';

      const text = mailTemplate(user.name, editOTP, purpose);

      const result = await sendEmail(forWhat, text);
      console.log('OTP send successfully', result);

      await OtpModel.create({
        email: forWhat,
        for: type,
        hashedOtp: hashedOTP,
      });

      return res.status(200).json({
        status: 'success',
        message: 'OTP send successfully to your email',
      });
    }
  } catch (err) {
    console.log('Error in sending profile update OTP', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Please try after sometime.',
    });
  }
};

export const updateProfile = async (req, res, next) => {
  const userId = req.UserID;

  const body = req.body;
  const data = body.data;
  const otp = body.OTP;
  const isEmailChanged = body.isEmailChanged;
  const isPhoneChanged = body.isPhoneChanged;

  if (!data || !otp) {
    return res.status(400).json({
      status: 'failed',
      message: 'Please provide data',
    });
  }

  try {
    const userHashedOTP = crypto
      .createHash('sha256')
      .update(String(otp))
      .digest('hex');
    const otpDoc = await OtpModel.findOne({ email: data.oldEmail });

    if (!otpDoc) {
      return res.status(410).json({
        status: 'failed',
        message: 'OTP expired',
      });
    }

    if (userHashedOTP === otpDoc.hashedOtp) {
      if (isEmailChanged) {
        const alreadyExists = await UserModal.findOne({ email: data.email });

        if (alreadyExists) {
          return res.status(400).json({
            status: 'failed',
            message: 'Email already exist, use different email.',
          });
        }
      }

      const updateData = {
        name: data.name,
        phone: data.phone,
        email: data.email,
      };

      if (isEmailChanged) updateData.isEmailVerified = false;
      if (isPhoneChanged) updateData.isNumberVerified = false;

      const result = await UserModal.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { runValidators: true },
      );
      await OtpModel.deleteOne({ _id: otpDoc._id });

      return res.status(200).json({
        status: 'success',
        message: 'Profile Updated successfully',
      });
    } else {
      return res.status(401).json({
        status: 'failed',
        message: 'invalid OTP',
      });
    }
  } catch (err) {
    console.log('Error in updating the profile', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Please try after sometime.',
    });
  }
};

export const getUserProfile = async (req, res, next) => {
  const userId = req.UserID;

  try {
    const User = await UserModal.findById(userId);

    const user = {
      name: User.name,
      phone: User.phone,
      email: User.email,
      isEmailVerified: User.isEmailVerified,
      isNumberVerified: User.isNumberVerified,
    };

    return res.status(200).json({
      status: 'success',
      data: user,
      auth: true,
    });
  } catch (err) {
    console.log('Error in fetching user details', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Please try after sometime.',
    });
  }
};

export const verifyCredentials = async (req, res, next) => {
  const userId = req.UserID;
  const mode = req.params.mode;
  const otpFor = req.body.otpFor;

  const otp = req.body.OTP;
  const userHashedOTP = crypto
    .createHash('sha256')
    .update(String(otp))
    .digest('hex');

  if (!otp || (mode !== 'phone' && mode !== 'email')) {
    return req.status(400).json({
      status: 'success',
      message: 'Please provide valid data.',
    });
  }

  try {
    const otpDoc = await OtpModel.findOne({ [mode]: otpFor });

    if (!otpDoc) {
      return res.status(410).json({
        status: 'failed',
        message: 'OTP expired',
      });
    }

    if (userHashedOTP === otpDoc.hashedOtp) {
      let updateData = null;

      if (mode === 'phone') updateData = { isNumberVerified: true };
      else if (mode === 'email') updateData = { isEmailVerified: true };

      const updated = await UserModal.findByIdAndUpdate(userId, {
        $set: updateData,
      });

      return res.status(200).json({
        status: 'success',
        message: `${mode === 'phone' ? 'Phone number verified' : 'Email verified'}`,
      });
    } else {
      return res.status(401).json({
        status: 'failed',
        message: 'invalid OTP',
      });
    }
  } catch (err) {
    console.log('Error in verifying user details', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Please try after sometime.',
    });
  }
};

export const getOrders = async (req, res, next) => {
  const userId = req.UserID;

  try {
    const orders = await OrderModel.find({ userId });

    return res.status(200).json({
      status: 'success',
      data: orders,
    });
  } catch (err) {
    console.log('Error in fetching orders', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
