// Get discogs function and return artist name, album name, and tracks
// NB track times need to be found separately

function getDiscogs(nameSearch, artistSearch) {

    var getSpotify = require('./getSpotify.js');
    var setDiscogs = require('../api/setDiscogs.js');

    // Define a bunch of functions?

    return new Promise((resolve, reject) => {
        // Authenticate
        var Discogs = require('disconnect').Client;
        var disco = new Discogs(setDiscogs).database();

        // Test search data
        // var nameSearch = "tired sounds";
        // var artistSearch = "stars of the lid"

        // Get master information first, then look up versions
        disco.search({}, {
            type: 'master',
            release_title: nameSearch,
            artist: artistSearch
        }).then(function (results) {
            // If nothing found, return error
            if (results.pagination.items === 0) {
                console.log("Discogs: Nothing found");
                reject("No discogs result found");
            } else {
                // Otherwise look up the resulting id to get tracklist and versions
                var id = results.results[[0]].id;
                console.log("Found a Discogs master result for " + results.results[[0]].title);

                var getTrackLength = true;
                var getTrackSide = true;
                var getAlbumArt = true;

                // Save link to cover art as well
                albumArt = results.results[[0]].cover_image !== undefined ?
                    results.results[[0]].cover_image :
                    undefined


                disco.getMaster(id)
                    .then((results) => {
                        console.log("Downloaded discogs info for " + results.title)
                        var discogsAlbum = {
                            name: results.title,
                            artist: results.artists[0].name,
                            tracks: results.tracklist.map(function (track, index) {
                                return {
                                    track_name: track.title,
                                    track_length: /^\d+:\d{2}$/.test(track.duration)
                                        ? (60 * parseInt(track.duration.split(":")[0])) + parseInt(track.duration.split(":")[1])
                                        : false,
                                    track_number: index + 1,
                                    track_side: /^[A-Z]\d+/.test(track.position)
                                        ? track.position[0]
                                        : false
                                }
                            })
                        }
                        return discogsAlbum
                    })
                    .then((discogsAlbum) => {

                        console.log("See if it's got info on album sides")
                        // Try to get album side first
                        getTrackSide = discogsAlbum.tracks.some((e) => {
                            return e.track_side === false;
                        });

                        if (getTrackSide) {
                            // console.log(id);
                            console.log("Don't have album sides, try to get a vinyl version from Discogs")
                            disco.getMasterVersions(id, function (err, res) {
                                if (err) return console.log("Error getting Discogs Versions: " + err);
                                var findVinyl = res.versions.filter(function (x) {
                                    return /lp|LP|Vinyl|vinyl|VINYL/.test(x.format)
                                });
                                console.log("Found " + findVinyl.length + " vinyls")
                                if (findVinyl.length > 0) {
                                    disco.getRelease(findVinyl[0].id)
                                        .then(function (res) {
                                            console.log("Found a vinyl match: " + res.title);
                                            let minTracks = Math.min(res.tracklist.length, discogsAlbum.tracks.length);

                                            res.tracklist.slice(0, minTracks).forEach((track, index) => {
                                                discogsAlbum.tracks[index].track_side = track.position[0];
                                                discogsAlbum.tracks[index].track_length = (discogsAlbum.tracks[index].track_length === false & /^\d+:\d{2}$/.test(track.duration))
                                                    ? (60 * parseInt(track.duration.split(":")[0])) + parseInt(track.duration.split(":")[1])
                                                    : discogsAlbum.tracks[index].track_length
                                                                })

                                                                console.log("Returning album with side info");
                                                                needVinyl = false;
                                                                resolve(discogsAlbum);
                                                            } else {
                                                                    needVinyl = true;
                                                                    checkVinyl ++;
                                                                    resolve();
                                                                }

                                                                
                                            });
                                            return discogsAlbum;
                                        })

                                } else {
                                    console.log("No vinyl version found on Discogs");
                                    return discogsAlbum;
                                }
                            })
                        } else {
                            console.log("looks like it's got album side");
                            return discogsAlbum
                        }

                    })
                    .then((discogsAlbum) => {
                        // Check for track lengths and side again
                        getTrackLength = discogsAlbum.tracks.some((e) => {
                            return e.track_length === false;
                        });
                        getTrackSide = discogsAlbum.tracks.some((e) => {
                            return e.track_side === false;
                        });
                        if (getTrackLength) {
                            console.log("Still missing track lengths, try Spotify");
                            getSpotify(discogsAlbum.name, discogsAlbum.artist)
                                .then((res) => {
                                    albumArt = res.albumArt;
                                    let minTracks = Math.min(res.trackList.length, discogsAlbum.tracks.length);
                                    res.trackList.slice(0, minTracks).forEach((x, i) => {
                                        discogsAlbum.tracks[i].track_length = x;
                                        if (i + 1 === minTracks) {
                                            resolve({
                                                album: discogsAlbum,
                                                albumArt: albumArt
                                            });
                                        }
                                    })
                                })
                                .catch((err) => {
                                    console.log("Spotify error: " + err);
                                    // So still missing track lengths?
                                    // Try getting it from a discogs cd
                                    disco.getMasterVersions(id, { pages: 1, per_page: 5 })
                                        .then((res) => {
                                            var discogsCD = res.versions.filter(function (x) {
                                                return /CD|cd|Album/.test(x.format)
                                            });
                                            if (discogsCD.length > 0) {
                                                console.log("Trying discogs CD results");
                                                discogsCD.forEach((cd) => {
                                                    console.log("Trying a cd");
                                                    console.log(getTrackLength);
                                                    if (getTrackLength) {
                                                        disco.getRelease(cd.id)
                                                            .then((cd) => {
                                                                // console.log(cd);
                                                                if (cd.tracklist.every((y) => {
                                                                    return /^\d+:\d{2}$/.test(y.duration);
                                                                })) {
                                                                    console.log("Found one with track length!")
                                                                    getTrackLength = false;
                                                                    let minTracks = Math.min(cd.tracklist.length, discogsAlbum.tracks.length);
                                                                    cd.tracklist.slice(0, minTracks).forEach((x, i) => {
                                                                        discogsAlbum.tracks[i].track_length = (60 * parseInt(x.duration.split(":")[0])) + parseInt(x.duration.split(":")[1])
                                                                        if (i + 1 === minTracks) {
                                                                            // console.log(discogsAlbum);
                                                                            resolve({
                                                                                album: discogsAlbum,
                                                                                albumArt: albumArt
                                                                            })
                                                                        }
                                                                    });
                                                                } 
                                                            })

                                                    }

                                                })
                                            }
                                        })
                                });
                        } else {
                            resolve({
                                album: discogsAlbum,
                                albumArt: albumArt
                            });
                        }
                    })
            }
        });
    });
}

module.exports = getDiscogs;
