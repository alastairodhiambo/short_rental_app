// Alastair Odhiambo

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = require('bluebird');

const roomSchema = new Schema({
    filename: {
        type: String,
        unique: true,
    },
    name: String,
    description: String,
    location: String,
    price: Number,
    host: String,
    host_username: String,
});

module.exports = mongoose.model('rooms', roomSchema);
