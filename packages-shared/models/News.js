import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  newsId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  businessId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: false // Используем свои поля createdAt и updatedAt
});

// Индекс для быстрого поиска новостей бизнеса
newsSchema.index({ businessId: 1, createdAt: -1 });

export default newsSchema;
