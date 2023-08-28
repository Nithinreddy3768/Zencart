var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcrypt');
var User = require('../models/user');

router.get('/register', function (req, res) {
  res.render('register', {
    title: 'Register',User:User
  });
});

router.post('/register', function (req, res) {
  var name = req.body.name;
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var password2=req.body.password2;
  req.checkBody('name', 'Name is required!').notEmpty();
  req.checkBody('email', 'Email is required!').isEmail();
  req.checkBody('username', 'Username is required!').notEmpty();
  req.checkBody('password', 'Password is required!').notEmpty();
  req.checkBody('password2', 'Passwords do not match!').equals(password);
  var errors = req.validationErrors();
 console.log(errors);
    if (errors) {
        res.render('register', {
            errors: errors,
            user: null,
            title: 'Register'
        });
    }
    else{
  User.findOne({ username: username }).then(function (existingUser) {
    if (existingUser) {
      req.flash('danger', 'Username exists, choose another!');
      res.redirect('/users/register');
      // req.flash('danger', 'Username exists, choose another!');
      console.log(existingUser);
    //   res.send("username already exists");
    } else {
      console.log(existingUser);
      var user = new User({
        username: username,
        name: name,
        email: email,
        password: password,
        admin:0
      });

      bcrypt.genSalt(10)
        .then(function (salt) {
          return bcrypt.hash(user.password, salt);
        })
        .then(function (hash) {
          user.password = hash;
          return user.save();
        })
        .then(function () {
          req.flash('success', 'You are now registered!');
          res.redirect('/users/login');
        })
        .catch(function (err) {
          console.error('Error during registration:', err);
          // res.send('An error occurred during registration');
        });
    }
  });
}
});
/*
 * GET login
 */
router.get('/login', function (req, res) {
       console.log(res.locals.user);
    if (res.locals.user) res.redirect('/');
    
    res.render('login', {
        title: 'Log in'
    });

});
/*
 * POST login
 */
router.post('/login', function (req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
    
});

router.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  })
module.exports = router;
