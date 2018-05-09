const config = require('../config/mailer.js');

if (config.host === 'smtp.ethereal.email') {
  console.log("Using ethereal as a development email server");
  console.log("Username: " + config.auth.user);
  console.log("Password: " + config.auth.pass);
  console.log("")
}
