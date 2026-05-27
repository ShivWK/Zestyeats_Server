import SessionModel from '../models/authModals/sessionModel.js';
import OtpModal from '../models/authModals/otpModel.js';
import AccessModal from '../models/authModals/blockAccessModal.js';
import UserModal from '../models/userModel.js';
import UserActivityModal from '../models/userActivityModel.js';
import recaptchaVerification from '../utils/recaptchaVerification.js';
import crypto from 'crypto';
import sendMail from '../utils/email.js';
import sms from '../utils/sms.js';
import { UAParser } from 'ua-parser-js';
import signupEmail from '../utils/emailTemplates/signupEmail.js';
import deviceFingerPrinter from '../utils/deviceFingerPrinter.js';
import cleanGuestSessionData from '../utils/cleanGuestSessionData.js';

export const guestSession = async (req, res, next) => {
  const headers = req.headers;
  const ua = headers['x-user-agent'];
  const uaResult = UAParser(ua);
  const gSid = req.signedCookies.gSid;

  try {
    const session = await SessionModel.findById(gSid);
    if (!session) {
      const session = await SessionModel.create({
        deviceInfo: deviceFingerPrinter(uaResult, req),
        type: 'guest',
      });

      res.cookie('gSid', session.id, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        signed: true,
        secure: true,
        sameSite: 'None',
        path: '/',
      });

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Session created',
          sessionId: session.id,
        },
      });
    } else {
      res.status(200).json({
        status: 'success',
        data: {
          message: 'Session created',
          sessionId: req.signedCookies.gSid,
        },
      });
    }
  } catch (err) {
    console.error('Error in session creation', err);

    res.status(500).json({
      status: 'failed',
      message: err.message,
    });
  }
};

export const signup = async (req, res) => {
  const headers = req.headers;
  const body = req.body;
  const { name, phone_number, email } = body.userData;
  const token = body.token;
  const mode = req.params.mode;

  const visiterId = headers['x-device-id'];

  const ua = headers['x-user-agent'];
  const uaResult = UAParser(ua);

  if (!name || !phone_number || !email || !token || !ua || !visiterId) {
    return res.status(400).json({
      status: 'failed',
      message: 'invalid credentials',
    });
  }

  const nameRule = /^[a-zA-Z\s]{1,50}$/;
  const phoneRule = /^[2-9]\d{9}$/;
  const emailRule = /^[^.][a-zA-z0-9!#$%&'*+-/=?^_`{|}~.]+@[a-zA-Z0-9.-]+[a-zA-Z]{2,}$/;

  // Data validation

  if (
    !nameRule.test(name.trim()) ||
    !phoneRule.test(phone_number.trim()) ||
    !emailRule.test(email.trim())
  ) {
    return res.status(401).json({
      status: 'failed',
      message: 'Invalid Credentials',
    });
  }

  // Data sanitization

  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanPhone = +phone_number.trim();
  const cleanEmail = email.trim();

  const recaptchaResult = await recaptchaVerification(token);

  if (!recaptchaResult.success) {
    return res.status(401).json({
      status: 'failed',
      data: recaptchaResult['error-code'],
    });
  } else {
    const user = await UserModal.findOne({ email: cleanEmail });
    if (user) {
      return res.status(409).json({
        status: 'failed',
        message: 'Email already exists. Please log in instead.',
      });
    }

    const signUpOTP = crypto.randomInt(100000, 1000000);

    // Delete existing otp(s)

    if (mode === 'phone') {
      await OtpModal.deleteMany({
        $or: [{ visiterId }, { phone: cleanPhone }],
      });

      const text = `Hi ${cleanName.split(' ')[0]}, your OTP is ${signUpOTP} to complete your signup. Do not share this code with anyone. This code is valid for 5 minutes.`;

      sms(cleanPhone, text)
        .then((res) => res.json())
        .then(async (response) => {
          console.log('API response', response);

          // GENERATE OTP DOC
          const hashedOTP = crypto
            .createHash('sha256')
            .update(String(signUpOTP))
            .digest('hex');
          await OtpModal.create({
            visiterId,
            phone: cleanPhone,
            for: 'signup',
            hashedOtp: hashedOTP,
          });

          // Generate Access Doc
          await AccessModal.create({
            sessionId: req.signedCookies.gSid,
            deviceInfo: deviceFingerPrinter(uaResult, req),
            phone: cleanPhone,
          });

          return res.status(200).json({
            status: 'success',
            message: 'OTP send successfully to your number',
          });
        })
        .catch((err) => {
          console.log('Error in sending OTP', err);
          return res.status(500).json({
            status: 'failed',
            message: 'OTP not send',
          });
        });
    } else {
      try {
        await OtpModal.deleteMany({
          $or: [{ visiterId }, { email: cleanEmail }],
        });

        const text = signupEmail(cleanName, signUpOTP, 'signup');
        const resp = await sendMail(cleanEmail, text);
        console.log('API response', resp);

        // Generate OTP Doc
        const hashedOTP = crypto
          .createHash('sha256')
          .update(String(signUpOTP))
          .digest('hex');
        await OtpModal.create({
          visiterId,
          email: cleanEmail,
          for: 'signup',
          hashedOtp: hashedOTP,
        });

        // Generate Access Doc
        await AccessModal.create({
          sessionId: req.signedCookies.gSid,
          deviceInfo: deviceFingerPrinter(uaResult, req),
          email: cleanEmail,
        });

        return res.status(200).json({
          status: 'success',
          message: 'OTP send successfully to your email',
        });
      } catch (err) {
        console.log('Error in sending OTP', err);
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error. Please try after sometime.',
        });
      }
    }
  }
};

