// Artist Controller
var Album = require('../models/albums.js')


// Display list of all Authors.
exports.artist_list = function(req, res) {
    Album
        // .find(
        //     {},
        //     'artist'
        // )
        .distinct('artist', {})
        // .sort({artist:1})
        .exec(function(err, artists) {
            res.render('artist_list', { 
                title: "List of artists", 
                artists: artists.sort()
            })
        })
};

// Display detail page for a specific Author.
exports.artist_detail = function(req, res) {
    Album
        .find({ 'artist': req.params.id })
        .sort({ name: 1 })
        .exec(function(err, albums) {
            res.render('artist_detail', { title: req.params.id, albums: albums })
        })
};

