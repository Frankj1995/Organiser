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

const cardSchema = {
  card_provider: String,
  account_holder: String,
  card_number: String,
  expiry_date: String,
  security_code: {
    type: String,
    required: true
  },
  pin: String
}

const Password = mongoose.model('password', passwordSchema);
const Admin = mongoose.model('admin', adminScehma);
const Card = mongoose.model('card', cardSchema);

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
  Admin.findOne({
    username: req.body.username
  }, function(err, admin) {
    if (admin) {
      bcrypt.compare(req.body.password, admin.password, function(err, result) {
        if (result === true) {
          res.render('passwords');
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

app.route('/creditcards')
  .get(function(req, res) {
    Card.find(function(err, card) {
      if (!err) {
        if (card) {
          res.render('creditcards', {
            cardItems: card
          });
        } else {
          res.render('creditcards');
        }
      } else {
        console.log(err);
      }
    });
  })
  .post(function(req, res) {

    const newCard = new Card({
      card_provider: req.body.card_provider,
      account_holder: req.body.account_holder,
      card_number: req.body.card_number,
      expiry_date: req.body.expiry_date,
      security_code: req.body.security_code,
      pin: req.body.pin
    })
    newCard.save();
    res.redirect('/creditcards');
  });

app.post('/ccdelete', function(req, res) {
  Admin.findOne({
    username: req.body.username
  }, function(err, admin) {
    if (admin) {
      bcrypt.compare(req.body.password, admin.password, function(err, result) {
        if (result === true) {
          Card.deleteOne({
            security_code: req.body.identifier
          }, function(err) {
            if (!err) {
              res.redirect('/creditcards');
            } else {
              res.send('Please enter valid security number');
            }
          });
        } else {
          res.send('Please enter correct password');
        }
      });
    } else {
      res.send('Please enter correct admin username');
    }
  });
});

app.listen(3000, function() {
  console.log('Listening on port 3000');
});
