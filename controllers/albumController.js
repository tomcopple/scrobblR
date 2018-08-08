// album Controller
var Album = require('../models/albums.js')
var async = require('async');
var LastfmAPI = require('lastfmapi');
var mongoose = require('mongoose');
const fs = require('fs');
const request = require('request');
mongoose.Promise = global.Promise;

var Discogs = require('disconnect').Client;
var disco = new Discogs({
    consumerKey: 'tntYcZOONAfknUxUXTzu',
    consumerSecret: 'YEOiVPFsvtpIfuZoGzFvEgOXFOmoiZEf'
}).database();

// Try to download album art

var getDiscogs = require('../albums/getDiscogs.js');
var getSpotify = require('../albums/getSpotify.js');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.index = function (req, res) {

    // console.log("Req: " + req.params);

    Album
        .find({}, 'name artist _id')
        .sort({ artist: 1 })
        .exec(function (err, list_albums) {
            if (err) { return next(err) }
            res.render('index', { title: '', albums: list_albums })
        })
}

// Display list of all Authors.
exports.album_list = function (req, res) {
    Album
        .find({}, 'name artist')
        .sort({ name: 1 })
        .exec(function (err, list_albums) {
            if (err) { return next(err) }
            res.render('album_list', { title: 'Album List', album_list: list_albums })
        })
};

// Display detail page for a specific Author.
exports.album_detail = function (req, res) {
    Album
        .findById(req.params.id)
        .exec(function (err, album) {
            if (err) { return next(err) }
            if (album.name == null) { // No results
                var err = new Error('Album not found')
                err.status = 404;
                return next(err);
            }
            res.render('album_detail', { title: 'Title', album: album })
        });
};

// Display Album create form on GET.
exports.album_create_get = function (req, res) {
    res.render('album_form', { title: 'Add new album' })
};

// Handle Album create on POST.
exports.album_create_post = [
    // Check that the name field is filled
    body('name', 'Album name required').isLength({ min: 1 }).trim(),
    body('artist', 'Artists name required').isLength({ min: 1 }).trim(),

    // Sanitize (trim and escape) the name field
    // Actually don't escape because it removes apostrophes, which some artists/albums need
    sanitizeBody('name').trim(),
    sanitizeBody('artist').trim(),

    // Process request
    (req, res) => {
        // Extract validation errors
        const errors = validationResult(req);
        console.log(req.body.name, req.body.artist)

        // This is where we will find the album information
        if (!errors.isEmpty()) {
            // If error, render the form again with sanitized values/error messages
            res.render('album_form', { title: 'Add new album', album: name, errors: errors.array() });
            return;
        } else {
            getDiscogs(req.body.name, req.body.artist)
                .then((results) => {
                    // Check if album already exists
                    Album.findOne({
                        'name': results.album.name,
                        'artist': results.album.artist
                    })
                        .exec((err, found_album) => {
                            if (err) {
                                console.log("Error checking if album already exists " + err);
                                return
                            }
                            if (found_album) {
                                // console.log("Found an existing album " + found_album);
                                res.render('album_detail', {
                                    message: "Album already exists in database, redirecting...",
                                    title: "Album",
                                    album: found_album
                                });
                                return;
                            } else {
                                console.log("New album info: " + JSON.stringify(results.album, null, 2));
                                console.log("Album art at " + results.albumArt);

                                // If it doesn't already exist, create a new album
                                var newAlbum = new Album(results.album)

                                // Download album art from the image link. Ugh, needs a different function for discogs
                                if (/discogs/.test(results.albumArt)) {
                                    disco.getImage(results.albumArt, function (err, data) {
                                        fs.writeFile('./public/images/albums/' + newAlbum._id + '.png', data, 'binary', function () {
                                            console.log('Downloaded album art for ' + newAlbum.name);
                                            res.render('album_form_filled', {
                                                title: "Is this correct?",
                                                album: newAlbum
                                            })
                                        })
                                    })
                                } else {
                                    var download = function (url, filename, callback) {
                                        request.head(url, function (err, res, body) {
                                            request(url).pipe(fs.createWriteStream(filename)).on('close', callback);
                                        });
                                    }
                                    var filename = "./public/images/albums/" + newAlbum._id + '.png';
                                    download(results.albumArt, filename, function () {
                                        console.log('Downloaded album art for ' + newAlbum.name);
                                        res.render('album_form_filled', {
                                            title: "Is this correct?",
                                            album: newAlbum
                                        })
                                    });
                                }




                            }
                        })
                })
                .catch((err) => {
                    console.log("Error in getDiscogs " + JSON.stringify(err, null, 2));
                    res.render('album_form', {
                        title: "Add new album",
                        message: "No album found, please try again"
                    })
                })
        }
    }
]

