const User = require('../models/User');
const addAddress = async (req, res) => { try { const user = await User.findById(req.user._id); user.addresses.push(req.body); await user.save(); res.json(user.addresses); } catch (err) { res.status(500).json({ message: err.message }); } };
const deleteAddress = async (req, res) => { try { const user = await User.findById(req.user._id); user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.addressId); await user.save(); res.json(user.addresses); } catch (err) { res.status(500).json({ message: err.message }); } };
module.exports = { addAddress, deleteAddress };
