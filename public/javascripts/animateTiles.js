var timer = 1000;
$(document).ready(function() {
    $(".albumTiles").each(function() {
        $(this).animate({
            opacity: 1,
        }, {
            duration: timer
        });
        timer = timer + 100;
    })
})