exports.addAlbum = [
    // Any checks required? Should just be info already filled in
    body('name', 'Album name required').isLength({ min: 1 }).trim(),
    body('artist', 'Artist name required').isLength({ min: 1 }).trim(),
    body('trackSide.*', 'Problem checking Album Side').isLength({ min: 1, max: 1 }).trim(),
    body('trackNum.*', 'Track numbers must start at 1 and be sequential numbers').isInt({ min: 1 }),
    body('trackName.*', "Track names must all be filled in").isLength({ min: 1 }).trim(),
    body('trackLength.*', "Track lengths must be in the format MM:SS").matches(/^\d+:\d{2}$/, 'gi'),

    sanitizeBody('name').trim(),
    sanitizeBody('artist').trim(),

    // Process request
    (req, res, next) => {
        const errors = validationResult(req);

        var newAlbum = new Album({
            _id: req.body.id,
            name: req.body.name,
            artist: req.body.artist,
            tracks: []
        })

        for (i = 0; i < req.body.trackNum.length; i++) {
            newAlbum.tracks.push({
                track_name: req.body.trackName[i],
                track_number: req.body.trackNum[i],
                track_length: (60 * parseInt(req.body.trackLength[i].split(":")[0])) + parseInt(req.body.trackLength[i].split(":")[1]),
                track_side: req.body.trackSide[i]
            })
        }

        if (!errors.isEmpty()) {
            // If error, render the album page again with sanitized values/error messages
            res.render('album_form_filled', { title: 'Problem submitting album, please check info below:', album: newAlbum, errors: errors.array() });
            return next(err);
        } else {
            // console.log(req.body)
            // If any changes have been made to album details, submit as is. 
            newAlbum
                .save(function (err) {
                    if (err) {
                        console.log("Error saving new album" + err);
                        throw new Error('Error saving new album')
                    }
                    res.render('album_detail', {
                        message: "Album successfully added to database",
                        title: "Album",
                        album: newAlbum
                    });
                });
        }
    }
]

// Handle Author delete on POST.
exports.album_delete_post = function (req, res) {

    Album
        .findByIdAndRemove(req.params.id)
        .exec(function (err, results) {
            if (err) { return console.log("Error deleting album: " + err) }
            if (!results) { res.render('/', { message: "No album found to delete?" }) }
            console.log("Deleted " + results.name)
            res.redirect('/');
            // res.render('/', { message: req.body.name + " successfully deleted"})
        })
};

// Display Author update form on GET.
exports.album_update_get = function (req, res) {
    // res.render('album_form_filled', { title: "Edit album", album: newAlbum })
    Album
        .findById(req.params.id)
        .exec(function (err, album) {
            if (err) { return next(err) }
            if (album.name == null) { // No results
                var err = new Error('Album not found')
                err.status = 404;
                return next(err);
            }
            res.render('album_form_filled', {
                title: 'Edit album details',
                edit: true,
                album: album
            })
        });
};

