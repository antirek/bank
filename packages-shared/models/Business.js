import mongoose from 'mongoose';

const dayHoursSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  from: { type: String, default: '' },
  to: { type: String, default: '' }
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  order: { type: Number, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const businessSchema = new mongoose.Schema({
  businessId: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    required: true
  },
  categoryIds: [{
    type: String
  }],
  contacts: {
    phones: [{ type: String }],
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    messengers: {
      telegram: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      vk: { type: String, default: '' },
      max: { type: String, default: '' }
    }
  },
  workingHours: {
    mon: { type: dayHoursSchema, default: () => ({ enabled: false, from: '', to: '' }) },
    tue: { type: dayHoursSchema, default: () => ({ enabled: false, from: '', to: '' }) },
    wed: { type: dayHoursSchema, default: () => ({ enabled: false, from: '', to: '' }) },
    thu: { type: dayHoursSchema, default: () => ({ enabled: false, from: '', to: '' }) },
    fri: { type: dayHoursSchema, default: () => ({ enabled: false, from: '', to: '' }) },
    sat: { type: dayHoursSchema, default: () => ({ enabled: false, from: '', to: '' }) },
    sun: { type: dayHoursSchema, default: () => ({ enabled: false, from: '', to: '' }) }
  },
  gallery: [{
    type: String
  }],
  card: {
    sections: { type: [sectionSchema], default: [] },
    version: { type: Number, default: 1 }
  },
  location: {
    address: {
      type: String,
      default: ''
    },
    coordinates: {
      lat: {
        type: Number,
        default: null
      },
      lng: {
        type: Number,
        default: null
      }
    }
  },
  qrCode: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  mms3BotId: {
    type: String,
    default: null
  },
  mms3ChannelDialogId: {
    type: String,
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
businessSchema.index({ businessId: 1 }, { unique: true });
businessSchema.index({ slug: 1 }, { unique: true });
businessSchema.index({ ownerId: 1 });
businessSchema.index({ categoryIds: 1 });
businessSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lng': 1 });

export default businessSchema;
