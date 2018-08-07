// Another attempt to get populate working
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const ArtistSchema = Schema({
    _id: Schema.Types.ObjectId,
    artistName: { type: String, required: true},
    albums: [{
        type: Schema.Types.ObjectId,
        ref: 'Album'
    }]
});

const AlbumSchema = Schema({
    albumName: { type: String, required: true },
    artistName: {
        type: Schema.Types.ObjectId,
        ref: 'Artist'
    },
    tracks: [{
        track_number: Number,
        track_name: String,
        track_length: Number,
        track_side: String
    }]
});

AlbumSchema.index({
    artistName: 'text',
    albumName: 'text'
});
ArtistSchema.index({
    artistName: 'text'
})

AlbumSchema
.virtual('url')
.get(function() {
    return '/catalog/album/' + this._id;
});

ArtistSchema
.virtual('url')
.get(function() {
    return '/catalog/artist/' + this._id;
})
const Album = mongoose.model('Album', AlbumSchema, 'albums');
const Artist = mongoose.model('Artist', ArtistSchema, 'artists');


// Test uploading a new album
var mongoDB = 'mongodb://scrobblr:scrobblr01@ds131711.mlab.com:31711/my_records';
mongoose.connect(mongoDB, { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
    console.log("Connected!");

    var testObject = {
        objectArtist: "object artist",
        objectAlbumName: "object album name",
        objectAlbumTracks: [
            {
                track_number: 1,
                track_name: "object track 1",
                track_length: 123,
                track_side: "A"
            }, {
                track_number: 2,
                track_name: "object track 2",
                track_length: 123,
                track_side: "B"
            }
        ]
    };

    Artist.find({
        artistName: testObject.objectArtist
    }, {
        artistName: 1
    }, function(err, result) {
        if(err) console.error(err);

        console.log(result);
        console.log(result.length)

        if(result.length == 0) {
            console.log("Test artist is " + testObject.objectArtist)
            var testArtist = new Artist({
                _id: new mongoose.Types.ObjectId(),
                artistName: testObject.objectArtist
            });

            testArtist.save(function(err) {
                if(err) console.error(err);

                console.log("Test album is " + testObject.objectAlbumName)
                console.log("Test album is " + testArtist.artistName);

                var testAlbum = new Album({
                    albumName: testObject.objectAlbumName,
                    tracks: testObject.objectAlbumTracks,
                    artistName: testArtist._id
                })

                testAlbum.save(function(err) {
                    if(err) console.error(err);
                })

            })
        } else {
            console.log("Already exists?")
        }

        


    }).then(function(err) {
        if(err) console.error(err) 
        Album.
        findOne({ albumName: 'object album name' }).
        populate('artistName').
        exec(function(err, album) {
            console.log(album)
            // if(err) console.error(err)
            // console.log(err);
            // console.log("Artist should be " + album.artistName.artistName)
        })
    })
    
    
    // var testAlbum = new Album({
    //     albumName: 'test album',
    //     tracks: [{ track_number: 1, track_name: 'test name', track_length: 54321, track_side: "A"}]
    // });

    // testAlbum.save(function(err) {
    //     if(err) { console.error(err) }

    //     var testArtist = new Artist({
    //         artistName: 'test artist'
    //     });

    //     testArtist.save(function(err) {
    //         if(err) { console.error(err) }

    //         Artist.populate(testArtist, { path: "artistName"}, function(err, artist) {
    //             if(err) { console.error(err) }
    //             // console.log(artist.artistName, artist.albums)
    //         })
    //     })


    // })
})







module.exports = {
    Album, Artist
}