export const login = async (req, res, next) => {
  const headers = req.headers;
  const mode = req.params.mode;
  const body = req.body;

  const otpFor = body.otpFor;
  const token = body.token;

  const visiterId = headers['x-device-id'];
  const ua = headers['x-user-agent'];
  const uaResult = UAParser(ua);

  if (!otpFor || !token || !ua || !visiterId) {
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid credentials',
    });
  }

  const phoneRule = /^[2-9]\d{9}$/;
  const emailRule =
    /^[^.][a-zA-z0-9!#$%&'*+-/=?^_`{|}~.]+@[a-zA-Z0-9.-]+[a-zA-Z]{2,}$/;

  // Data validation

  if (mode === 'phone') {
    if (!phoneRule.test(otpFor.trim())) {
      return res.status(401).json({
        status: 'failed',
        message: 'Invalid Credentials',
      });
    }
  } else {
    if (!emailRule.test(otpFor.trim())) {
      return res.status(401).json({
        status: 'failed',
        message: 'Invalid Credentials',
      });
    }
  }

  // Data sanitization
  let cleanEmail = null;
  let cleanPhone = null;

  if (mode === 'phone') cleanPhone = +otpFor.trim();
  else cleanEmail = otpFor.trim();

  const recaptchaResult = await recaptchaVerification(token);

  if (!recaptchaResult.success) {
    return res.status(401).json({
      status: 'failed',
      data: recaptchaResult['error-code'],
    });
  } else {
    let user = null;

    if (mode === 'phone') user = await UserModal.findOne({ phone: cleanPhone });
    else user = await UserModal.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({
        status: 'failed',
        message: "Invalid credential. Please sign up if you're new.",
      });
    }

    const loginOTP = crypto.randomInt(100000, 1000000);

    // Delete existing otp(s)

    if (mode === 'phone') {
      const text = `Hi, your OTP is ${loginOTP} to complete your login. Do not share this code with anyone. This code is valid for 5 minutes.`;

      await OtpModal.deleteMany({
        $or: [{ visiterId }, { phone: cleanPhone }],
      });

      sms(cleanPhone, text)
        .then((res) => res.json())
        .then(async (response) => {
          console.log('API response', response);

          // GENERATE OTP DOC
          const hashedOTP = crypto
            .createHash('sha256')
            .update(String(loginOTP))
            .digest('hex');
          await OtpModal.create({
            visiterId,
            phone: cleanPhone,
            for: 'login',
            hashedOtp: hashedOTP,
          });

          // Generate Access Doc
          await AccessModal.create({
            sessionId: req.signedCookies.gSid,
            deviceInfo: deviceFingerPrinter(uaResult, req),
            phone: cleanPhone,
          });

          return res.status(200).json({
            status: 'success',
            message: 'OTP send successfully to your number',
          });
        })
        .catch((err) => {
          console.log('Error in sending OTP', err);
          return res.status(500).json({
            status: 'failed',
            message: 'OTP not send. Please try again.',
          });
        });
    } else {
      try {
        await OtpModal.deleteMany({
          $or: [{ visiterId }, { email: cleanEmail }],
        });

        const text = signupEmail(null, loginOTP, 'login');
        const resp = await sendMail(cleanEmail, text);
        console.log('API response', resp);

        // Generate OTP Doc
        const hashedOTP = crypto
          .createHash('sha256')
          .update(String(loginOTP))
          .digest('hex');
        await OtpModal.create({
          visiterId,
          email: cleanEmail,
          for: 'login',
          hashedOtp: hashedOTP,
        });

        // Generate Access Doc
        await AccessModal.create({
          sessionId: req.signedCookies.gSid,
          deviceInfo: deviceFingerPrinter(uaResult, req),
          email: cleanEmail,
        });

        return res.status(200).json({
          status: 'success',
          message: 'OTP send successfully to your email',
        });
      } catch (err) {
        console.log('Error in sending OTP', err);
        return res.status(500).json({
          status: 'failed',
          message: 'OTP not send. Please try again.',
        });
      }
    }
  }
};

