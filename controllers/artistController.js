// Artist Controller
var Album = require('../models/albums.js')


// Display list of all Authors.
exports.artist_list = function(req, res) {
    Album
        .find(
            {},
            'artist'
        )
        .sort({artist:1})
        .exec(function(err, artists) {
            // console.log(artist)
            res.render('artist_list', { title: "List of artists", artist_list: artists })
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