// Handle Author update on POST.
exports.album_update_post = [
    // Any checks required? Should just be the same as above?
    // Need to think about how to add tracks and/or sides

    body('name', 'Album name required').isLength({ min: 1 }).trim(),
    body('artist', 'Artist name required').isLength({ min: 1 }).trim(),
    body('trackSide.*', 'Problem checking Album Side').isLength({ min: 1, max: 1 }).trim(),
    body('trackNum.*', 'Track numbers must start at 1 and be sequential numbers').isInt({ min: 1 }),
    body('trackName.*', "Track names must all be filled in").isLength({ min: 1 }).trim(),
    body('trackLength.*', "Track lengths must be in the format MM:SS").matches(/^\d+:\d{2}$/, 'gi'),

    sanitizeBody('name').trim(),
    sanitizeBody('artist').trim(),

    // Process request
    (req, res, next) => {
        const errors = validationResult(req);

        var newAlbum = new Album({
            // NB THis is new: need to specify id
            _id: req.params.id,
            name: req.body.name,
            artist: req.body.artist,
            tracks: []
        })

        for (i = 0; i < req.body.trackNum.length; i++) {
            newAlbum.tracks.push({
                track_name: req.body.trackName[i],
                track_number: req.body.trackNum[i],
                track_length: (60 * parseInt(req.body.trackLength[i].split(":")[0])) + parseInt(req.body.trackLength[i].split(":")[1]),
                track_side: req.body.trackSide[i]
            })
        }

        if (!errors.isEmpty()) {
            // If error, render the album page again with sanitized values/error messages
            res.render('album_form_filled', { title: 'Problem submitting album, please check info below:', album: newAlbum, errors: errors.array() });
            return;
        } else {
            // console.log(req.body)
            // If any changes have been made to album details, submit as is. 
            Album
                .findByIdAndUpdate(req.params.id, newAlbum, {}, function (err, results) {
                    if (err) {
                        console.log("Error updating mongo with edits. " + err);
                        return next(err)
                    }
                    console.log(newAlbum.tracks)
                    res.render('album_detail', {
                        message: "Album successfully updated",
                        title: "Album",
                        album: newAlbum
                    });
                })
        }
    }
]

exports.album_reset = function (req, res) {
    Album
        .findById(req.params.id)
        .exec(function (err, result) {

            getDiscogs(result.name, result.artist)
                .then((results) => {
                    var newAlbum = new Album({
                        _id: req.params.id,
                        name: results.album.name,
                        artist: results.album.artist,
                        tracks: results.album.tracks
                    });

                    Album
                        .findByIdAndUpdate(req.params.id, newAlbum, {}, function (err) {
                            if (err) {
                                console.log("Error updating mongo with default values. " + err);
                                return next(err);
                            }
                            res.render('album_detail', {
                                message: "Album successfully reset to default",
                                title: "Album",
                                album: newAlbum,
                                edit: false
                            })
                        })
                })
                .catch((err) => {
                    res.render('album_form_filled', {
                        title: "Album not found, please fill in manually",
                        album: {
                            name: result.name,
                            artist: result.artist,
                            tracks: [],
                            edit: false
                        },
                        message: "Album not found, please fill in manually"
                    });
                    return;
                })
        })

}

exports.album_scrobble = function (req, res) {
    var side = req.body.side;
    var id = req.params.id;
    console.log("Receiving side: " + side);

    // API details, hopefully shouldn't change
    var lfm = new LastfmAPI({
        'api_key': "2b33f35453cb09a69b70482d76d1de6d",
        'secret': "4fd051c2ae080e61918e273fadd7ee78"
    });

    // Username details for me, hopefully will be valid for a while.
    lfm.setSessionCredentials('tomcopple', '1w3twRRMHLf3PmMq4u9B3TNu6BzdRTxN');
    // lfm.setSessionCredentials('tomtesting', 'NyQ653IeE0KmNysNHGqZlXZqDhJ_upfE')

    var currentTime = Math.floor((new Date()).getTime() / 1000);
    Album.findById(id, function (err, result) {
        if (err) return console.log("Error finding album by id to scrobble. " + err);
        // console.log("Result from mongo: " + result);
        // Create an array of tracks to scrobblr
        var scrobbles = [];
        result.tracks.forEach((x) => {
            if (side === x.track_side) {
                console.log("Scrobbling (artist, album): " + result.artist + ": " + result.name);
                scrobbles.push({
                    artist: result.artist,
                    album: result.name,
                    track: x.track_name,
                    trackNumber: x.track_number,
                    duration: x.track_length,
                    timestamp: currentTime
                });
                currentTime = currentTime + x.track_length;
            }
        })
        // console.log("Scrobbling: " + scrobbles);
        lfm.track.scrobble(scrobbles, function (err, nowPlaying) {
            if (err) return console.log("Error sending scrobbles to lastfm. " + err);
            res.status(200);
            // console.log(nowPlaying);
        })
    })
}