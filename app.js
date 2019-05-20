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
const secret = process.env.MSECRET;

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/passwordDB', {
  useNewUrlParser: true
});

/***********************************SCHEMAS************************************/

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

const cardSchema = new mongoose.Schema({
  unique_id: {
    type: Number,
    unique: true,
    required: true
  },
  card_provider: String,
  account_holder: String,
  card_number: String,
  expiry_date: String,
  security_code: {
    type: String,
    required: true
  },
  pin: String
});

const onlineBankSchema = new mongoose.Schema({
  unique_id: {
    type: Number,
    unique: true,
    required: true
  },
  bank: String,
  url: String,
  username: String,
  password: String
});

const onlineAccountSchema = new mongoose.Schema({
  unique_id: {
    type: Number,
    unique: true,
    required: true
  },
  account_provider: String,
  type: String,
  url: String,
  username: String,
  password: String
});

const billSchema = new mongoose.Schema({
  unique_id: {
    type: Number,
    unique: true,
    required: true
  },
  company: String,
  type: String,
  url: String,
  date_debited: String,
  amount: Number,
  paid: String
});

/***********************************PLUGINS************************************/

cardSchema.plugin(encrypt, {
  secret: secret,
  encryptedFields: ['card_number', 'expiry_date', 'pin']
});

onlineBankSchema.plugin(encrypt, {
  secret: secret,
  encryptedFields: ['password']
});

onlineAccountSchema.plugin(encrypt, {
  secret: secret,
  encryptedFields: ['password']
});

/*********************************COLLECTIONS**********************************/

const Password = mongoose.model('password', passwordSchema);
const Admin = mongoose.model('admin', adminScehma);
const Card = mongoose.model('card', cardSchema);
const OnlineBank = mongoose.model('onlineBank', onlineBankSchema);
const OnlineAccount = mongoose.model('onlineAccount', onlineAccountSchema);
const Bill = mongoose.model('bill', billSchema);

/***********************************BCRYPT*************************************/

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

/*********************************LOGIN PAGE***********************************/

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

/**********************************HOME PAGE***********************************/

app.get('/passwords', function(req, res) {
  res.render('passwords');
});

/********************************CREDIT CARDS**********************************/

app.route('/cards')
  .get(function(req, res) {
    Card.find(function(err, entry) {
      if (!err) {
        if (entry) {
          res.render('cards', {
            entries: entry
          });
        } else {
          res.render('cards');
        }
      } else {
        console.log(err);
      }
    });
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
    res.redirect('/cards');
  });

app.post('/pw-card-show', function(req, res) {
  Admin.findOne({
    username: req.body.username
  }, function(err, admin) {
    if (!err) {
      if (admin) {
        bcrypt.compare(req.body.password, admin.password, function(err, result) {
          if (!err) {
            if (result === true) {
              Card.findOne({
                unique_id: req.body.unique_id
              }, function(err, card) {
                if (!err) {
                  if (card) {
                    res.send('Security Code: ' + card.security_code + '  Pin: ' + card.pin);
                  } else {
                    res.send('Please enter a valid unique ID.');
                  }
                } else {
                  console.log(err);
                }
              });
            } else {
              res.send('Please enter valid administrator password.');
            }
          } else {
            console.log(err);
          }
        });
      } else {
        res.send('Please enter correct administrator username.');
      }
    } else {
      console.log(err);
    }
  });
});

app.post('/cardsdelete', function(req, res) {
  Admin.findOne({
    username: req.body.username
  }, function(err, admin) {
    if (!err) {
      if (admin) {
        bcrypt.compare(req.body.password, admin.password, function(err, result) {
          if (result === true) {
            Card.deleteOne({
              unique_id: req.body.unique_id
            }, function(err) {
              if (!err) {
                res.redirect('/cards');
              } else {
                console.log(err);
                res.send('Please enter valid unique ID');
              }
            });
          } else {
            res.send('Please enter valid administrator password.');
          }
        });
      } else {
        res.send('Please enter correct administrator username.');
      }
    } else {
      console.log(err);
    }
  });
});

/*******************************ONLINE BANKING*********************************/

app.route('/onlinebanking')
  .get(function(req, res) {
    OnlineBank.find(function(err, entry) {
      if (!err) {
        if (entry) {
          res.render('onlinebanking', {
            entries: entry
          });
        } else {
          res.render('onlinebanking');
        }
      } else {
        console.log(err);
      }
    });
  })
  .post(function(req, res) {
    const newOnlineBank = new OnlineBank({
      unique_id: req.body.unique_id,
      bank: req.body.bank,
      url: req.body.url,
      username: req.body.username,
      password: req.body.password
    });
    newOnlineBank.save();
    res.redirect('/onlinebanking');
  });

app.post('/pw-ob-show', function(req, res) {
  Admin.findOne({
    username: req.body.username
  }, function(err, admin) {
    if (!err) {
      if (admin) {
        bcrypt.compare(req.body.password, admin.password, function(err, result) {
          if (!err) {
            if (result === true) {
              OnlineBank.findOne({
                unique_id: req.body.unique_id
              }, function(err, onlineBank) {
                if (!err) {
                  if (onlineBank) {
                    res.send('Password: ' + onlineBank.password);
                  } else {
                    res.send('Please enter a valid unique ID.');
                  }
                } else {
                  console.log(err);
                }
              });
            } else {
              res.send('Please enter valid administrator password.');
            }
          } else {
            console.log(err);
          }
        });
      } else {
        res.send('Please enter correct administrator username.');
      }
    } else {
      console.log(err);
    }
  });
});

