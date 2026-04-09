import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    client: { type: String, required: true, default: 'owner-pwa', index: true },
    endpoint: { type: String, required: true, unique: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
    userAgent: { type: String, default: '' }
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ userId: 1, client: 1 });

export default pushSubscriptionSchema;
