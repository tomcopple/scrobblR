var Discogs = require('disconnect').Client;

var disco = new Discogs({
    consumerKey: 'tntYcZOONAfknUxUXTzu',
    consumerSecret: 'YEOiVPFsvtpIfuZoGzFvEgOXFOmoiZEf'
}).database();

disco.getImage("https://img.discogs.com/7oDYysGEhKzinpWD6NlLvvVR3go=/fit-in/300x300/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-4573877-1397491376-5799.jpeg.jpg",
function(err, data) {
    require('fs').writeFile('./test.jpg', data, 'binary', function(err) {
        console.log("image saves")
    })
})
// getRelease(176126, function(err, data){
// 	var url = data.images[0].resource_url;
// 	db.getImage(url, function(err, data, rateLimit){
// 		// Data contains the raw binary image data
// 		require('fs').writeFile('/tmp/image.jpg', data, 'binary', function(err){
// 			console.log('Image saved!');
// 		});
// 	});
// });