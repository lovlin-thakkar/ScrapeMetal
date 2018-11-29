var mongoose = require('mongoose');
var guestSchema = new mongoose.Schema({
	url: {type: String, unique: false, trim: true, required: true},
	email: {type: String, required: true, trim: true, unique: true},
});
var Guest = mongoose.model('myguest', guestSchema);
module.exports = Guest;