// Another function to get data based on a discogs id



function getDiscogsId(discogsId) {
    // var setDiscogs = require('../api/setDiscogs');
    var Discogs = require('disconnect').Client;
    var disco = new Discogs({
        consumerKey: process.env.consumerKey,
        consumerSecret: process.env.consumerSecret
    }).database();

    // Set some flags for info required
    var artistName = "";
    var albumName = "";
    // var getAlbumArt = true;

    return new Promise((resolve, reject) => {
        // (1) Get Discogs Master Info
        function getDiscogsMaster(discogsId) {

            return new Promise((resolve, reject) => {
                var id = discogsId;
                disco.getRelease(id)
                    .then((results) => {
                        console.log("Downloaded discogs info for " + results.title + " by " + results.artists[0].name);
                        // console.log(results);
                        artistName = results.artists[0].name;
                        albumName = results.title;
                        var newAlbum = {
                            name: albumName,
                            artist: artistName,
                            tracks: results.tracklist.map((track, index) => {
                                return {
                                    track_name: track.title,
                                    track_length: /^\d+:\d{2}$/.test(track.duration) ?
                                        (60 * parseInt(track.duration.split(":")[0])) + parseInt(track.duration.split(":")[1]) :
                                        undefined,
                                    track_number: index + 1,
                                    track_side: /^[A-Z].*\d+$/.test(track.position) ?
                                        track.position[0] :
                                        undefined
                                }
                            }),
                            id: id,
                            albumArt: [...new Set(results.images.map(i => i.resource_url))].slice(0, 4)

                        }
                        // if (results.images[[0]].resource_url !== undefined) {
                        //     newAlbum.albumArt.push(results.images[0].resource_url)
                        // }
                        resolve(newAlbum);
                    })
                    .catch( (e) => {
                        console.log("Truing to catch error here: " + e)
                        reject(e);
                    });
            })
            .catch( (e) => {
                console.log("Or here? " + e)
                reject(e);
            });
        };

        
        // (3) Get track times and album art from Spotify
        // NB Spotify is preferred artwork, so unshift() rather than push()
        // Only call this function if(getTrackLength)
        function getSpotify(newAlbum) {
            console.log("Getting Spotify");

            return new Promise((resolve, reject) => {
                // var setSpotify = require("../api/setSpotify");
                var SpotifyWebApi = require('spotify-web-api-node');
                var spotifyApi = new SpotifyWebApi({
                    clientId: process.env.clientId,
                    clientSecret: process.env.clientSecret
                });

                spotifyApi
                    .clientCredentialsGrant()
                    .then((data) => {
                        spotifyApi.setAccessToken(data.body['access_token']);
                        spotifyApi.searchAlbums("album:" + albumName + " artist:" + artistName, { limit: 1 })
                            .then((results) => {
                                // console.log("Spotify results: " + JSON.stringify(results.body.albums.items[0], null, 2));
                                console.log("Spotify results length: " + results.body.albums.items.length)
                                if (results.body.albums.items.length === undefined | results.body.albums.items.length === 0) {
                                    console.log("No Spotify album found");
                                    reject("No Spotify result");
                                } else {
                                    const result = results.body.albums.items[0];
                                    console.log("Found Spotify album " + result.name);

                                    if (result.images.filter(x => x.height === 300).length > 0) {
                                        let image = result.images.filter(x => x.height === 300)
                                        newAlbum.albumArt.unshift(image[0].url)
                                    }

                                    spotifyApi
                                        .getAlbumTracks(result.id)
                                        .then((results) => {
                                            console.log("Found Spotify info for " + result.name + " with " + results.body.items.length + " tracks");
                                            let minTracks = Math.min(newAlbum.tracks.length, results.body.items.length)
                                            newAlbum.tracks = newAlbum.tracks.slice(0, minTracks);
                                            results.body.items
                                                .slice(0, minTracks)
                                                .forEach((track, index) => {
                                                    // console.log(track);
                                                    newAlbum.tracks[index].track_length = newAlbum.tracks[index].track_length === undefined ?
                                                        Math.round(track.duration_ms / 1000) :
                                                        newAlbum.tracks[index].track_length;
                                                    newAlbum.tracks[index].track_name = track.name
                                                    // console.log(index + ": " + newAlbum.tracks[index].track_name + ": " + newAlbum.tracks[index].track_length);
                                                    if(index === minTracks - 1) { return(resolve(newAlbum))}
                                                });
                                        })
                                }
                            });
                    })
                    .catch( (err) => {
                        // console.log("Error in SpotifyApi function: " + err);
                        resolve(newAlbum);
                    })
            });
        }

        // Get Discogs master info
        getDiscogsMaster(discogsId)
            .then((newAlbum) => {
                console.log("Moving on to stage 2")
                getSpotify(newAlbum)
                    .then((res) => resolve(res))
                    .catch((e) => {
                        console.log("Error in getSpotify: " + e);
                        resolve(newAlbum)
                    })
                
                })
                .catch((e) => {
                    console.log("Error in getDiscogsVinyl");
                    reject("Discogs error");
                })
            });
}

module.exports = getDiscogsId;