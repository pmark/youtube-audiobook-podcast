// chunkify

var ProgressBar = require('progress');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');

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

			var SecPerHour = 3600;
			var chunkCount = Math.ceil(durationSec / SecPerHour);
			var playhead = 0;
			var secondsRemaining = durationSec;

			for (var chunkNum=0; chunkNum < chunkCount; chunkNum++) {

				playhead = (chunkNum * SecPerHour);

				if (secondsRemaining < SecPerHour) {
					chunkDuration = secondsRemaining;
				}
				else {
					chunkDuration = SecPerHour;
				}

				var chunkName = ('downloads/chunk' + 
					(chunkNum < 9 ? '0' : '') +
					(chunkNum+1) + '.mp3');

				console.log('chunk', chunkNum+1, 'of', chunkCount, ':', playhead, 'to', playhead+chunkDuration, 'sec');

				var chunkCommand = command.clone()
				.input(mp3FileName)
				.audioBitrate(128)
				.audioChannels(1)
				.seekInput(playhead)
				.duration(chunkDuration)
				.on('end', function() {
					secondsRemaining = (secondsRemaining - chunkDuration);
					if (secondsRemaining <= 0) {
						console.log('======== done ========');
						resolve();
					}
				})
				.save(chunkName)
			}

		});

	});
}

chunkify('downloads/the-untethered-soul-by-michael-singer-audiobook-chapter-1-the-voice-inside-your-head.mp3');

