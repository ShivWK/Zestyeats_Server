import express from 'express';
import { checkSessionId, protectionCheck } from '../controllers/userActivityControllers.js';
import {
  createOnlineOrder,
  getRazorpayAPIKey,
  verifyPayment,
  placeOrder,
} from '../controllers/paymentsController.js';

const paymentRouter = express.Router();

paymentRouter.use(checkSessionId);
paymentRouter.use(protectionCheck);

paymentRouter.route('/onlineOrder').post(createOnlineOrder);
paymentRouter.route('/order').post(placeOrder);
paymentRouter.route('/key').get(getRazorpayAPIKey);
paymentRouter.route('/paymentVerification').post(verifyPayment);

export default paymentRouter;
