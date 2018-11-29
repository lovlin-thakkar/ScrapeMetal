var express = require('express');
var router = express.Router();
var User = require('../lib/User');
var Guest = require('../lib/Guest');
var Scrape = require('../scraper');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var JSAlert = require("js-alert");
var dialog = require('dialog');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var SALT_WORK_FACTOR = 10;
var session = require('express-session');
var url = require('url');

mongoose.connect('mongodb://localhost/test', function(err){
	if(err){
		return console.log(err);
	}
	return console.log('Successfully connected to MongoDB!');
});

router.post('/scrape', function(req, res){
  var newGuest = new Guest();
  newGuest.email = req.body.email;
  newGuest.url = req.body.url;
	res.redirect('/homepage');
  newGuest.save(function(err, savedGuest){
		if(err){
			console.log(err);
			return res.status(500).send();
		}
		//sendMail(savedGuest.email, 'Email Verification', "Please verify your account to start tracking on ScrapeMetal, click on the following link:\nhttp://localhost:3000/auth?q="+savedUser.randomString);
		else {
			Scrape.data.scrape(req.body.url, req.body.email);
			return res.status(200).send();
		}
	});
});

router.post('/scrapeuser', function(req, res){
				var users = req.session.user;
				if (req.session.valid) {
					User.findOne({_id: users._id}, function(err, user){
						if(err){
							console.log(err);
							return res.status(500).send();
						}

						else if(!user){
							return res.status(404).send();
						}

						else {
							if(user.url.length >= 5){
								return res.status(500).send("<h3>Limit!!!!! Time for money money money :*</h3>");
							}
							else {
								user.url.push(req.body.url);
								user.save(function(err, savedUser){
									if(err){
										console.log(err);
										return res.status(500).send("<h3>Some error occured. Try again</h3>");
									}
									else {
										return res.status(200).send();
									}
								});
								Scrape.data.scrape(req.body.url, user.email);
								res.redirect('/dashboard');
							}
						}
					});

				}
				else {
					return res.status(401).send("<h3>Session timed out!</h3>");
					res.redirect('/loginpage');
				}
});

router.post('/login', function(req, res){
	var username = req.body.username;
	var password = req.body.password;
	User.findOne({username: username}, function(err, user){
		if(err){
			console.log(err);
			return res.status(500).send();
		}

		if(!user){
			return res.status(404).send();
		}

		user.comparePassword(password, function(err, isMatch){
			if(isMatch && isMatch == true){
				req.session.user = user;
				req.session.valid = true;
				res.redirect('/dashboard');
				return res.status(200).send();
			}
			else{
				//alert('Incorrect Password');
				res.redirect('/loginpage');
				return res.status(401).send();
			}
		});
		//return res.status(200).send();
	});
});

router.post('/register', function(req, res){
	console.log(req.body);
	var passconf = req.body.passconf;
	var newUser = new User();
	newUser.email = req.body.email;
	newUser.username = req.body.username;
	newUser.password = req.body.password;
	newUser.randomString = new Date(Date.now()) + req.body.username;
	newUser.verf = false;
	newUser.save(function(err, savedUser){
		if(err){
			console.log(err);
			return res.status(500).send();
		}
		sendMail(savedUser.email, 'Email Verification', "Please verify your account to start tracking on ScrapeMetal, click on the following link:\nhttp://localhost:3000/auth?q="+savedUser.randomString);
		//window.alert("You have registered successfully!");
		res.redirect('/loginpage');
		return res.status(200).send();
	});
});

router.post('/forgotpass', function(req, res){
	var email = req.body.email;
	User.findOne({email: email}, function(err, user){
		if(err){
			console.log(err);
			return res.status(500).send("<h3>Error!</h3>");
		}
		if(!user){
			return res.status(404).send("<h3>User not found!</h3>");
		}
		user.verf = true;
		user.save(function(err, savedUser){
			if(err){
				console.log(err);
				return res.status(500).send();
			}
			sendMail(email, 'Reset Password', "Reset your password using this link: http://localhost:3000/forgotpassword?q="+user.randomString);
			return res.status(200).send("<h3>Email Sent!</h3>");
		});
	});
});

//GET requestts for jade pages
router.get('/logout', function(req, res){
	req.session.destroy();
	res.redirect('/homepage');
	return res.status(200).send();
});

router.get('/homepage', function(req, res){
	res.render('home.jade');
	return res.status(200);
});

router.get('/loginpage', function(req, res){
	res.render('login.jade');
	return res.status(200);
});

router.get('/registerpage', function(req, res){
	res.render('register.jade');
	return res.status(200);
});

router.get('/forgot', function(req, res){
	res.render('forgot.jade');
	return res.status(200);
});

router.get('/about', function(req, res){
	res.render('about.jade');
	return res.status(200);
});

router.get('/auth', function(req, res){
	var randomString = url.parse(req.url, true).query.q;
	User.findOne({randomString: randomString}, function(err, user){
		if(err){
			console.log(err);
			return res.status(500).send();
		}
		if(!user){
			return res.status(404).send('<h3>Some error occurred :(<br>Send confirmation link again</h3>');
		}
		user.verf = true;
		//user.randomString = user.email + new Date(Date.now());
		user.save(function(err) {
            if(err) {
                return res.status(500).send({error:err});
            }
            else{
           		return res.status(200).send('<h3>Authenication Successful!</h3>'+ user.verf);
            }
        });
	});
	return res.status(200);
});

router.get('/forgotpassword', function(req, res){
	var randomString = url.parse(req.url, true).query.q;
	User.findOne({randomString: randomString}, function(err, user){
		if(err){
			console.log(err);
			return res.status(500).send('<h3>Some error occurred :(<br>try resetting again...</h3>');
		}
		if(!user){
			return res.status(404).send("<h3>The link maybe expired.<br>try resetting again...</h3>");
		}
		res.render("changepassword.jade");
		return res.status(200);
	});
});

router.post('/change', function(req, res){
	var email = req.body.email;
	var newpass = req.body.newpass;
	User.findOne({email: email}, function(err, user){
		if(err){
			console.log(err);
			return res.status(500).send("<h3>Some error occured :(<br>retry later...</h3>");
		}
		if(!user){
			return res.status(404).send("<h3>Re-enter Email Address and try again</h3>");
		}
		user.password = newpass;
		user.randomString = email + new Date(Date.now());
		user.save(function(err, savedUser){
			if(err){
				console.log(err);
				return res.status(500).send("<h3>Some error occured. Try again</h3>");
			}
			//req.session.user = user;
			//show alert that password changed
			//send mail to user that password has been changed
			res.redirect('/loginpage');
			return res.status(200).send();
		});
	});
});

router.get('/dashboard', function(req, res){
	if(!req.session.user){
		//alert('You are logged out!');
		res.redirect('/homepage');
		return res.status(401);
	}
	res.render('dashboard.jade');
	return res.status(200);
});

function sendMail(rec, sub, msg){
	var transporter = nodemailer.createTransport(smtpTransport({
    	service: 'Gmail',
    	auth: {
      		user: '15bit062@nirmauni.ac.in',
      		pass: "don'tstop&paltY29"
    	}
  	}));

	var mailOptions = {
	    from: '15bit062@nirmauni.ac.in',
	    to: rec,
	    subject: sub,
	    text: msg
	};

	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	    	console.log(error);
	    }
	    else{
	    	console.log('Email sent: ' + info.response);
	    }
	});
}

module.exports = router;
