require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const adminUsername = process.env.USERNAME;
const adminPassword = process.env.SECRET;

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/passwordDB', {
  useNewUrlParser: true
});

const adminScehma = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

const passwordSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please specify a title.']
  },
  username: {
    type: String,
    require: false
  },
  password: {
    type: {},
    required: [true, 'Please specify a password.']
  }
});

const Password = mongoose.model('password', passwordSchema);
const Admin = mongoose.model('admin', adminScehma);

function encryptPassword(username, password, saltRounds) {
  Admin.find(function(err, admin) {
    if (admin.length === 0) {
      bcrypt.hash(password, saltRounds, function(err, hash) {
        const newAdmin = new Admin({
          username: username,
          password: hash
        });
        newAdmin.save();
      });
    }
  });
}

encryptPassword(adminUsername, adminPassword, saltRounds);

app.get('/', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  Admin.findOne({username: req.body.username}, function(err, admin) {
    if(admin) {
      bcrypt.compare(req.body.password, admin.password, function(err, result) {
        if(result === true) {
          Password.find(function(err, passwords) {
            if(!err) {
              res.render('passwords');
            }
          });
        } else {
          res.send('Incorrect password');
        }
      });
    } else {
      res.send('Could not find user with that username.');
    }
  });
});



app.get('/passwords', function(req, res) {
  res.render('passwords');
});

app.get('/creditcards', function(req, res) {
  res.render('creditcards');
});

app.listen(3000, function() {
  console.log('Server connected on port 3000.');
});
