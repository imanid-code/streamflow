const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
mongoose.promise = Promise;

// Define userSchema
const userSchema = new Schema({
	firstName: { type: String, unique: false },
	lastName: { type: String, unique: false },
	username: { type: String, unique: false, required: false },
	password: { type: String, unique: false, required: false },
	email: { type: String, unique: false, required: false },
	avatar: {
		style: { type: String, unique: false, default: "Circle"},
		top: { type: String, unique: false, default: "LongHairStraight" },
		accessories: { type: String, unique: false, default: "Blank" },
		hairColor: { type: String, unique: false, default: "BrownDark" },
		facialHair: { type: String, unique: false, default: "Blank" },
		facialColor: { type: String, unique: false, default: "" },
		clothes: { type: String, unique: false, default: "BlazerShirt" },
		clotheColor: { type: String, unique: false, default: "White" },
		eyes: { type: String, unique: false, default: "Default" },
		eyebrow: { type: String, unique: false, default: "Default" },
		mouth: { type: String, unique: false, default: "Default" },
		skin: { type: String, unique: false, default: "Light" }
	},
	tasks: [
		{
			type: Schema.Types.ObjectId,
			ref: "Task"
		}
	],
	notes: [
		{
			type: Schema.Types.ObjectId,
			ref: "Note"
		}
	],
	projects: [
		{
			type: Schema.Types.ObjectId,
			ref: "Project"
		}
	],
});

// Define schema methods
userSchema.methods = {
	checkPassword: function(inputPassword) {
		return bcrypt.compareSync(inputPassword, this.password);
	},
	hashPassword: plainTextPassword => {
		return bcrypt.hashSync(plainTextPassword, 10);
	}
};

// Define hooks for pre-saving
userSchema.pre('save', function(next) {
	if (!this.password) {
		// console.log('No password provided!');
		next();
	} else {
		this.password = this.hashPassword(this.password);
		next();
	}
})

// Create reference to User & export
const User = mongoose.model('User', userSchema);
module.exports = User;
