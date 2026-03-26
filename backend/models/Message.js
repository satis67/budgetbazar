const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({ sender: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, receiver: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, content: { type: String, required: true, trim: true }, seen: { type: Boolean, default: false }, delivered: { type: Boolean, default: false } }, { timestamps: true });
module.exports = mongoose.model('Message', messageSchema);
