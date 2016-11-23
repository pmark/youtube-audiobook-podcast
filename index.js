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
// var generateAudioHTML = require('./generate-audio-html');
var S3 = require('./s3');
var fs = require('fs');
var moment = require('moment');
var combinePodcasts = require('./combine-podcasts');
var Constants = require('./constants');

var publishedPodcasts = null;
var newPodcast = {};
var slugToFetch = process.argv[2];

getNextPlaylistVideo()
.then((data) => {
	publishedPodcasts = data.publishedPodcasts;

	if (slugToFetch) {
		var filePath = `downloads/${slugToFetch}.mp3`;
		console.log('Processing file', filePath);

		newPodcast.slug = slugToFetch;
		newPodcast.videoId = publishedPodcasts[slugToFetch] && publishedPodcasts[slugToFetch].videoId;

		if (fs.existsSync(filePath)) {
			return filePath;
		}
	}
	else {
		newPodcast.slug = data.nextUnpublishedVideoSlug;
		newPodcast.videoId = data.nextUnpublishedVideoId;
	}

	if (!newPodcast.slug) {
		throw new Error('Nothing to do.');
	}

	return saveVideoToMP3(newPodcast.videoId);
})
.then(chunkify)
.then((newPodcastSize) => {
	console.log('newPodcastSize:', newPodcastSize);
	newPodcast.size = newPodcastSize;
	newPodcast.pubDate = nextPubDate();
	return newPodcast;
})
.then(generateRSS)
.then(S3.uploadDir)
.then(() => {
	// update index.json
	console.log('Updating index.json');

	publishedPodcasts[newPodcast.slug] = {
		hours: newPodcast.size,
		pubDate: newPodcast.pubDate,
	};

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
/*
.then(() => {
	// update slug/audio.html
	console.log('Updating audio.html for', slug);
	return updateAudioIndexes(publishedPodcasts);
})
.then(() => {
	return S3.uploadFile('./index.xml', Constants.PODCASTS_XML_PATH);
})
*/
.catch(function(err) {
	console.log(err);
	return 1;
});	


function nextPubDate() {
	var keys = null;
	if (!publishedPodcasts || (keys=Object.keys(publishedPodcasts)).length === 0) {
		return moment('2016-02-01T00:00:00-08:00').format();
	}

	var now = moment();
	var minMinutes = Infinity;
	var minKey = null;

	keys.forEach((key) => {
		var item = publishedPodcasts[key];
		var pubDate = moment(item.pubDate);

		var minutesSincePubDate = (now.diff(pubDate) / 1000) / 60;

		if (minutesSincePubDate < minMinutes) {
			minMinutes = minutesSincePubDate;
			minKey = key;
		}
	});

	var item = publishedPodcasts[minKey];
	console.log('key:', minKey, publishedPodcasts);
	var pubDate = moment(item.pubDate);
	pubDate.add(item.hours, 'minutes');
	return pubDate.format();
}

function updateAudioIndexes(podcasts) {
	Object.keys(podcasts).forEach(function(slug) {
		
		var onePodcast = podcasts[slug];
		var outputDir = slug;

		for (var chunkNum=0; chunkNum < onePodcast.hours; chunkNum++) {
			var chunkName = (path.join(outputDir, 'hour' + 
				(chunkNum < 9 ? '0' : '') +
				(chunkNum+1) + '.mp3'));

			return new Promise(function(resolve, reject) {
				if (fs.existsSync(chunkName)) {
					// console.log('Chunk exists:', chunkName);
					resolve();
					return;
				}
				else {
					fs.writeFileSync(`./${slug}/index.json`, JSON.stringify(publishedPodcasts));
				}
			});

		}

		// generateAudioHTML(slug, )
	});
}