export const resendOtp = async (req, res, next) => {
  const headers = req.headers;
  const visiterId = headers['x-device-id'];
  const ua = headers['x-user-agent'];
  const mode = req.params.mode;

  const body = req.body;
  const resendOtpTo = body.resendOtpTo;
  const token = body.token;

  if (!token || !resendOtpTo || !visiterId || !ua) {
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid credentials',
    });
  }

  const recaptchaResult = await recaptchaVerification(token);

  if (!recaptchaResult.success) {
    return res.status(401).json({
      status: 'failed',
      data: recaptchaResult['error-code'],
    });
  } else {
    const result = await AccessModal.find({
      'deviceInfo.visitorId': visiterId,
    });

    for (const doc of result) {
      const block = doc.resendBlocked;

      if (block?.value && block.blockedAt) {
        const blockExpiresAt = new Date(
          block.blockedAt.getTime() + 5 * 60 * 1000,
        );

        if (Date.now() < blockExpiresAt.getTime()) {
          return res.status(429).json({
            status: 'failed',
            message: 'Resend limit reached. Try again after some time.',
            block: true,
          });
        } else {
          const findThrough = doc.phone ? 'phone' : 'email';
          const findThroughValue = doc.phone ?? doc.email;

          const update = await AccessModal.findOneAndUpdate(
            { [findThrough]: findThroughValue },
            {
              $set: {
                resendCount: 0,
                'resendBlocked.value': false,
                'resendBlocked.blockedAt': null,
              },
            },
          );

          console.log('Unblocking result', update);
        }
      }
    }

    async function updateResendCount(value, findThrough) {
      const newValue = await AccessModal.findOneAndUpdate(
        { [findThrough]: value },
        { $inc: { resendCount: 1 } },
        { new: true, upsert: true },
      );

      console.log(newValue);

      if (newValue?.resendCount >= 3) {
        const newValue = await AccessModal.updateOne(
          { [findThrough]: value },
          {
            $set: {
              'resendBlocked.value': true,
              'resendBlocked.blockedAt': new Date(),
            },
          },
          { new: true, upsert: true },
        );

        console.log(newValue);
      }

      return newValue?.resendCount;
    }

    const resendOTP = crypto.randomInt(100000, 1000000);

    if (mode === 'phone') {
      await OtpModal.deleteMany({ phone: resendOtpTo });

      text = `Hi, your OTP is ${resendOTP}. Do not share this code with anyone. This code is valid for 5 minutes.`;

      sms(resendOtpTo, text)
        .then((res) => res.json())
        .then(async (response) => {
          console.log('API response', response);

          // GENERATE OTP DOC
          const hashedOTP = crypto
            .createHash('sha256')
            .update(String(resendOTP))
            .digest('hex');
          await OtpModal.create({
            visiterId,
            phone: resendOtpTo,
            for: 'login',
            hashedOtp: hashedOTP,
          });

          // Update in access doc
          const count = await updateResendCount(resendOtpTo, 'phone');

          res.status(200).json({
            status: 'success',
            message: 'OTP send successfully to your number',
            resendCount: count,
          });
        })
        .catch((err) => {
          console.log('Error in sending OTP', err);
          return res.status(500).json({
            status: 'failed',
            message: 'OTP not send. Please try again.',
          });
        });
    } else {
      await OtpModal.deleteMany({ email: resendOtpTo });

      try {
        const text = signupEmail(null, resendOTP, 'Authentication');
        const resp = await sendMail(resendOtpTo, text);
        console.log('API response', resp);

        // Generate OTP Doc
        const hashedOTP = crypto
          .createHash('sha256')
          .update(String(resendOTP))
          .digest('hex');
        await OtpModal.create({
          email: resendOtpTo,
          for: 'login',
          hashedOtp: hashedOTP,
        });

        // Update access doc
        const count = await updateResendCount(resendOtpTo, 'email');

        res.status(200).json({
          status: 'success',
          message: 'OTP send successfully to your email',
          resendCount: count,
        });
      } catch (err) {
        console.log('Error in sending OTP', err);
        return res.status(500).json({
          status: 'failed',
          message: 'OTP not send. Please try again.',
        });
      }
    }
  }
};

