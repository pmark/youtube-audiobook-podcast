// given a youtube video ID
// downloads video from youtube
// converts to mp3 file
// splits mp3 into multiple hour long chunks
// uploads to s3
// create and upload a podcast XML file


var path = require('path');
var getNextPlaylistVideo = require('./youtube-playlist');
var saveVideoToMP3 = require('./youtube-audio-stream');
var chunkify = require('./chunkify');
var generateRSS = require('./generate-rss');
var generateHTML = require('./generate-html');
var S3 = require('./s3');
var fs = require('fs');
var combinePodcasts = require('./combine-podcasts');
var Constants = require('./constants');

var publishedPodcasts = null;
var newPodcast = {};
var mp3FilePath = process.argv[2];

getNextPlaylistVideo()
.then((data) => {
	publishedPodcasts = data.publishedPodcasts;

	if (mp3FilePath) {
		newPodcast.slug = path.basename(mp3FilePath, '.mp3');
		return mp3FilePath;
	}
	else {
		newPodcast.slug = data.nextUnpublishedVideoSlug;

		if (!newPodcast.slug) {
			throw new Error('Nothing to do.');
		}

		return saveVideoToMP3(data.nextUnpublishedVideoId);
	}
})
.then(chunkify)
.then((newPodcastSize) => {
	newPodcast.size = newPodcastSize;
	return newPodcast.slug;
})
.then(generateRSS)
.then(S3.uploadDir)
.then(() => {
	// update index.json
	console.log('Updating index.json');
	publishedPodcasts[newPodcast.slug] = newPodcast.size;
	fs.writeFileSync('./index.json', JSON.stringify(publishedPodcasts));
	return S3.uploadFile('./index.json', Constants.PODCASTS_JSON_PATH);
})
.then(() => {
	// update index.html
	console.log('Updating index.html');
	generateHTML(publishedPodcasts);
})
.then(() => {
	return S3.uploadFile('./index.html', Constants.PODCASTS_HTML_PATH);
})
.then(() => {
	// update index.xml
	console.log('Updating index.xml');
	return combinePodcasts(publishedPodcasts);
})
.then(() => {
	return S3.uploadFile('./index.xml', Constants.PODCASTS_XML_PATH);
})
.catch(function(err) {
	console.log(err);
	return 1;
});	
