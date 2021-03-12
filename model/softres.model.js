const mongoose = require('mongoose');

const softresSchema = new mongoose.Schema({
    charName: String,
    class: String,
    raidDate: Date,
    discordInvite: String,
    softResItems: [{
        itemLink: String,
        itemInfo: {
            name: String,
            quality: String,
            icon: String,
            tooltip: String
        }
    }],
    softResLink: String,
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});

softresSchema
    .virtual('raidDateFormatted')
    .get(function () {
        return new Date(this.raidDate).toLocaleDateString('EU').split('-').join(' ');
    });

module.exports = mongoose.model('SoftRes', softresSchema);