export const verifyOTP = async (req, res, next) => {
  const headers = req.headers;
  const mode = req.params.mode;
  const forWhat = req.params.forWhat;
  const gSid = req.signedCookies.gSid;
  const body = req.body;
  const otpFor = body.otpFor;

  console.log(mode, forWhat, body.OTP, body.otpFor);

  const ua = headers['x-user-agent'];
  const uaResult = UAParser(ua);

  const otpRule = /^[0-9]{6}$/;
  const nameRule = /^[a-zA-Z\s]{1,50}$/;
  const phoneRule = /^[0-9]{10}$/;
  const emailRule =
    /^[^.][a-zA-z0-9!#$%&'*+-/=?^_`{|}~.]+@[a-zA-Z0-9.-]+[a-zA-Z]{2,}$/;

  // Data validation

  if (forWhat === 'signup') {
    if (
      !nameRule.test(body.name.trim()) ||
      !phoneRule.test(body.phone.trim()) ||
      !emailRule.test(body.email.trim()) ||
      !otpRule.test(body.OTP)
    ) {
      return res.status(401).json({
        status: 'failed',
        message: 'Invalid Credentials',
      });
    }
  } else {
    if (mode === 'phone') {
      if (!phoneRule.test(otpFor.trim()) || !otpRule.test(body.OTP.trim())) {
        return res.status(401).json({
          status: 'failed',
          message: 'Invalid Credentials',
        });
      }
    } else {
      if (!emailRule.test(otpFor.trim()) || !otpRule.test(body.OTP.trim())) {
        return res.status(401).json({
          status: 'failed',
          message: 'Invalid Credentials',
        });
      }
    }
  }

  // Data sanitization

  let cleanEmail = null;
  let cleanName = null;
  let cleanPhone = null;

  if (forWhat === 'signup') {
    cleanName = body.name.trim().replace(/\s+/g, ' ');
    cleanPhone = +body.phone.trim();
    cleanEmail = body.email.trim();
  }

  let OtpDoc = await OtpModal.findOne({ [mode]: otpFor.trim() });

  if (!OtpDoc)
    return res.status(410).json({ status: 'failed', message: 'OTP expired' });

  const userOTP = crypto
    .createHash('sha256')
    .update(String(body.OTP))
    .digest('hex');

  if (userOTP === OtpDoc.hashedOtp) {
    let User = null;

    if (forWhat === 'signup') {
      User = await UserModal.create({
        name: cleanName,
        phone: cleanPhone,
        isNumberVerified: mode === 'phone',
        email: cleanEmail,
        isEmailVerified: mode === 'email',
      });
    } else {
      if (mode === 'phone') {
        User = await UserModal.findOne({ phone: otpFor });
        if (!User.isNumberVerified) {
          await UserModal.findOneAndUpdate(
            { phone: otpFor },
            { $set: { isNumberVerified: true } },
          );
        }
      } else {
        User = await UserModal.findOne({ email: otpFor });
        if (!User.isEmailVerified) {
          await UserModal.findOneAndUpdate(
            { email: otpFor },
            { $set: { isEmailVerified: true } },
          );
        }
      }
    }

    // Create a registered session

    const session = await SessionModel.create({
      userId: User.id,
      deviceInfo: deviceFingerPrinter(uaResult, req),
      type: 'registered',
    });

    res.cookie('rSid', session.id, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      signed: true,
      secure: true,
      sameSite: 'None',
      path: '/',
    });

    res.status(200).json({
      status: 'success',
      data: {
        userName: User.name,
        userEmail: User.email,
        userPhone: User.phone,
        isEmailVerified: User.isEmailVerified,
        isPhoneVerified: User.isNumberVerified,
      },
    });

    // Generate user activity doc

    const gData = await SessionModel.findById(gSid);

    if (forWhat === 'signup') {
      await UserActivityModal.create({
        userId: User.id,
        cartItems: gData.data.cartItems || {},
        itemsToBeAddedInCart: gData.data.itemsToBeAddedInCart || {},
        wishListedItems: gData.data.wishListedItems || {},
        favRestaurants: gData.data.favRestaurants || [],
        recentLocations: gData.data.recentLocations || [],
      });
    } else {
    }

    await cleanGuestSessionData(gSid);

    await OtpModal.deleteOne({ [mode]: otpFor.trim() });
  } else {
    const updatedAccessDoc = await AccessModal.findOneAndUpdate(
      { [mode]: otpFor },
      { $inc: { attempts: 1 } },
      { new: true, upsert: true },
    );

    return res.status(401).json({
      status: 'failed',
      message: 'Invalid OTP',
    });
  }
};

