const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    balance: { type: Number, default: 24 },
    qrToken: { type: String, default: null },
    history: [{
        date: { type: Date, default: Date.now },
        action: String
    }]
});

module.exports = mongoose.model('User', UserSchema);