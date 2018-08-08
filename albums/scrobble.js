// Download a record and scrobble
// Need to pick a record and a side

var mongoose = require('mongoose');
var Record = require('./models/records');
var LastfmAPI = require('lastfmapi');

// API details, hopefully shouldn't change
var lfm = new LastfmAPI({
    'api_key': "2b33f35453cb09a69b70482d76d1de6d",
    'secret': "4fd051c2ae080e61918e273fadd7ee78"
});

// Username details for me, hopefully will be valid for a while.
lfm.setSessionCredentials('tomcopple', '1w3twRRMHLf3PmMq4u9B3TNu6BzdRTxN');
// lfm.setSessionCredentials('tomtesting', 'NyQ653IeE0KmNysNHGqZlXZqDhJ_upfE')

// Connect to DB
var mongoDB = 'mongodb://scrobblr:scrobblr01@ds131711.mlab.com:31711/my_records';
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
    console.log("Connected!");
})

function scrobble(searchText, side) {
    var currentTime = Math.floor((new Date()).getTime() / 1000)

    Record.findOne({
        $text: {
            $search: searchText
        }
        // name: 'Ctrl',
        // artist: 'SZA'
    }, function(err, result) {
        if(err) return console.error(err);
        var scrobbles = [];
        var artist = result.artist;
        var album = result.name;
        result.tracks.map(function(x) {
            if(x.track_side == side) {
                scrobbles.push({
                    artist: artist,
                    album: album,
                    track: x.track_name,
                    trackNumber: x.track_number + 1,
                    duration: x.track_length,
                    timestamp: currentTime
                });
                currentTime = currentTime + x.track_length
            }
        })
        console.log(scrobbles);
        lfm.track.scrobble(scrobbles, function(err, nowPlaying) {
            if(err) return console.error(err);
            console.log(nowPlaying);
        });
    })
};

scrobble("sza", side = "D")