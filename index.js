// given a youtube video ID
// downloads video from youtube
// converts to mp3 file
// splits mp3 into multiple hour long chunks
// uploads to s3
// create and upload a podcast XML file


var getNextPlaylistVideo = require('./youtube-playlist');
var saveVideoToMP3 = require('./youtube-audio-stream');
var chunkify = require('./chunkify');
var generateRSS = require('./generate-rss');
var S3 = require('./s3');
var Constants = require('./constants');

var publishedPodcasts = null;
var newPodcast = {};

getNextPlaylistVideo()
.then((data) => {
	publishedPodcasts = data.publishedPodcasts;
	newPodcast.slug = data.nextUnpublishedVideoSlug;
	newPodcast.videoId = data.nextUnpublishedVideoId;
	return newPodcast.videoId;
})
.then(saveVideoToMP3)
.then(chunkify)
.then((newPodcastSize) => {
	newPodcast.size = newPodcastSize;
	return newPodcast.slug;
})
.then(generateRSS)
.then(S3.syncDir)
.then(() => {
	publishedPodcasts[newPodcast.slug] = newPodcast.size;
	console.log('TO DO: Update master podcast XML', publishedPodcasts);

	S3.uploadJSON(publishedPodcasts, Constants.PODCASTS_JSON_PATH);

})
.catch(function(err) {
	console.log('Error:', err);
});	
