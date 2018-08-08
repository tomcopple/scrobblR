// Catalogue
var express = require('express');
var router = express.Router();

// Require controller modules.
var album_controller = require('../controllers/albumController');
var artist_controller = require('../controllers/artistController');

/// ALBUM ROUTES ///

// GET catalog home page.
router.get('/', album_controller.index);

// GET request for creating a album. NOTE This must come before routes that display album (uses id).
router.get('/album/create', album_controller.album_create_get);

// POST request for creating album.
router.post('/album/create', album_controller.album_create_post);

// POST request to add album to database
router.post('/addAlbum', album_controller.addAlbum);

// GET request to delete album.
// router.get('/album/:id/delete', album_controller.album_delete_get);

// POST request to delete album.
router.post('/album/:id/delete', album_controller.album_delete_post);

// GET request to update album.
router.get('/album/:id/edit', album_controller.album_update_get);
router.get('/album/:id/reset', album_controller.album_reset);

// POST request to update album.
router.post('/album/:id/edit', album_controller.album_update_post);
router.post('/album/:id/reset', album_controller.album_reset);

// GET request for one album.
router.get('/album/:id', album_controller.album_detail);

// GET request for list of all album items.
router.get('/albums', album_controller.album_list);

// Receive scrobble request from front-end
router.post('/album/:id/*scrobble', album_controller.album_scrobble);


// GET request for one artist.
router.get('/artist/:id', artist_controller.artist_detail);

// GET request for list of all artists.
router.get('/artists', artist_controller.artist_list);

module.exports = router;