// Get discogs function and return artist name, album name, and tracks
// NB track times need to be found separately

function getDiscogs(nameSearch, artistSearch) {

    var getSpotify = require('./getSpotify.js');
    var setDiscogs = require('../api/setDiscogs.js');

    return new Promise((resolve, reject) => {

        // Authenticate
        var Discogs = require('disconnect').Client;
        var disco = new Discogs(setDiscogs).database();
        var albumArt = [];

        // Test search data
        // var nameSearch = "tired sounds";
        // var artistSearch = "stars of the lid"

        // 1.  Look up discogs master, return master id
        disco.search( {}, {
            type: "master",
            release_title: nameSearch,
            artist: artistSearch
        })
            .then( function (results) {
                // If nothing found, return error
                if (results.pagination.items === 0) {
                    console.log("Discogs: no master version found")
                    throw new Error("No discogs master result found")
                } else {
                    // Otherwise return the first id result and any album art
                    if (results.results[[0]].cover_image !== undefined) {
                        albumArt.push(results.results[[0]].cover_image)
                    }
                    console.log("Found Discogs master with id " + results.results[[0]].id)
                    resolve(results.results[[0]].id)
                }
            })
        // 2. Look up master id to get general album info
            .then (function (discogsID) {
                console.log("Looking up id to get versions")

                return new Promise( (resolve, reject) => {
                    disco.getMaster(discogsID)
                        .then( (results) => {
                            console.log("Found master for " + results.title)

                            // Create new object to save album info
                            var discogsAlbum = {
                                name: results.title,
                                artist: results.artist[0].name,
                                tracks: results.tracklist.map( (track, index) => {
                                    return {
                                        track_name: track.title,
                                        track_length: /^\d+:\d{2}$/.test(track.duration)
                                            ? (60 * parseInt(track.duration.split(":")[0])) + parseInt(track.duration.split(":")[1])
                                            : false,
                                        track_number: index + 1,
                                        track_side: /^[A-F]\d+/.test(track.position)
                                            ? track.position[0]
                                            : false
                                    }
                                })
                            }

                            resolve(discogsAlbum)
                        })
                        .catch( (err) => {
                            reject("Error somewhere in savings album from master version: " + err);

                        })
                })
            })
        // 3. Look up versions to find vinyl info
            .then( )
        // General catch for any error?
        .catch( (err) => {
                console.log("Error in getDiscogs: " + err);
                reject(err);
            })
        // 3. Filter versions for vinyl

        // 4. Check vinyl for side info
        disco.search({}, {
            type: 'master',
            release_title: nameSearch,
            artist: artistSearch
        })
            .then(function (results) {
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
                                        track_side: /^[A-F]\d+/.test(track.position)
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

                                return new Promise((resolve, reject) => {
                                    console.log("Don't have album sides, try to get a vinyl version from Discogs")
                                    disco.getMasterVersions(id)
                                        .then((release) => {
                                            // console.log("Made it to getMasterVersions then")
                                            var findVinyl = release.versions.filter(x => /lp|LP|Vinyl|vinyl|VINYL/.test(x.format))
                                            console.log("Found " + findVinyl.length + " vinyls")

                                            if (findVinyl.length > 0) {

                                                let checkVinylNum = 1;

                                                function checkVinyl(checkVinylNum) {
                                                    return new Promise((resolve, reject) => {
                                                        console.log("Checking vinyl #" + checkVinylNum + "/" + findVinyl.length)
                                                        disco.getRelease(findVinyl[checkVinylNum - 1].id, (err, res) => {
                                                            if (err) {
                                                                console.log("Error in getRelease " + err)
                                                                reject(err);
                                                            }

                                                            // Check if every track has an album side as first letter
                                                            if (res.tracklist.every((x) => {
                                                                console.log(x.position);
                                                                return /^[A-F]/.test(x.position)
                                                            })) {
                                                                console.log("Looks like it has side info")

                                                                let minTracks = Math.min(res.tracklist.length, discogsAlbum.tracks.length);
                                                                res.tracklist.slice(0, minTracks).forEach((track, index) => {
                                                                    discogsAlbum.tracks[index].track_side = track.position[0];
                                                                    discogsAlbum.tracks[index].track_length = (discogsAlbum.tracks[index].track_length === false & /^\d+:\d{2}$/.test(track.duration))
                                                                        ? (60 * parseInt(track.duration.split(":")[0])) + parseInt(track.duration.split(":")[1])
                                                                        : discogsAlbum.tracks[index].track_length
                                                                })
                                                                console.log("Returning album with side info");
                                                                resolve(discogsAlbum);
                                                            } else {
                                                                console.log("Looks like it's missing side info")
                                                                reject();
                                                            }
                                                        })
                                                    })
                                                }

                                                checkVinyl(checkVinylNum)
                                                    .then((result) => {
                                                        console.log("Found album, returning?")
                                                        resolve(result);
                                                    })
                                                    .catch(() => {
                                                        checkVinylNum++;
                                                        if (checkVinylNum > findVinyl.length) {
                                                            console.log("Vinyl versions didn't have correct side info");
                                                            resolve(discogsAlbum);
                                                        }
                                                        checkVinyl(checkVinylNum)
                                                    })
                                            } else {
                                                console.log("No vinyl version found on Discogs");
                                                return discogsAlbum;
                                            }
                                        })
                                        .catch((err) => {
                                            console.log("Error in discogs getMasterVersions " + err)
                                            reject(err);
                                        })
                                })
                            } else {
                                console.log("looks like it's got album side");
                                return discogsAlbum
                            }

                        })
                        .then((discogsAlbum) => {
                            // Check for track lengths and side again
                            console.log(JSON.stringify(discogsAlbum))
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
                        .catch((e) => console.log("Error somewhere: " + e))
                }
            });
    });
}

module.exports = getDiscogs;
