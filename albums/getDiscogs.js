// Get discogs function and return artist name, album name, and tracks
// NB track times need to be found separately

function getDiscogs(nameSearch, artistSearch) {

    // return new Promise((resolve, reject) => {
        // Authenticate
        var Discogs = require('disconnect').Client;
        var disco = new Discogs({
            consumerKey: 'tntYcZOONAfknUxUXTzu',
            consumerSecret: 'YEOiVPFsvtpIfuZoGzFvEgOXFOmoiZEf'
        }).database();

        // Test search data
        // var nameSearch = "pulsar";
        // var artistSearch = "almunia"

        // Get master information first, then look up versions
        disco.search( {}, {
            type: 'master',
            release_title: nameSearch,
            artist: artistSearch
        }).then(function(results) {
            console.log(results.results[0]  )
            // If nothing found, return error
            if (results.pagination.items === 0) {
                console.log("Discogs: Nothing found");
                reject("No discogs result found");
            } else {
                // Otherwise look up the resulting id to get tracklist and versions
                var id = results.results[[0]].id;

                // Save link to cover art as well
                var albumArt = results.results[[0]].cover_image;
            }
        })
}
        //
        // disco.search({}, {
        //     type: 'release',
        //     format: 'lp|vinyl',
        //     release_title: nameSearch,
        //     artist: artistSearch,
        //     per_page: 1
        // })
        //     .then(function (results) {
        //         // console.log("Total Discogs results: " + JSON.stringify(results.results, null, 2));
        //         // console.log("Number of Discogs results found " + results.pagination.items)

        //         // If nothing found
        //         if (results.pagination.items === 0) {
        //             console.log("Discogs: Nothing found")
        //             reject(new Error("No Discogs result found"));
        //         } else {
        //             // Otherwise look up the results id to get tracklist
        //             disco.getRelease(results.results[[0]].id, function (err, release) {
        //                 if (err) { reject(err) }

        //                 // console.log("Specific album info from Discogs: " + JSON.stringify(release, null, 2));
        //                 console.log("Found Discogs info for " + release.title + " with " + release.tracklist.length + " tracks: " + release.uri)
        //                 var newAlbum = {
        //                     artist: release.artists[[0]].name,
        //                     name: release.title,
        //                     tracks: []
        //                 };

        //                 release.tracklist.forEach(function (i, j) {
        //                     // console.log("Track info: " + JSON.stringify(i));
        //                     // console.log("Index num: " + j); 
        //                     newAlbum.tracks.push({
        //                         // NB Index starts at 0 so need to add 1
        //                         track_number: j + 1,
        //                         track_name: i.title,
        //                         track_side: i.position[[0]]
        //                     });
        //                 });
        //                 // console.log(newAlbum)
        //                 resolve(newAlbum);
        //             })
        //         }
        //     })
        //     .catch((err) => {
        //         console.log("Error in discogs results somewhere: " + err);
        //         reject(err);
        //     })
        // }
getDiscogs();
module.exports = getDiscogs;
