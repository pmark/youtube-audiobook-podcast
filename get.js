var youtubeStream = require('youtube-audio-stream')
var fs = require('fs');

if (process.argv.length < 4) {
	console.log("Missing 2 arguments: video ID and output file name")
	process.exit();
}

var videoId = process.argv[2]
var fileName = process.argv[3]

var getAudio = function() {

	var requestUrl = 'http://youtube.com/watch?v=' + videoId;
	var writeStream = fs.createWriteStream(fileName + '.mp3', { flags : 'w' });

	writeStream.on('data', function () {
		console.log('.');
	});

	writeStream.on('close', function () {
		console.log('All done!');
	});

	try {
		youtubeStream(requestUrl).pipe(writeStream);
	} catch(exception) {
		res.status(500).send(exception);
	}

}()

