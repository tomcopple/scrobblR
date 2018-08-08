// Rename collection
const mongoose = require('mongoose');
const mongoDB = 'mongodb://scrobblr:scrobblr01@ds131711.mlab.com:31711/my_records';
const Album = require('../models/albums.js')

mongoose.connect(mongoDB, { useNewUrlParser: true })
    .then(
        () => {
            console.log('connected');
            // return mongoose.connection.db.collection('records').rename('albums');
            Album
            .find(
                {},
                'artist'
            )
            .sort({artist: 1})
            .exec(function(err, artists) {
                console.log(artists)
            })
                
                // .count()
                // .exec(function (err, count) {
                //     console.log("Doing something");
                //     console.log(count);
                //     process.exit(0);
                // })

        },
        err => {
            console.error(err);
        }
    )