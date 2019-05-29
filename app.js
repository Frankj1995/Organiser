require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const secret = process.env.SECRET;
const dbatlas = process.env.DBATLAS

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://admin-frank:TPSbvQ5ElofXKwr5@cluster0-eus86.mongodb.net/organiserDB', {
  useNewUrlParser: true
});

mongoose.set('useCreateIndex', true);

/***********************************SCHEMAS************************************/

const cardSchema = new mongoose.Schema({
  unique_id: Number,
  card_provider: String,
  account_holder: String,
  card_number: String,
  expiry_date: String,
  security_code: String,
  pin: String
});

const onlinebankSchema = new mongoose.Schema({
  unique_id: Number,
  bank: String,
  url: String,
  username: String,
  password: String
});

const onlineaccountSchema = new mongoose.Schema({
  unique_id: Number,
  account_provider: String,
  type: String,
  url: String,
  username: String,
  password: String
});

const billSchema = new mongoose.Schema({
  unique_id: Number,
  company: String,
  type: String,
  url: String,
  date_debited: String,
  amount: Number,
  paid: String
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  card: [cardSchema],
  onlinebank: [onlinebankSchema],
  onlineaccount: [onlineaccountSchema],
  bill: [billSchema]
});

/***********************************PLUGINS************************************/

userSchema.plugin(passportLocalMongoose);

/*********************************COLLECTIONS**********************************/

const User = mongoose.model('user', userSchema);
const Card = mongoose.model('card', cardSchema);
const OnlineBank = mongoose.model('onlinebank', onlinebankSchema);
const OnlineAccount = mongoose.model('onlineaccount', onlineaccountSchema);
const Bill = mongoose.model('bill', billSchema);

/*********************************PASSPORT*************************************/

passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


/*********************************LOGIN PAGE***********************************/
//
app.get('/', function(req, res) {
  res.render('login');
});

app.get('/', function(req, res, next) {
  res.sendfile('./html/auth.html');
});

app.post('/login', function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate('local')(req, res, function() {
        res.redirect('/passwords');
      });
    }
  });
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
})

/*********************************REGISTER PAGE********************************/

app.get('/register', function(req, res) {
  res.render('register');
});

app.post('/register', function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect('/register');
    } else {
      passport.authenticate('local')(req, res, function() {
        res.redirect('/passwords');
      })
    }
  });
});

/**********************************HOME PAGE***********************************/

app.get('/passwords', function(req, res) {
  if (req.isAuthenticated()) {
    res.render('passwords');
  } else {
    res.redirect('/');
  }
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

/********************************CREDIT CARDS**********************************/

app.route('/cards')
  .get(function(req, res) {
    if (req.isAuthenticated()) {
      if (req.user.card) {
        res.render('cards/cards', {
          cards: req.user.card
        })
      } else {
        res.render('cards/card');
      }
    } else {
      res.redirect('/');
    }
  })
  .post(function(req, res) {
    const newCard = new Card({
      unique_id: req.body.unique_id,
      card_provider: req.body.card_provider,
      account_holder: req.body.account_holder,
      card_number: req.body.card_number,
      expiry_date: req.body.expiry_date,
      security_code: req.body.security_code,
      pin: req.body.pin
    })
    newCard.save();

    User.findById(req.user.id, function(err, foundUser) {
      foundUser.card.push(newCard);
      foundUser.save();
    });
    res.redirect('/cards');
  });

app.post('/pw-card-show', function(req, res) {
  const card = req.user.card;
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  if (req.isAuthenticated()) {
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.send(card);
      }
    });
  } else {
    res.redirect('/');
  }
});

app.post('/cardsdelete', function(req, res) {
  const userId = req.user.id;
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  if (req.isAuthenticated()) {
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        User.findByIdAndUpdate(userId, {
          $pull: {
            card: {
              unique_id: req.body.unique_id
            }
          }
        }, function(err) {
          res.redirect('/cards');
        });
      }
    });
  }
});

/*******************************ONLINE BANKING*********************************/

