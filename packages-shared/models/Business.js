import mongoose from 'mongoose';

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

const Business = mongoose.model('Business', businessSchema);

export default Business;
