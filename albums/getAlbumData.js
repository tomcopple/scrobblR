// 3 steps: Download album info & vinyl sides from Discogs, track times from Spotify and album art from lastfm
// Actually, try getting album art from Spotify. More reliablke?

function getAlbumData(albumName, artistName) {

    var getDiscogs = require('./getDiscogs.js');
    var getSpotify = require('./getSpotify.js');
    var async = require('async');

    return new Promise( (resolve, reject) => {
        async.parallel({
            discogs: function (callback) {
                getDiscogs(albumName, artistName)
                    .then(function (results) {
                        callback(null, results);
                    })
                    .catch( () => {
                        callback("Discogs")
                    })
            },
            spotify: function (callback) {
                getSpotify(albumName, artistName)
                    .then(function (results, err) {
                        callback(null, results);
                    })
                    .catch( () => { 
                        callback("Spotify")
                    })
            }
        }, function (err, results) {
            if (err) {
                // If error is Spotify, try to get track times and artwork from Discogs?
                if(err == "Spotify") {
                    
                }

                console.log("Error in getAlbumData " + err);
                reject(err);
            } else {
                // console.log(results.discogs);
                var minTracks = Math.min(results.discogs.tracks.length, results.spotify.trackList.length);
                var newAlbum = results.discogs;
                newAlbum.tracks = newAlbum.tracks.slice(0, minTracks);
                newAlbum.tracks.map(function(track, index) {
                    track.track_length = results.spotify.trackList[[index]]
                });
                if (results.discogs.tracks.length !== results.spotify.trackList.length) {
                    console.log("Reducing album to " + minTracks + " tracks.")
                }
                
                resolve({
                    album: newAlbum,
                    albumArt: results.spotify.albumArt
                });
            }
        })
    });

}
// getAlbumData('boys and girls', 'alabama shakes')
module.exports = getAlbumData;