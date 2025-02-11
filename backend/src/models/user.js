const mongoose = require('mongoose');
const { ROLES } = require('../utils/auth');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        required: true
    },
    orgId: {
        type: String,
        required: true
    },
    orgName: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// 创建索引
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ orgId: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 