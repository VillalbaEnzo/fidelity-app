const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    balance: { type: Number, default: 24 },
    qrToken: { type: String, default: null },
    qrTokenDate: { type: Date, default: null },
    qrStatus: { type: String, enum: ['valid', 'used'], default: 'valid' },
    isFirstLogin: { type: Boolean, default: true },
    history: [{
        date: { type: Date, default: Date.now },
        action: String
    }]
});

module.exports = mongoose.model('User', UserSchema);