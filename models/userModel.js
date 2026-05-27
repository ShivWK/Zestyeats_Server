import mongoose from 'mongoose';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name.'],
    trim: true,
  },
  phone: {
    type: Number,
  },
  isNumberVerified: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    require: [true, 'Please enter an email.'],
    unique: true,
    trim: true,
    lowercase: true, // this make the value into lowercase before saving it into the db
    validate: [validator.isEmail, 'Please enter a valid email.'],
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  address: [mongoose.Schema.Types.Mixed],
  payments: {
    type: [
      {
        cardType: {
          type: String,
          enum: ['Visa', 'MasterCard', 'Rupay'],
          required: [true, 'Please provide a valid card number.'],
        },
        last4: {
          type: String,
          required: [true, 'Please provide valid card number.'],
          validate: {
            validator: (v) => /^\d{4}$/.test(v),
            message: 'Card number must be last 4 digits only.',
          },
        },
        expiryYear: {
          type: Number,
          required: [true, 'Please provide expiry year.'],
        },
        expiryMonth: {
          type: Number,
          min: 1,
          max: 12,
          required: [true, 'Please provide expiry month.'],
        },
        cardHolderName: {
          type: String,
          required: [true, 'Please provide the card holder name.'],
        },
        token: {
          type: String,
        },
      },
    ],
    unique: true,
  },
});

const UserModal = mongoose.model('User', userSchema);
export default UserModal;
