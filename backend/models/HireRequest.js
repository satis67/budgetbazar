const mongoose = require('mongoose');
const hireRequestSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, coder: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Coder' }, workDetails: { type: String, required: true }, budget: { type: Number, required: true }, status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Completed'], default: 'Pending' } }, { timestamps: true });
module.exports = mongoose.model('HireRequest', hireRequestSchema);
