// Alastair Odhiambo

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = require('bluebird');

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
    },
    firstname: String,
    lastname: String,
    password: String,
    host: Boolean,
    birthday: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('user', userSchema);
