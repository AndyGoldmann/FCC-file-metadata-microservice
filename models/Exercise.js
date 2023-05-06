const { model, Schema, SchemaTypes } = require('mongoose');

const exerciseShema = new Schema({
    //username: SchemaTypes.ObjectId,
    description: String,
    duration: Number,
    date: String
});

module.exports = model('Exercise', exerciseShema);