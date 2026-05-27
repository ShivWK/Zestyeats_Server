import mongoose from 'mongoose';

const blockedSchema = new mongoose.Schema(
  {
    value: Boolean,
    blockedAt: Date,
  },
  { _id: false },
);

const deviceInfoSchema = new mongoose.Schema(
  {
    visitorId: String,
    deviceIp: String,
    deviceModal: String,
    deviceVender: String,
    oSName: String,
    oSVersion: String,
    browserName: String,
    browserVersion: String,
    uA: String,
  },
  { _id: false },
);

const accessSchema = new mongoose.Schema({
  sessionId: mongoose.Schema.Types.ObjectId,

  email: String,

  phone: Number,

  deviceInfo: deviceInfoSchema,

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60,
  },

  attempts: {
    type: Number,
    max: 5,
    default: 0,
  },

  resendCount: {
    type: Number,
    max: 3,
    default: 0,
  },

  blocked: blockedSchema,
  resendBlocked: blockedSchema,
});

const AccessModal = mongoose.model('Access', accessSchema);
export default AccessModal;
