const db = require("../models");
const bcrypt = require('bcryptjs');

// Defining methods for the userController
module.exports = {
  findAll: (req, res) => {
    if (req.user) {
      db.User.find({}, 'firstName lastName username avatar')
      .then(user => {
        res.json(user)
      })
    }
  },
  getUser: (req, res, next) => {
    // console.log(req.user);
    if (req.user) {
      return res.json({ user: req.user });
    } else {
      return res.json({ user: null });
    }
  },
  getOneUser: (req, res) => {
    db.User.find({"_id": req.params.id}, 'firstName lastName username avatar')
    .then(user => {
      res.json(user);
    })
  },
  register: (req, res) => {
    const { firstName, lastName, username, password } = req.body;
    // ADD VALIDATION
    db.User.findOne({ 'username': username }, (err, userMatch) => {
      if (userMatch) {
        return res.json({
          error: `Sorry, already a user with the username: ${username}`
        });
      }
      const newUser = new db.User({
        'firstName': firstName,
        'lastName': lastName,
        'username': username,
        'password': password
      });
      newUser.save((err, savedUser) => {
        if (err) return res.json(err);
        return res.json(savedUser);
      });
    });
  },
  logout: (req, res) => {
    if (req.user) {
      req.session.destroy();
      res.clearCookie('connect.sid'); // clean up!
      return res.json({ msg: 'logging you out' });
    } else {
      return res.json({ msg: 'no user to log out!' });
    }
  },
  auth: function(req, res, next) {
		// console.log(req.body);
		next();
  },
  authenticate: (req, res) => {
		const user = JSON.parse(JSON.stringify(req.user)); // hack
		const cleanUser = Object.assign({}, user);
		if (cleanUser) {
			// console.log(`Deleting ${cleanUser.password}`);
			delete cleanUser.password;
		}
		res.json({ user: cleanUser });
	},
  updateUser: function (req,res) {
    if (req.body.password) {
      let hashPassword = bcrypt.hashSync(req.body.password, 10)
      req.body.password = hashPassword
    };
    db.User.findOneAndUpdate({ _id: req.params.id }, req.body)
    .then(dbModel => {
      res.json(dbModel);
    })
    .catch(err => res.status(422).json(err));
  }
};