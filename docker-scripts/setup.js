'use strict';

const nodemailer = require('nodemailer');
const fs = require('fs');

// Generate test SMTP service account from ethereal.email
// Only needed if you don't have a real mail account for testing
nodemailer.createTestAccount((err, account) => {

    fs.writeFileSync("config/mailer.js", "module.exports = " + JSON.stringify({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: account.user, // generated ethereal user
            pass: account.pass // generated ethereal password
        }
    }) + ";");

    fs.writeFileSync("config/aloft-config.js", "module.exports = " + JSON.stringify({
	    // Enter a random string here to create a session key.
	    'session': account.pass,

	    // Leave this other stuff alone below.
	    'mongo': 'mongodb://mongodb:27017/aloft',
	    'users': 'mongodb://mongodb:27017/users',
	    'port': process.env.PORT || 4000
    }) + ";")
    
});