export const getGuestSessionData = async (req, res, next) => {
  const gSid = req.signedCookies?.gSid;
  const rSid = req.signedCookies?.rSid;

  if (rSid) {
    try {
      const session = await SessionModel.findById(rSid);
      if (session) {
        const User = await UserModal.findById(session.userId);

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
      }
      // else {
      //     res.clearCookie("rSid", {
      //             httpOnly: true,
      //             signed: true,
      //             secure: true,
      //             sameSite: "None",
      //             path: "/"
      //         }
      //     )

      //     console.log("Called");
      //     rSid = null;
      // }
    } catch (err) {
      console.error('Error in getting session data', err);

      return res.status(500).json({
        status: 'failed',
        message: err.message,
      });
    }
  }

  if (gSid) {
    try {
      const sessionData = await SessionModel.findById(gSid);
      await SessionModel.findByIdAndUpdate(gSid, {
        $set: { createdAt: new Date() },
      });

      return res.status(200).json({
        status: 'success',
        data: sessionData,
        auth: false,
      });
    } catch (err) {
      console.error('Error in getting session Data', err);

      return res.status(500).json({
        status: 'failed',
        message: err.message,
      });
    }
  } else {
    const headers = req.headers;
    const ua = headers['x-user-agent'];
    const uaResult = UAParser(ua);

    try {
      const session = await SessionModel.create({
        deviceInfo: deviceFingerPrinter(uaResult, req),
        type: 'guest',
      });

      res.cookie('gSid', session.id, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        signed: true,
        secure: true,
        sameSite: 'None',
        path: '/',
      });

      return res.status(200).json({
        status: 'success',
        data: {
          message: 'Session created',
          sessionId: session.id,
          data: session,
          auth: false,
        },
      });
    } catch (err) {
      console.error('Error in session creation', err);

      res.status(500).json({
        status: 'failed',
        message: err.message,
      });
    }
  }
};

