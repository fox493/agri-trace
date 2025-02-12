const mongoose = require('mongoose');
const { ROLES } = require('../utils/auth');

// 农场信息模式
const farmSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        address: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    area: Number,  // 面积（亩）
    crops: [{      // 种植作物
        name: String,
        variety: String,
        area: Number
    }],
    certifications: [{  // 认证信息
        type: String,
        number: String,
        issueDate: Date,
        expiryDate: Date
    }]
});

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
    profile: {
        name: String,
        phone: String,
        email: String,
        idNumber: String,  // 身份证号
        address: String
    },
    // 根据角色存储不同的信息
    farmInfo: {
        type: farmSchema,
        required: false  // 修改为非必需
    },
    organizationInfo: {
        name: String,      // 组织名称
        type: String,      // 组织类型
        license: String,   // 营业执照号
        address: String,
        required: false
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// 创建索引
userSchema.index({ username: 1 });
userSchema.index({ 'profile.phone': 1 });
userSchema.index({ 'farmInfo.name': 1 });
userSchema.index({ 'organizationInfo.license': 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 