// chunkify

var ProgressBar = require('progress');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var Promise = require('bluebird');
var path = require('path');

module.exports = chunkify;

function chunkify(mp3FileName) {

	var outputBaseDir = path.dirname(mp3FileName);
	var outputDirName = path.basename(mp3FileName, '.mp3');
	var outputDir = path.join(outputBaseDir, outputDirName);
	
	if (!fs.existsSync(outputDir)) {
		fs.mkdir(outputDir);
	}

	return new Promise(function(resolve, reject) {
		console.log('chunkifying:', mp3FileName);

		var durationSec = 0;

		ffmpeg(mp3FileName)
		.ffprobe(function(err, data) {
			durationSec = data.format.duration;
			console.log('Total MP3 duration:', durationSec);

			var SecPerChunk = 3600;
			var chunkCount = Math.ceil(durationSec / SecPerChunk);
			var secondsRemaining = durationSec;

			var tuples = [];

			for (var chunkNum=0; chunkNum < chunkCount; chunkNum++) {
				var playhead = (chunkNum * SecPerChunk);
				var chunkDuration;

				if (secondsRemaining < SecPerChunk) {
					chunkDuration = secondsRemaining;
				}
				else {
					chunkDuration = SecPerChunk;
				}

				secondsRemaining = (secondsRemaining - chunkDuration);
				tuples.push([chunkNum, playhead, chunkDuration, secondsRemaining]);
			}

			var bar = new ProgressBar('Splitting [:bar] :percent', {
				complete: 'o',
				incomplete: '.',
				width: 25,
				total: chunkCount,
			});
			bar.tick(0);

			Promise.map(tuples, function(tuple) {
				var chunkNum = tuple[0];
				var playhead = tuple[1];
				var chunkDuration = tuple[2];
				var secondsRemaining = tuple[3];

				var chunkName = (path.join(outputDir, 'hour' + 
					(chunkNum < 9 ? '0' : '') +
					(chunkNum+1) + '.mp3'));

				return new Promise(function(resolve, reject) {
					var chunkCommand = ffmpeg()
					.input(mp3FileName)
					.audioBitrate(128)
					.audioChannels(1)
					.seek(playhead)
					.duration(chunkDuration)
					.on('error', function(err, stdout, stderr) {
						console.log('Cannot process mp3: ' + err.message);
						reject(err);
					})					
					.on('end', function() {
						bar.tick(1);
						resolve();
					}) 
					.save(chunkName)
				});
			}, {
				concurrency: 2,
			})
			.then(function() {
				console.log('done');
				resolve();
			})

		});

	});
}

// chunkify('downloads/the-untethered-soul-by-michael-singer-audiobook-chapter-1-the-voice-inside-your-head.mp3');

