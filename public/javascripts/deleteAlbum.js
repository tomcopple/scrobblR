function deleteAlbum(album) {

    Swal({
        title: 'Are you sure you want to delete this album?',
        showCancelButton: true,
        type: 'warning',
        confirmButtonText: 'Yes!'

    })
    .then( (result) => {
        console.log(result.value);
        if(result.value) {
            // Remove "edit" from the end of url and replace with delete
            var url = window.location.href.slice(0, -4) + "delete"
            console.log(url);
            console.log(album)
            $.post(url, {
                name: album.name,
                artist: album.artist
            })
            //-                     console.log(url);
            //-                     //- $.post(url)
        }
    })
}