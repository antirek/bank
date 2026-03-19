import mongoose from 'mongoose';

const businessSubscriptionSchema = new mongoose.Schema({
  businessId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Уникальный индекс для пары businessId + userId
businessSubscriptionSchema.index({ businessId: 1, userId: 1 }, { unique: true });

// Индексы
businessSubscriptionSchema.index({ userId: 1 });
businessSubscriptionSchema.index({ businessId: 1 });

const BusinessSubscription = mongoose.model('BusinessSubscription', businessSubscriptionSchema);

export default BusinessSubscription;
