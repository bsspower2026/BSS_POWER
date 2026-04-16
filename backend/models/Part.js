import mongoose from 'mongoose';

const partSchema = new mongoose.Schema({
  // Basic Information
  partName: {
    type: String,
    trim: true
  },
  partCode: {
    type: String,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Inventory Management
  quantityInStock: {
    type: Number,
    default: 0,
    min: 0
  },
  unitOfMeasurement: {
    type: String,
    trim: true
  },
  minimumStockLevel: {
    type: Number,
    default: 0
  },
  reorderLevel: {
    type: Number,
    default: 0
  },
  
  // Pricing & Supplier
  costPrice: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  supplierPartNumber: {
    type: String,
    trim: true
  },
  supplierPhone: {
    type: String,
    trim: true
  },
  
  // Additional
  location: {
    type: String,
    trim: true
  },
  warrantyMonths: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  
  // New Field - Photos (multiple images)
  photos: [{
    url: String,
    publicId: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['Available', 'Out of Stock', 'Discontinued'],
    default: 'Available'
  },
  
  // Tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Part', partSchema);