// app.route('/passwords')
//   .get(function(req, res) {
//     Password.find(function(err, passwords) {
//       if (!err) {
//         res.send(passwords);
//       } else {
//         res.send(err);
//       }
//     });
//   })
//   .post(function(req, res) {
//     const password = new Password({
//       title: req.body.title,
//       username: req.body.username,
//       password: req.body.password
//     })
//     password.save(function(err) {
//       if (!err) {
//         res.send('Succesfully added password entry to database.')
//       } else {
//         res.send(err);
//       }
//     });
//   })
//   .delete(function(req, res) {
//     Password.deleteMany(function(err) {
//       if (!err) {
//         res.send('Passwords successfully deleted.');
//       } else {
//         res.send(err);
//       }
//     });
//   });
//
// app.route('/passwords/:title')
//   .get(function(req, res) {
//     Password.findOne({
//       title: req.params.title
//     }, function(err, password) {
//       if (!err) {
//         res.send(password);
//       } else {
//         res.send('Could not find password with that title.' + '\n' + err);
//       }
//     });
//   })
//   .put(function(req, res) {
//     Password.updateOne({
//       title: req.params.title
//     }, {
//       title: req.body.title,
//       username: req.body.username,
//       password: req.body.password
//     }, {
//       overwrite: true
//     }, function(err) {
//       if (!err) {
//         res.send('Succesfully updated password entry.')
//       } else {
//         res.send('Could not update password, please check title.' + '\n' + err);
//       }
//     });
//   })
//   .patch(function(req, res) {
//     Password.updateOne({
//       title: req.params.title
//     }, {
//       $set: req.body
//     }, function(err) {
//       if (!err) {
//         res.send('Succesfully updated password entry.')
//       } else {
//         res.send('Could not update password, please check title.' + '\n' + err);
//       }
//     });
//   })
//   .delete(function(req, res) {
//     Password.deleteOne({
//       title: req.params.title
//     }, function(err) {
//       if (!err) {
//         res.send('Succesfully deleted password entry.')
//       } else {
//         res.send('Could not delete password entry, please check title.' + '\n' + err);
//       }
//     });
//   });
