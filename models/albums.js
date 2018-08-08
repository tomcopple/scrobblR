var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;

var AlbumSchema = new Schema({
    artist: { type: String, required: true },
    name: { type: String, required: true },
    tracks: [{
        track_number: Number,
        track_name: String,
        track_length: Number,
        track_side: String
    }]
});

AlbumSchema.index({
    artist: 'text',
    name: 'text'
});

AlbumSchema
.virtual('url')
.get(function() {
    return '/catalog/album/' + this._id;
});

AlbumSchema
.virtual('artisturl')
.get(function() {
    return '/catalog/artist/' + this.artist;
});

module.exports = mongoose.model('Album', AlbumSchema)