import OrdersModel from '../models/ordersModel.js';
import instance from '../razorpay.js';
import crypto from 'crypto';

export const createOnlineOrder = async (req, res, next) => {
  try {
    const amountToPay = +req.body.amount;

    if (!amountToPay || amountToPay <= 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'Please provide the valid amount.',
      });
    }

    const options = {
      amount: amountToPay * 100,
      currency: 'INR',
      receipt: `order_rcpt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    return res.status(200).json({
      status: 'success',
      order,
    });
  } catch (err) {
    console.log('Error in creating razorpay order', err);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. Try after some time.',
    });
  }
};

export const getRazorpayAPIKey = (req, res, next) => {
  res.status(200).json({
    status: 'success',
    key: process.env.RAZORPAY_TEST_API_KEY,
  });
};

export const verifyPayment = async (req, res, next) => {
  const { order_id, payment_id, signature } = req.body.data;
  const signatureString = order_id + '|' + payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_TEST_API_SECRET)
    .update(String(signatureString))
    .digest('hex');

  if (expectedSignature === signature) {
    return res.status(200).json({
      status: 'success',
      message: 'payment verified',
    });
  } else {
    res.status(401).json({
      status: 'failed',
      message: 'payment verification failed',
    });
  }

  // razorpay_order_id: "order_R7fHiwRavqlTM7"
  // razorpay_payment_id: "pay_R7fI9DRE8iayZI"
  // razorpay_signature: "65e08d3472d36f36f3326d50c03a24d4223899d7725ec82ed0b67141917c00dd"
};

export const placeOrder = async (req, res, next) => {
  const userId = req.UserID;
  const body = req.body;

  const items = body.items;
  const address = body.address;
  const distance = body.distance;
  const billing = body.billing;
  const payment = body.payment;
  const orderStatus = body.orderStatus;

  console.log(items, address, billing, payment, orderStatus);

  if (!items || !address || !billing || !payment || !orderStatus) {
    return res.status(400).json({
      status: 'failed',
      message: 'Please provide valid data',
    });
  }

  try {
    const order = await OrdersModel.create({
      userId,
      items,
      deliveryAddress: {
        distance,
        address,
      },
      billing,
      payment,
      orderStatus,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Order placed',
      data: order._id,
    });
  } catch (err) {
    console.log('Error in placing order', err);

    res.status(500).json({
      status: 'error',
      message: 'Internal server error.',
    });
  }
};