app.route('/onlinebanking')
  .get(function(req, res) {
    if (req.isAuthenticated()) {
      if (req.user.onlinebank) {
        res.render('onlinebanking/onlinebanking', {
          onlinebank: req.user.onlinebank
        })
      } else {
        res.render('onlinebanking/onlinebank');
      }
    } else {
      res.redirect('/');
    }
  })
  .post(function(req, res) {
    const newBank = new OnlineBank({
      unique_id: req.body.unique_id,
      bank: req.body.bank,
      url: req.body.url,
      username: req.body.username,
      password: req.body.password
    })
    newBank.save();

    User.findById(req.user.id, function(err, foundUser) {
      foundUser.onlinebank.push(newBank);
      foundUser.save();
    });
    res.redirect('/onlinebanking')
  });

app.post('/pw-ob-show', function(req, res) {
  const onlinebank = req.user.onlinebank;
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  if (req.isAuthenticated()) {
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.send(onlinebank);
      }
    });
  } else {
    res.redirect('/');
  }
});

app.post('/obdelete', function(req, res) {
  const userId = req.user.id;
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  if (req.isAuthenticated()) {
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        User.findByIdAndUpdate(userId, {
          $pull: {
            onlinebank: {
              unique_id: req.body.unique_id
            }
          }
        }, function(err) {
          res.redirect('/onlinebanking');
        });
      }
    });
  }
});

/*******************************ONLINE ACCOUNTS********************************/

app.route('/onlineaccounts')
  .get(function(req, res) {
    if (req.isAuthenticated()) {
      if (req.user.onlineaccount) {
        res.render('onlineaccounts/onlineaccounts', {
          onlineaccount: req.user.onlineaccount
        })
      } else {
        res.render('onlineaccounts/onlineaccount');
      }
    } else {
      res.redirect('/');
    }
  })
  .post(function(req, res) {
    const newAccount = new OnlineAccount({
      unique_id: req.body.unique_id,
      account_provider: req.body.account_provider,
      type: req.body.type,
      url: req.body.url,
      username: req.body.username,
      password: req.body.password
    })
    newAccount.save();

    User.findById(req.user.id, function(err, foundUser) {
      foundUser.onlineaccount.push(newAccount);
      foundUser.save();
    });
    res.redirect('/onlineaccounts')
  });

app.post('/pw-oa-show', function(req, res) {
  const onlineaccount = req.user.onlineaccount;
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  if (req.isAuthenticated()) {
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.send(onlineaccount);
      }
    });
  } else {
    res.redirect('/');
  }
});

app.post('/oadelete', function(req, res) {
  const userId = req.user.id;
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  if (req.isAuthenticated()) {
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        User.findByIdAndUpdate(userId, {
          $pull: {
            onlineaccount: {
              unique_id: req.body.unique_id
            }
          }
        }, function(err) {
          res.redirect('/onlineaccounts');
        });
      }
    });
  }
});

/************************************BILLS*************************************/

app.route('/bills')
  .get(function(req, res) {
    if (req.isAuthenticated()) {
      if (req.user.bill) {
        res.render('bills/bills', {
          bills: req.user.bill
        })
      } else {
        res.render('bills/bill');
      }
    } else {
      res.redirect('/');
    }
  })
  .post(function(req, res) {
    const newBill = new Bill({
      unique_id: req.body.unique_id,
      company: req.body.company,
      type: req.body.type,
      url: req.body.url,
      date_debited: req.body.date_debited,
      amount: req.body.amount,
      paid: req.body.paid
    })
    newBill.save();

    User.findById(req.user.id, function(err, foundUser) {
      foundUser.bill.push(newBill);
      foundUser.save();
    });
    res.redirect('/bills')
  });

app.post('/billdelete', function(req, res) {
  const userId = req.user.id;
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  if (req.isAuthenticated()) {
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        User.findByIdAndUpdate(userId, {
          $pull: {
            bill: {
              unique_id: req.body.unique_id
            }
          }
        }, function(err) {
          res.redirect('/bills');
        });
      }
    });
  }
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started succesfully");
});
