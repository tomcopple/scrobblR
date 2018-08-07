var timer = 1000;
$(document).ready(function() {
    $(".albumTiles").each(function(x) {
        $(this).animate({
            opacity: 1,
        }, {
            duration: timer
        });
        timer = timer + 500;
    })
})



// var getAlbumtiles = document.getElementsByClassName('albumTiles');
// var albumtiles = Array.prototype.map.call(getAlbumtiles, function(x) {
//     console.log(x);
//     return x;
// })
// console.log(albumtiles);

// var timer = 1;

// albumtiles.forEach(function(x) {

//     x.style["-webkit-transition: opacity " + timer + "s ease-in"];
//     x.style["-mox-transition: opacity " + timer + "s ease-in"];
//     x.style["-ms-transition: opacity " + timer + "s ease-in"];
//     x.style["-o-transition: opacity " + timer + "s ease-in"];
//     x.style["transition: opacity " + timer + "s ease-in"];
//     x.classList.add('load');
    
//     timer = timer + 0.5;
// })

// var classes = document.getElementsByClassName("klass"); // Do not use a period here!
// var values = Array.prototype.map.call(classes, function(el) {
//     return el.value;
// });
