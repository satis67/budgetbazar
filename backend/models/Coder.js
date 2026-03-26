const mongoose = require('mongoose');
const coderSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, name: { type: String, required: true }, skills: [{ type: String, required: true }], price: { type: Number, required: true }, rating: { type: Number, default: 0 }, numReviews: { type: Number, default: 0 }, description: { type: String, required: true } }, { timestamps: true });
module.exports = mongoose.model('Coder', coderSchema);