app.post('/obdelete', function(req, res) {
  Admin.findOne({
    username: req.body.username
  }, function(err, admin) {
    if (!err) {
      if (admin) {
        bcrypt.compare(req.body.password, admin.password, function(err, result) {
          if (!err) {
            if (result === true) {
              OnlineBank.deleteOne({
                unique_id: req.body.unique_id
              }, function(err) {
                if (!err) {
                  res.redirect('/onlinebanking');
                } else {
                  console.log(err);
                  res.send('Please enter valid unique ID.');
                }
              });
            } else {
              res.send('Please enter valid administrator password.');
            }
          } else {
            console.log(err);
          }
        });
      } else {
        res.send('Please enter correct administrator username.');
      }
    } else {
      console.log(err);
    }
  });
});

/*******************************ONLINE ACCOUNTS********************************/

app.route('/onlineaccounts')
  .get(function(req, res) {
    OnlineAccount.find(function(err, entry) {
      if (!err) {
        if (entry) {
          res.render('onlineaccounts', {
            entries: entry
          });
        } else {
          res.render('onlineaccounts');
        }
      } else {
        console.log(err);
      }
    });
  })
  .post(function(req, res) {

    const newOnlineAccount = new OnlineAccount({
      unique_id: req.body.unique_id,
      account_provider: req.body.ac_provider,
      type: req.body.type,
      url: req.body.url,
      username: req.body.username,
      password: req.body.password
    });
    newOnlineAccount.save(function(err) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect('/onlineaccounts');
  })

app.post('/pw-oa-show', function(req, res) {
  Admin.findOne({
    username: req.body.username
  }, function(err, admin) {
    if (!err) {
      if (admin) {
        bcrypt.compare(req.body.password, admin.password, function(err, result) {
          if (!err) {
            if (result === true) {
              OnlineAccount.findOne({
                unique_id: req.body.unique_id
              }, function(err, onlineAccount) {
                if (!err) {
                  if (onlineAccount) {
                    res.send('Password: ' + onlineAccount.password);
                  } else {
                    res.send('Please enter a valid unique ID.');
                  }
                } else {
                  console.log(err);
                }
              });
            } else {
              res.send('Please enter valid administrator password.');
            }
          } else {
            console.log(err);
          }
        });
      } else {
        res.send('Please enter correct administrator username.');
      }
    } else {
      console.log(err);
    }
  });
});

app.post('/oadelete', function(req, res) {
  Admin.findOne({
    username: req.body.username
  }, function(err, admin) {
    if (!err) {
      if (admin) {
        bcrypt.compare(req.body.password, admin.password, function(err, result) {
          if (!err) {
            if (result === true) {
              OnlineAccount.deleteOne({
                unique_id: req.body.unique_id
              }, function(err) {
                if (!err) {
                  res.redirect('/onlineaccounts');
                } else {
                  console.log(err);
                  res.send('Please enter valid unique ID.');
                }
              });
            } else {
              res.send('Please enter valid administrator password.');
            }
          } else {
            console.log(err);
          }
        });
      } else {
        res.send('Please enter correct administrator username.');
      }
    } else {
      console.log(err);
    }
  });
});

/************************************BILLS*************************************/

app.route('/bills')
  .get(function(req, res) {
    Bill.find(function(err, entry) {
      if (!err) {
        if (entry) {
          res.render('bills', {
            entries: entry
          });
        } else {
          res.render('bills');
        }
      } else {
        console.log(err);
      }
    });
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
    });
    newBill.save(function(err) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect('/bills');
  })

app.post('/pw-bill-show', function(req, res) {
  Admin.findOne({
    username: req.body.username
  }, function(err, admin) {
    if (!err) {
      if (admin) {
        bcrypt.compare(req.body.password, admin.password, function(err, result) {
          if (!err) {
            if (result === true) {
              Bill.findOne({
                unique_id: req.body.unique_id
              }, function(err, onlineAccount) {
                if (!err) {
                  if (onlineAccount) {
                    res.send('Password: ' + onlineAccount.password);
                  } else {
                    res.send('Please enter a valid unique ID.');
                  }
                } else {
                  console.log(err);
                }
              });
            } else {
              res.send('Please enter valid administrator password.');
            }
          } else {
            console.log(err);
          }
        });
      } else {
        res.send('Please enter correct administrator username.');
      }
    } else {
      console.log(err);
    }
  });
});

app.post('/billdelete', function(req, res) {
  Admin.findOne({
    username: req.body.username
  }, function(err, admin) {
    if (!err) {
      if (admin) {
        bcrypt.compare(req.body.password, admin.password, function(err, result) {
          if (!err) {
            if (result === true) {
              Bill.deleteOne({
                unique_id: req.body.unique_id
              }, function(err) {
                if (!err) {
                  res.redirect('/bills');
                } else {
                  console.log(err);
                  res.send('Please enter valid unique ID.');
                }
              });
            } else {
              res.send('Please enter valid administrator password.');
            }
          } else {
            console.log(err);
          }
        });
      } else {
        res.send('Please enter correct administrator username.');
      }
    } else {
      console.log(err);
    }
  });
});

app.listen(3000, function() {
  console.log('Listening on port 3000');
});
