function getSpotify(nameSearch, artistSearch) {

    var async = require('async');

    return new Promise((resolve, reject) => {
        // Authenticate
        var SpotifyWebApi = require('spotify-web-api-node');
        var spotifyApi = new SpotifyWebApi({
            clientId: '728b70130ae74f7ebebe77c27c5fd700',
            clientSecret: '6c2cbe3b5db54693ac01cd501e2cb971'
        });
        // Sample token: BQBFczYtuHdyLWLYdk-0VmbSOckrwbQQJlXiciggJMorl_kWgAAv0SE_N6DHPws1xutUpLy5AG8HKJfhRW4qdIVd44YLB32rjv9FZ97pFH2dn1pbUMrSoYxQ_yQdhYA2MRtaAbBvMA

        // Test search data
        // var nameSearch = "boys and girls";
        // var artistSearch = "alabama shakes"

        spotifyApi
            .clientCredentialsGrant()
            .then(function (data) {
                // console.log('The access token is ' + data.body['access_token']);
                // Save the access token so that it's used in future calls
                spotifyApi.setAccessToken(data.body['access_token']);

                spotifyApi.searchAlbums("album:" + nameSearch + "+artist:" + artistSearch, {
                    limit: 1
                })
                    .then(function (result) {
                        // console.log("Spotify result: " + JSON.stringify(result, null, 2));
                        // If nothing found
                        if (result.body.albums.total === 0) {
                            console.log("Spotify: Nothing found")
                            reject('No Spotify result found');
                        } else {
                            const getAlbum = result.body.albums.items[[0]];
                            // console.log("Found Spotify album " + getAlbum.name + " " + getAlbum.external_urls.spotify);

                            // Then do two things: download album art and get tracklist
                            async.parallel({
                                albumArt: function (callback) {
                                    // Extract album art 300x300
                                    var albumArt = getAlbum.images.filter(x => x.height == 300)
                                    if (albumArt.length > 0) {
                                        var albumArtUrl = albumArt[[0]].url
                                        callback(null, albumArtUrl)
                                    } else {
                                        callback("No album art found", null);
                                    }
                                },
                                trackList: function (callback) {
                                    spotifyApi
                                        .getAlbumTracks(getAlbum.id)
                                        .then(function (results) {
                                            // console.log("Get album tracks results " + Object.keys(results.body.items[[0]]));
                                            console.log("Found Spotify info for " + getAlbum.name + " with " + results.body.items.length + " tracks: " + (Object.keys(getAlbum.external_urls).includes('spotify') ? getAlbum.external_urls.spotify : "no url found"));
                                            var allTracks = [];
                                            results.body.items.forEach(function (track) {
                                                allTracks.push(Math.round(track.duration_ms / 1000));
                                            });
                                            if (allTracks.length > 0) {
                                                callback(null, allTracks)
                                            } else {
                                                callback("Error downloading Spotify tracklist", null);
                                            }
                                        })
                                }
                            }, function (err, results) {
                                if (err) { console.log("getSpotify error: " + err) };
                                console.log("Results: " + JSON.stringify(results));
                                resolve(results);
                            })
                        }
                    })
                    .catch( (err) => { reject(err) });
            });
    });
};

// getSpotify();
module.exports = getSpotify;