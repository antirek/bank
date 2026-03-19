import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  mms3UserId: {
    type: String,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export default User;
