// Takes an album object and uploads it to the database
function populatedb (submission) {
    var Album = require('../models/albums');
    var mongoose = require('mongoose');

    // Check connection
    if(mongoose.connection.readyState!==1) {
        console.log('Mongo connection doesn\'t seem active');
        throw new Error('Mongo connection doesn\'t seem active');
    }

    var newAlbum = new Album(submission);
    newAlbum.save(function(err) {
        if(err) { 
            console.log("Error saving new album" + err);
            throw new Error('Error saving new album')
        }
    })
}

// // Import everything to manage the database
// var Album = require('../models/albums');
// // var Artist = require('./model/artists');

// var getDiscogs = require('./getDiscogs');
// var getSpotify = require('./getSpotify');

// var mongoose = require('mongoose');
// var mongoDB = 'mongodb://scrobblr:scrobblr01@ds131711.mlab.com:31711/my_records';
// mongoose.connect(mongoDB, { useNewUrlParser: true });
// mongoose.Promise = global.Promise;
// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', function() {
//     console.log("Connected!");
// })

// function saveToMongo(discogsResult) {
//     var newAlbum = new Album(discogsResult);
//     newAlbum.save(function(err) {
//         if(err) return console.error(err);
//         db.close();
//     });
// };

// // Spotify ID first, then discogs ID
// // getSpotify('4u1jxGwElKBjFAMZa3mIRQ', 12235645, getDiscogs, saveToMongo)
// // getDiscogs(10288421, saveToMongo);

module.exports = populatedb;
