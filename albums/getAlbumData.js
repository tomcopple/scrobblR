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

    // Import modules and set authenticaion
    // 1. Discogs
    var Discogs = require('disconnect').Client;
    var discogsAuth = {
        consumerKey: process.env.consumerKey,
        consumerSecret: process.env.consumerSecret
    }
    var disco = new Discogs(discogsAuth).database();


    // 2. Spotify
    var SpotifyWebApi = require('spotify-web-api-node');
    var spotifyAuth = {
        clientId: process.env.clientId,
        clientSecret: process.env.clientSecret
    }
    // Every time you find album art push it here
    var albumArt = [];

    // Function (1): get Discogs Master ID
    function getDiscogsMasterID(searchAlbum, searchArtist) {
        return new Promise( (resolve, reject) => {
            disco.search({}, {
                type: 'master',
                release_title: searchAlbum,
                artist: searchArtist
            }).then( (results) => {

                // If no results
                if (results.pagination.items === 0) {
                    console.log("No discogs result at all")
                    reject(new Error("No discogs master found"))
                } else {
                   // Otherwise take the first result 
                   const result = results.results[[0]]
                   const id = result.id;
                   console.log("Found a discogs master result for " + result.title);

                   // If there's any master album art save it
                   if (result.cover_image !== undefined) {
                       albumArt.push(result.cover_image)
                   }
                   console.log("Returning id: " + id);

                   resolve(id);
                }
            })
        })
    }

    // Function (2): Lookup Master ID and return Album Model
    function getDiscogsAlbum(id) {
        return new Promise( (resolve, reject) => {
            disco.getMaster(id)
                .then( (results) => {
                    console.log("Downloaded discogs master info for " + results.title)

                    // save any album art
                    
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
                        albumArt: albumArt
                    }
                    resolve(newAlbum);
                })
            });
    }

    // Function (3): Look for vinyl versions
    // Takes newAlbum as parameter and returns newAlbum
    function getDiscogsVinyl(newAlbum) {

        return new Promise((resolve, reject) => {

            console.log("Looking up vinyl version");

            // This promise doesn't seem to work, use callback instead
            disco.getMasterVersions(newAlbum.id)
                .then((results) => {
                    console.log("Found " + results.pagination.items + " results");
                    var findVinyl = results.versions.filter((x) => {
                        return /lp|LP|Vinyl|vinyl|VINYL/.test(x.format)
                    })
                    console.log("Found " + findVinyl.length + (findVinyl.length === 1 ? " vinyl" : " vinyls"));
                    if (findVinyl.length > 0) {
                        
                        let checkVinylNum = 1;

                        // Define function to check vinyl release for side info
                        function checkVinyl(checkVinylNum) {
                            
                            return new Promise( (resolve, reject) => {
                                console.log("Checking vinyl #" + checkVinylNum + "/" + findVinyl.length)
                                return disco.getRelease(findVinyl[checkVinylNum - 1].id, (err, res) => {
                                    if (err) {
                                        console.log("Error in getRelease: " + err)
                                        reject(err);
                                    }

                                    // Check that every track has an album side as first letter
                                    if (res.tracklist.every( (x) => {
                                        // console.log(x.position);
                                        return /^[A-F]/.test(x.position)
                                    })) {
                                        console.log("Looks like it has side info")
                                        let minTracks = Math.min(res.tracklist.length, newAlbum.tracks.length);
                                        res.tracklist.slice(0, minTracks).forEach((track, index) => {
                                            newAlbum.tracks[index].track_side = track.position[0];
                                            newAlbum.tracks[index].track_length = (newAlbum.tracks[index].track_length === false & /^\d+:\d{2}$/.test(track.duration))
                                                ? (60 * parseInt(track.duration.split(":")[0])) + parseInt(track.duration.split(":")[1])
                                                : newAlbum.tracks[index].track_length
                                        })
                                        console.log("Returning album with side info");
                                        resolve(newAlbum);
                                    } else {
                                        checkVinylNum++;
                                        console.log("Checking next one")
                                        if (checkVinylNum > findVinyl.length) {
                                            console.log("Vinyl versions didn't have correct side info");
                                            resolve(discogsAlbum);
                                        }
                                        checkVinyl(checkVinylNum)
                                    }
                                })
                            })
                        }

                        checkVinyl(checkVinylNum)
                            .then( (result) => {
                                console.log("Finished checking vinyl, returning")
                                resolve(result);
                            })
                            .catch((err) => {
                                console.log("Error in checkVinyl: " + err)
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

    function getSpotify(newAlbum) {
        console.log("Getting Spotify");

        return new Promise( (resolve, reject) => {
            var spotifyApi = new SpotifyWebApi(spotifyAuth);
            spotifyApi
            .clientCredentialsGrant()
            .then( (data) => {
                spotifyApi.setAccessToken(data.body['access_token']);
                spotifyApi.searchAlbums("album:" + albumName + " artist:" + artistName, { limit: 1 })
                .then( (results) => {
                    // console.log("Found " + results.body.albums.items.length + " Spotify results");
                    if (results.body.albums.items.length === undefined | results.body.albums.items.length === 0) {
                        console.log("No spotify album found");
                        reject(new Error('No Spotify results'));
                    } else {
                        const result = results.body.albums.items[0];
                        console.log("Found Spotify album " + result.name);

                        // Add image to front of newAlbum.albumArt
                        if (result.images.filter(x => x.height === 300).length > 0) {
                            let image = result.images.filter(x => x.height === 300)
                            console.log(JSON.stringify(image));
                            newAlbum.albumArt.unshift(image[0].url)
                        }

                        // Then look for album tracks
                        spotifyApi
                        .getAlbumTracks(result.id)
                        .then( (results) => {
                            console.log("Found Spotify tracks info for " + result.name + " with " + results.body.items.length + " tracks");
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
                                if(index === minTracks - 1) { 
                                    console.log("Returning from Spotify track search")
                                    resolve(newAlbum)}
                            });
                        })
                    }
                })
            })
        })
    }

    var albumArt = [];
    // var getAlbumArt = true;

    return new Promise((resolve, reject) => {
        
        // Get Discogs master info
        getDiscogsMasterID(albumName, artistName)
            .then( (id) => {
                getDiscogsAlbum(id)
                .then( (newAlbum) => {
                    getDiscogsVinyl(newAlbum)
                    .then( (newAlbum) => {
                        getSpotify(newAlbum)
                        .then( (newAlbum) => {
                            resolve(newAlbum)
                        })
                    })
                })
             })
            .catch( (e) => {
                reject(e)
            })
        });      
    }
// getAlbumData('boys and girls', 'alabama shakes')
module.exports = getAlbumData;