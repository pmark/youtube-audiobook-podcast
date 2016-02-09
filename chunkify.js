// chunkify

var ProgressBar = require('progress');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var Promise = require('bluebird');

module.exports = chunkify;

function chunkify(mp3FileName) {
	return new Promise(function(resolve, reject) {
		console.log('chunkifying:', mp3FileName);

		var bar = null;
		var durationSec = 0;

		ffmpeg(mp3FileName)
		.ffprobe(function(err, data) {
			durationSec = data.format.duration;
			console.log('Total MP3 duration:', durationSec);

			var command = ffmpeg()
			.input(mp3FileName)
			.on('progress', function(progress) {
			    // console.log('Processing: ' + progress.percent + '% done');

			    bar = bar || new ProgressBar('Splitting [:bar] :percent, :elapsed sec, :eta sec remaining', {
			    	complete: '=',
			    	incomplete: ' ',
			    	width: 25,
			    	total: 100
			    });

			    bar.tick(progress.percent);
			})
			.on('error', function(err, stdout, stderr) {
				console.log('Cannot process mp3: ' + err.message);
				reject(err);
			})

			var SecPerChunk = 360; //3600;
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

			Promise.map(tuples, function(tuple) {
				var chunkNum = tuple[0];
				var playhead = tuple[1];
				var chunkDuration = tuple[2];
				var secondsRemaining = tuple[3];

				var chunkName = ('downloads/chunk' + 
					(chunkNum < 9 ? '0' : '') +
					(chunkNum+1) + '.mp3');

				console.log('chunk', chunkNum+1, 'of', chunkCount, ':', playhead, 'to', playhead+chunkDuration, 'sec');

				return new Promise(function(resolve, reject) {
					var chunkCommand = command.clone()
					.input(mp3FileName)
					.audioBitrate(128)
					.audioChannels(1)
					.seek(playhead)
					.duration(chunkDuration)
					.on('end', resolve)
					.save(chunkName)
				});
			}, {
				concurrency: 2,
			})
			.then(function() {
				console.log('======== done chunkifying ========');
				resolve();
			})

		});

	});
}

chunkify('downloads/the-untethered-soul-by-michael-singer-audiobook-chapter-1-the-voice-inside-your-head.mp3');

