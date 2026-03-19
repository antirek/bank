import mongoose from 'mongoose';

const smsCodeSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  usedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
smsCodeSchema.index({ phone: 1 });
smsCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SmsCode = mongoose.model('SmsCode', smsCodeSchema);

export default SmsCode;
