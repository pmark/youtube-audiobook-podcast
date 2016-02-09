// given a youtube video ID
// downloads video from youtube
// converts to mp3 file
// splits mp3 into multiple hour long chunks
// uploads to s3
// create and upload a podcast XML file


var saveVideoToMP3 = require('./youtube-audio-stream')
var chunkify = require('./chunkify')

if (process.argv.length < 3) {
	console.log("Missing argument: youtube video ID")
	process.exit();
}

var videoId = process.argv[2]
var videoURL = 'https://www.youtube.com/watch?v=' + videoId;

saveVideoToMP3(videoURL)
.then(chunkify)
.catch(function(err) {
	console.log('Error:', err);
});	
