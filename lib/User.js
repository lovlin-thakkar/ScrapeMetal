var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var userSchema = new mongoose.Schema({
	randomString: {type: String, unique: true, required: true},
	username: {type: String, unique: true, trim: true, required: true},
	password: {type: String, required: true},
	email: {type: String, required: true, trim: true, unique: true},
	verf: {type: Boolean, required: true},
	url: [{type: String, trim: true}]
});
userSchema.pre('save', function(next){
	var user = this;
	if(!user.isModified('password')) return next();
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
		if(err) return next(err);
		bcrypt.hash(user.password, salt, function(err, hash){
			if(err) return next(err);
			user.password = hash;
			next();
		});
	});
});
userSchema.pre('save', function(next){
	var user = this;
	if(!user.isModified('randomString')) return next();
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
		if(err) return next(err);
		bcrypt.hash(user.randomString, salt, function(err, hash){
			if(err) return next(err);
			user.randomString = hash;
			next();
		});
	});
});
userSchema.methods.comparePassword = function(candidatePassword, callback){
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
		if(err) return callback(err);
		callback(undefined, isMatch);
	});
};
var User = mongoose.model('myuser', userSchema);
module.exports = User;
