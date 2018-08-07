// Lastfm authentication: shouldn't need to do this more than once
var LastfmAPI = require('lastfmapi');

// API details, hopefully shouldn't change
var lfm = new LastfmAPI({
    'api_key': "2b33f35453cb09a69b70482d76d1de6d",
    'secret': "4fd051c2ae080e61918e273fadd7ee78"
});

// If user details need refreshing, follow this link:
// var authUrl = lfm.getAuthenticationUrl({ 'cb' : 'http://example.com/auth' });
// console.log(authUrl);

// Click on the link in the console, then copy the token at the end of the redirect url
// var redirectUrl = 'wcidEMZ8oQehcZDDnVYlZhKtGblTFUjL'
// lfm.authenticate(redirectUrl, function (err, session) {
// 	if (err) { return console.error(err); }
// 	console.log(session); // {"name": "LASTFM_USERNAME", "key": "THE_USER_SESSION_KEY"}
// });

// Username details for me, hopefully will be valid for a while.
// lfm.setSessionCredentials('tomcopple', '1w3twRRMHLf3PmMq4u9B3TNu6BzdRTxN');
// lfm.setSessionCredentials('tomtesting', 'NyQ653IeE0KmNysNHGqZlXZqDhJ_upfE')


