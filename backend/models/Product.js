const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  category: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  images: [{ type: String }],
  description: { type: String, required: true },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  variants: [{
    size: { type: String },
    color: { type: String },
    stock: { type: Number, default: 0 }
  }],
  isDeleted: { type: Boolean, default: false } // Soft delete flag
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
