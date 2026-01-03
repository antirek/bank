import mongoose from 'mongoose';

const dialogSchema = new mongoose.Schema({
  dialogId: {
    type: String,
    required: true,
    unique: true
  },
  businessId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  mms3DialogId: {
    type: String,
    required: true,
    unique: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  unreadCountUser: {
    type: Number,
    default: 0
  },
  unreadCountOwner: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Составной уникальный индекс: один активный диалог на пару бизнес-пользователь
dialogSchema.index({ businessId: 1, userId: 1, isActive: 1 }, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

// Индекс для списка диалогов пользователя
dialogSchema.index({ userId: 1, lastMessageAt: -1 });

// Индекс для списка диалогов бизнеса
dialogSchema.index({ businessId: 1, lastMessageAt: -1 });

// Индекс для поиска по mms3DialogId
dialogSchema.index({ mms3DialogId: 1 });

const Dialog = mongoose.model('Dialog', dialogSchema);

export default Dialog;
