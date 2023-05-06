const { model, Schema, SchemaTypes } = require('mongoose');

const userSchema = new Schema({
    username: String,
    count: Number,
    log: {
        type: [SchemaTypes.ObjectId.valueOf()],
        ref: 'Exercise'
    } 
});

module.exports = model('User', userSchema);