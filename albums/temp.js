var Discogs = require('disconnect').Client;
    var discogsAuth = {
        consumerKey: process.env.consumerKey,
        consumerSecret: process.env.consumerSecret
    }
    var disco = new Discogs(discogsAuth).database();

    disco.getMaster(209707).then( (res) => {console.log(res)})