export const addGuestSessionRecentLocation = async (req, res, next) => {
  const gSid = req.signedCookies?.gSid;

  try {
    const recentLocations = await SessionModel.findByIdAndUpdate(
      gSid,
      { $set: { 'data.recentLocations': req.body.recentLocations } },
      { new: true },
    );
    res.status(200).json({
      status: 'success',
      data: recentLocations,
    });
  } catch (err) {
    console.error('Error in location addition', err);

    res.status(500).json({
      status: 'failed',
      message: err.message,
    });
  }
};

export const addGuestSessionFavRestaurants = async (req, res, next) => {
  const gSid = req.signedCookies?.gSid;

  try {
    const favRestaurants = await SessionModel.findByIdAndUpdate(
      gSid,
      { $set: { 'data.favRestaurants': req.body.favRestaurants } },
      { new: true },
    );
    res.status(200).json({
      status: 'success',
      data: favRestaurants,
    });
  } catch (err) {
    console.error('Error in favorite restaurant addition', err);

    res.status(500).json({
      status: 'failed',
      message: err.message,
    });
  }
};

export const addGuestSessionWishListedItems = async (req, res, next) => {
  const gSid = req.signedCookies?.gSid;

  try {
    const wishListedItems = await SessionModel.findByIdAndUpdate(
      gSid,
      { $set: { 'data.wishListedItems': req.body.wishListedItems } },
      { new: true, upsert: true },
    );
    res.status(200).json({
      status: 'success',
      data: wishListedItems,
    });
  } catch (err) {
    console.error('Error in adding items to wishlist', err);

    res.status(500).json({
      status: 'failed',
      message: err.message,
    });
  }
};

export const addGuestSessionItemsToBeAddedInCart = async (req, res, next) => {
  const gSid = req.signedCookies?.gSid;

  try {
    const itemsToBeAddedInCart = await SessionModel.findByIdAndUpdate(
      gSid,
      { $set: { 'data.itemsToBeAddedInCart': req.body.itemsToBeAddedInCart } },
      { new: true, upsert: true },
    );
    res.status(200).json({
      status: 'success',
      data: itemsToBeAddedInCart,
    });
  } catch (err) {
    console.error('Error in adding items to wishlist', err);

    res.status(500).json({
      status: 'failed',
      message: err.message,
    });
  }
};

export const addGuestSessionCartItems = async (req, res, next) => {
  const gSid = req.signedCookies?.gSid;

  try {
    const cartItems = await SessionModel.findByIdAndUpdate(
      gSid,
      { $set: { 'data.cartItems': req.body.cartItems } },
      { new: true, upsert: true },
    );
    res.status(200).json({
      status: 'success',
      data: cartItems,
    });
  } catch (err) {
    console.error('Error in adding items to wishlist', err);

    res.status(500).json({
      status: 'failed',
      message: err.message,
    });
  }
};

export const oAuthAuthorization = async (req, res, next) => {
  const userId = req.UserId;

  try {
  } catch (err) {}
};
