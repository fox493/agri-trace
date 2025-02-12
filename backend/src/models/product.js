const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    blockchainId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    area: {
        type: Number,
        required: true
    },
    plantingDate: {
        type: String,
        required: true
    },
    harvestDate: {
        type: String
    },
    status: {
        type: String,
        enum: ['PLANTING', 'HARVESTED'],
        default: 'PLANTING'
    },
    farmerId: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 