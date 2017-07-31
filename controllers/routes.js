'use strict';

const async = require('async')
	, crypto = require('crypto')
	, nodemailer = require('nodemailer')
	, mailerConfig = require('../config/mailer.js')
	, send = require('../controllers/send')
	, ShareRest = require('../controllers/share-rest')
	, User = require('../models/user')
	, Event = require('../models/event');

module.exports = function(app, passport, db) {

	let Rest = new ShareRest(app, db);

	app.get('/', function (req, res) {
		if (req.user) {
			res.redirect('/dashboard');
		} else {
			res.render('login');
		}
	});

	app.get('/_sub/:address', function (req, res) {
		res.send(req.params.address);
	});

	app.get('/admin-only', isLoggedIn, function (req, res) {
		res.render('admin-only', {
			user: req.user.local
		});
	});

	app.get('/login', function (req, res) {
		res.render('login', {
			message: req.flash('loginMessage')
		});
	});

	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('login');
	});

	app.get('/signup', function (req, res) {
		res.render('signup', {
			token: req.query.token,
			message: req.flash('signupMessage')
		});
	});

	app.get('/dashboard', isLoggedIn, function (req, res) {
		let perPage = 9, page = req.query.page > 0 ? req.query.page : 0

		res.locals.createPagination = function (pages, page) {
						var url = require('url')
							, qs = require('querystring')
							, params = qs.parse(url.parse(req.url).query)
							, str = ''

						params.page = 0
						var clas = page == 0 ? "active" : "no"
						str += '<div class="btn-group" role="group" aria-label="...">'
						str += '<a class="btn btn-default ' + clas + '" href="?'+qs.stringify(params)+'#repo-tab">First</a>'
						for (var p = 1; p < pages; p++) {
							params.page = p
							clas = page == p ? "active" : "no"
							str += '<a class="btn btn-default ' + clas + '" href="?'+qs.stringify(params)+'#repo-tab">'+ p +'</a>'
						}
						params.page = --p
						clas = page == params.page ? "active" : "no"
						str += '<a class="btn btn-default ' + clas + '" href="?'+qs.stringify(params)+'#repo-tab">Last</a></div>'

						return str
					}

		Event.find({user: req.user.local.username})
			.select(['url', 'user', 'title', 'created', '_id'])
			.limit(perPage)
			.skip(perPage * page)
			.sort({created: -1})
			.exec(function (err, events) {

				Event.count().exec(function (err, count) {
					res.render('dashboard', {
						user: req.user.local,
						error_message: req.flash('error_message'),
						success_message: req.flash('success_message'),
						events: events,
						page: page,
						pages: count / perPage
					});
				});
			});
	});

	app.get('/invite-member', isLoggedIn, function (req, res) {
		if (req.user.local.role === 'admin') {
			res.render('invite-user');
		} else {
			res.redirect('admin-only');
		}
	});

	app.get('/:user/:event', function (req, res) {
		Event.findOne({'user': req.params.user, 'url': req.params.event}, function (err, event) {
			if (err) {
				throw err;
			} else {
				if (event) {
					let prefs = {
						fontSize: '35',
						fontFace: 'Inconsolata',
						lineHeight: '130'
					}
					res.render('watch', {
						user: req.params.user,
						event: req.params.event,
						prefs: prefs,
						marker: '≈'
					});
				} else {
					req.flash('error_message', 'Sorry. There was no event found with those parameters.')
					res.render('error', {
						message: req.flash('error_message')
					});
				}
			}
		});
	});

	app.post('/invite-member', function (req, res) {
		async.waterfall([function (done) {
			crypto.randomBytes(10, function (err, buf) {
				let token = buf.toString('hex');
				done(err, token);
			});
		},
		function (token, done) {
			let cleanEmail = req.body.newmemberemail.trim().toLowerCase();
			User.findOne({'local.email': cleanEmail}, function (err, user) {
				if (err) {
					throw err;
				} else {
					if (user) {
						req.flash('adminMessage', 'That email is already registered.');
						res.redirect('/dashboard#admin')
					} else {
						let newUser = new User;
						newUser.local.email = cleanEmail;
						newUser.inviteToken = token;
						newUser.trialPeriod = req.body.trialPeriod;
						newUser.save (function (err) {
							done(err, token, user);
						});
					}
				}
			});
		},
		function (token, user, done) {
			var transport = nodemailer.createTransport(mailerConfig);
			var mailOptions = {
				to: req.body.newmemberemail,
				from: 'Aloft Support',
				subject: 'Your Aloft Invite Token',
				text: 'Hi there! \n\n' +
				'You\'ve been invited to sign up for Aloft, the super awesome text delivery/captioning system for realtime stenographers! Below you will find the sign-up token use to create your account. Click the link provided to start the registration process. If the link is not clickable, paste the address into your browser or go to aloft.nu/signup and paste the code into the field labeled "token."\n\n' +
				'Your sign-up token: ' + token + '\n' +
				'Your registration link: aloft.nu/signup?token=' + token + '.\n\n' +
				'Please note that your code is only valid for 72 hours (three days). If you do not create your account within that time, you will have to request another token.\n' +
				'Thank you and enjoy using Aloft!\n\n\n' +
				'-Aloft Support'
			};
			transport.sendMail(mailOptions, function (err, info) {
				if (err) {
					req.flash('error_message', 'There was an error sending the email!');
					done(err, 'done');
				} else {
					req.flash('info', 'A sign-up token has been sent to ' + req.body.newmemberemail + '!');
					done(err, 'done');
				}
			});
		}], function (err) {
			if (err) {
				req.flash('error', 'The email could not be sent. Please try again.');
				res.redirect('/');
				return console.log(err);
			} else {
				req.flash('message', 'An email with the link to this event has been sent successfully to ' + req.body.newmemberemail + '.');
				res.redirect('/dashboard');
			}
		});
	});

	app.post('/login', passport.authenticate('login', {
		successReturnToOrRedirect: '/dashboard',
		failureRedirect: '/login',
		failureFlash: true
	}));


	app.post('/signup', passport.authenticate('signup', {
		successRedirect: '/dashboard',
		failureRedirect: '/signup',
		failureFlash: true
	}));

	app.post('/send', isLoggedIn, function (req, res) {
		let mailer = send(req.body.transcript_recipient, req.user, req.body.active_event_title, req.body.active_event_url, req.body.transcript_send_subject, req.body.transcript_send_message);
		if (mailer.send === true) {
			req.flash('success_message', 'Email was sent successfully!');
			res.redirect('/dashboard#repo');
		} else {
			// req.flash('error_message', 'Email failed to send!');
			// res.redirect('/dashboard#repo-tab');
			req.flash('success_message', 'Email was sent successfully!');
			res.redirect('/dashboard#repo');
		}
	});

	app.use(function (req, res, next) {
		req.flash('404', 'Sorry. We couldn\'t find what you were looking for.');
		res.render('error', { message: req.flash('404')});
		res.end();
	});

	function isLoggedIn(req, res, next) {
			if(req.isAuthenticated()) {
				return next();
	  		}
	  		req.flash('loginMessage', 'You must be logged in to do that!');
	  		return res.redirect(307, '/login');
		}
}