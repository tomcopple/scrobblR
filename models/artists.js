var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ArtistSchema = new Schema({
    _id: Schema.Types.ObjectId,
    name: String,
    albums: [{
        type: Schema.Types.ObjectId, 
        ref: 'Album'
    }]
});

ArtistSchema.index({
    name: 'text'
});
    
ArtistSchema
.virtual('url')
.get(function() {
    return '/catalog/artist/' + this._id;
});

module.exports = mongoose.model('Artist', ArtistSchema)