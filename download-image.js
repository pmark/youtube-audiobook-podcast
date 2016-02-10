var fs = require('fs'),
request = require('request');

module.exports = download;
function download(uri, filename, callback) {
	return new Promise(function(resolve, reject) {

		request.head(uri, function(err, res, body) {

			// console.log('content-type:', res.headers['content-type']);
			// console.log('content-length:', res.headers['content-length']);

			var r = request(uri).pipe(fs.createWriteStream(filename));
			r.on('close', function() {
				resolve();
			});
		});
	});
};

// download('https://www.google.com/images/srpr/logo3w.png', 'google.png')
// .then(function() {
// 	console.log('Done downloading..');
// });