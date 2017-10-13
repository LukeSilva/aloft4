'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

const userSchema = mongoose.Schema({
	local: {
		username: {
			type: String,
			lowercase: true
		},
		password: String,
		email: {
			type: String,
			unique: true,
			lowercase: true,
			match: [/.+\@.+\..+/, 'Please enter a valid email']
		},
		firstname: String,
		lastname: String,
		prefs: {},
		role: {
			type: String,
			enum: ['admin', 'trial', 'member', 'consumer'],
			default: 'member'
		},
		locale: {
			type: String,
			default: 'EN'
		},
		activated: {
			type: Boolean,
			default: true
		},
		isNew: {
			type: Boolean,
			default: true
		}
	},
	avatar: String,
	conference: {},
	timeFormat: String,
	marker: String,
	resetPasswordToken: String,
	resetPasswordExpiration: Date,
	dateCreated: {
		type: Date,
		default: Date.now,
	},
	inviteToken: String,
	trialPeriod: String
});

userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);