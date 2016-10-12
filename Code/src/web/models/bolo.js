var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'agency',
        required: true
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    fields: {
        type: [String]
    },
    videoURL: {
        type: String
    },
    info: {
        type: String
    },
    summary: {
        type: String
    },
    featured: {
        data: Buffer,
        contentType: String
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'FOUND', 'ARRESTED'],
        required: true
    },
    other1: {
        data: Buffer,
        contentType: String
    },
    other2: {
        data: Buffer,
        contentType: String
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    conformationToken: {
        type: String,
        required: true
    },
    isArchived: {
        type: Boolean,
        default: false
    }
});

var Bolo = module.exports = mongoose.model('bolo', Schema);

module.exports.findBoloByID = function (id, callback) {
    Bolo.findOne({_id: id}).populate('agency').populate('author').populate('category').exec(callback);
};

module.exports.findAllBolos = function (isConfirmed, limit, skip, sortBy, callback) {
    Bolo.find({
        isConfirmed: isConfirmed
    }).populate('agency').populate('author').populate('category')
        .limit(limit)
        .skip(skip)
        .sort(sortBy)
        .exec(callback);
};

module.exports.findBolosByAgency = function (agencyName, limit, skip, sortBy, callback) {
    Bolo.find({
        agency: agencyName,
        isConfirmed: true
    }).limit(limit)
        .skip(skip)
        .sort({sortBy: 1})
        .exec(callback);
};

module.exports.findBoloByToken = function (token, callback) {
    Bolo.findOne({conformationToken: token}).exec(callback);
};

module.exports.findBolosByAuthor = function (authorName, limit, callback) {
    Bolo.find({
        author: authorName
    }).limit(limit).sort({}).exec(callback);
};
