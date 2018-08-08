function pickSide(album) {

    // console.log(album)
    var sides = album.tracks.map(a => a.track_side)
    sides = [...new Set(sides)]

    // Need an object where the key and value are both the Side
    // Probably a better way of doing this. 
    var sidesObj = new Object({});
    sides.forEach( (value) => {
        sidesObj[value] = value;
    })

    // Not sure about this, but seems to work. 
    var inputOptions = new Promise(function(resolve, reject) {
        resolve(
            sidesObj
        );
    });

    Swal({
        title: 'Select side',
        input: 'radio',
        showCancelButton: true,
        inputOptions: inputOptions,
        inputValidator: (result) => {
            return new Promise(function(resolve, reject) {
                if(result) {
                    resolve();
                } else {
                    reject('You need to pick a side!')
                }
            })
        }
    })
    .then( (result) => {
        console.log(result.value);
        Swal("Success! Now scrobbling Side " + result.value)

        var url = window.location.href + "/scrobble";
        // Need to send the side back to the front end?
        $.post(url, { side: result.value })
    })

}