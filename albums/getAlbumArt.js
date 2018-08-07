// Try to download album art




albumArt('Childish Gambino', { album: 'awaken, my love', size: 'large' })
    .then( (result) => console.log(result))
    .catch( (err) => console.log(err))

// Download album art for all albums so far
// const mongoose = require('mongoose');
// const mongoDB = 'mongodb://scrobblr:scrobblr01@ds131711.mlab.com:31711/my_records';
// const Album = require('../models/albums.js')
// const fs = require('fs');
// const request = require('request');

// var download = function(url, filename, callback) {
//     request.head(url, function(err, res, body) {
//         request(url).pipe(fs.createWriteStream(filename)).on('close', callback);
//     });
// }

// mongoose.connect(mongoDB, { useNewUrlParser: true })
//     .then(
//         () => {
//             console.log('connected');
//             Album
//                 .find( {})
//                 .exec(function(err, results) {
//                     results.forEach(function(x) {
//                         var filename = './public/images/albums/' + x._id + '.png';
//                         console.log(filename);
//                         albumArt(x.artist, { album: x.name, size: 'extralarge'} )
//                             .then( (result) => {
//                                 console.log(result);
//                                 download(result, filename, function() { console.log('Downloaded ' + x.name )})
//                             })
//                     })
//                 });
//         }
//     )