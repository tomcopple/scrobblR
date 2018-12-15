// Master function to get album information:
// Stages: (1) Get discogs master info, 
//         (2) Look for vinyl version 
//         (3) Get tracktimes from Spotify, maybe album artwork
//         (4) If still missing anything, look through disogs cd results
// Each helper function returns a new promise so they can be chained with then?
// Or does just the first one need to then everything else just returns a value?
// Shouldn't be any need for callbacks?
// Define functions here first, then move to their own files for simplicity. 

function getAlbumData(albumName, artistName) {

    var setDiscogs = require('../api/setDiscogs');
    var Discogs = require('disconnect').Client;
    var disco = new Discogs(setDiscogs).database();

    // Set some flags for info required
    var getTrackLength = true;
    var getTrackSide = true;
    // var getAlbumArt = true;

    return new Promise((resolve, reject) => {
        // (1) Get Discogs Master Info
        function getDiscogsMaster(albumName, artistName) {

            return new Promise((resolve, reject) => {
                disco.search({}, {
                    type: 'master',
                    release_title: albumName,
                    artist: artistName
                }).then((results) => {
                    if (results.pagination.items === 0) {
                        // If no album found in Discogs, then abandon the whole thing
                        console.log("Discogs: nothing found, giving up.")
                        throw "No discogs master found"
                    } else {
                        // Just take the first result
                        const result = results.results[[0]]

                        var id = result.id;
                        console.log("Found a discogs master result for " + results.results[[0]].title);
                        console.log(results.results)

                        // If there's master album art save
                        var albumArt = result.cover_image !== undefined ?
                            result.cover_image :
                            undefined

                        disco.getMaster(id)
                            .then((results) => {
                                console.log("Downloaded discogs info for " + results.title)
                                var newAlbum = {
                                    name: results.title,
                                    artist: results.artists[0].name,
                                    tracks: results.tracklist.map((track, index) => {
                                        return {
                                            track_name: track.title,
                                            track_length: /^\d+:\d{2}$/.test(track.duration) ?
                                                (60 * parseInt(track.duration.split(":")[0])) + parseInt(track.duration.split(":")[1]) :
                                                undefined,
                                            track_number: index + 1,
                                            track_side: /^[A-Z]\d+$/.test(track.position) ?
                                                track.position[0] :
                                                undefined
                                        }
                                    }),
                                    id: id,
                                    albumArt: [albumArt]
                                }
                                resolve(newAlbum);
                            })
                    }
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

        // (2) Look for vinyl version
        function getDiscogsVinyl(newAlbum) {

            return new Promise((resolve, reject) => {

                console.log("Don't have vinyl info yet, looking up vinyl version");

                // This promise doesn't seem to work, use callback instead
                disco.getMasterVersions(newAlbum.id)
                    .then((results) => {
                        console.log("Found " + results.pagination.items + " results");
                        var findVinyl = results.versions.filter((x) => {
                            return /lp|LP|Vinyl|vinyl|VINYL/.test(x.format)
                        })
                        console.log("Found " + findVinyl.length + (findVinyl.length === 1 ? " vinyl" : " vinyls"));
                        if (findVinyl.length > 0) {
                            disco.getRelease(findVinyl[0].id)
                                .then((res) => {
                                    console.log("Found a vinyl match: " + res.title);
                                    // Check for album art
                                    if (res.images[[0]].resource_url !== undefined) {
                                        newAlbum.albumArt.push(res.images[0].resource_url)
                                    }

                                    // Always take the version with the fewest tracks to avoid bonus tracks etc
                                    let minTracks = Math.min(res.tracklist.length, newAlbum.tracks.length);
                                    newAlbum.tracks = newAlbum.tracks.slice(0, minTracks);
                                    res.tracklist
                                        .slice(0, minTracks)
                                        .forEach((track, index) => {
                                            newAlbum.tracks[index].track_side = /^[A-Z]\d+$/.test(track.position) ?
                                                track.position[0] :
                                                undefined,
                                            newAlbum.tracks[index].track_length = (newAlbum.tracks[index].track_length === undefined & /^\d+:\d{2}$/.test(track.duration)) ?
                                                (60 * parseInt(track.duration.split(":")[0])) + parseInt(track.duration.split(":")[1]) :
                                                undefined
                                            newAlbum.tracks[index].track_name = track.title
                                        });
                                    resolve(newAlbum);
                                })
                        } else {
                            console.log("No vinyl version found on Discogs");
                            reject("No vinyl version found");
                        }
                    })
                    .catch((err) => {
                        console.log("Error in disco.getMasterVersions: " + err);
                    })
            })
        }

        // (3) Get track times and album art from Spotify
        // NB Spotify is preferred artwork, so unshift() rather than push()
        // Only call this function if(getTrackLength)
        function getSpotify(newAlbum) {
            console.log("Getting Spotify");

            return new Promise((resolve, reject) => {
                var setSpotify = require("../api/setSpotify");
                var SpotifyWebApi = require('spotify-web-api-node');
                var spotifyApi = new SpotifyWebApi(setSpotify);

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
                        console.log("Error in SpotifyApi function: " + err);
                        resolve(newAlbum);
                    })
            });
        }

        // Get Discogs master info
        getDiscogsMaster(albumName, artistName)
            .then((newAlbum) => {
                console.log("Moving on to stage 2")
                getTrackLength = newAlbum.tracks.some((e) => {
                    return e.track_length === undefined;
                });
                getTrackSide = newAlbum.tracks.some((e) => {
                    return e.track_side === undefined;
                });

                if (getTrackSide) {
                    console.log("Need to get Track Side")
                    getDiscogsVinyl(newAlbum)
                        .then((newAlbum) => {
                            getTrackLength = newAlbum.tracks.some((e) => {
                                return e.track_length === undefined;
                            });

                            if (getTrackLength) {
                                getSpotify(newAlbum)
                                    .then((res) => resolve(res))
                                    .catch((e) => {
                                        console.log("Error in getSpotify: " + e);
                                        resolve(newAlbum)
                                    })
                            }
                        })
                        .catch((e) => {
                            console.log("Error in getDiscogsVinyl");
                            reject("Discogs error");
                        })
                } else {
                    console.log("Don't need to get vinyl info")
                    getSpotify(newAlbum)
                    .then((res) => resolve(res))
                    .catch((e) => {
                        console.log("Error in getSpotify: " + e);
                        resolve(newAlbum);
                    });
                    
                }
            })
    });

}
// getAlbumData('boys and girls', 'alabama shakes')
module.exports = getAlbumData;