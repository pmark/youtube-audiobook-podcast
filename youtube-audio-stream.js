var ytdl     = require('ytdl-core');
var ffmpeg   = require('fluent-ffmpeg');
var ProgressBar = require('progress');
var through  = require('through2');
var defaults = require('./defaults');
var fs       = require('fs');
var rp = require('request-promise');

var outputFileName = null;
var downloadSize = null;
var bar = null;

module.exports = streamify;

function streamify(uri, opt) {
  defaults.set(opt = opt || {});

  return new Promise(function(resolve, reject) {

    var videoReadStream = ytdl(uri, {
      filter: filterVideo,
      quality: opt.quality
    });


    videoReadStream.on('info', function(info, format) {
      // console.log('info event:', format);
      if (!fs.existsSync('downloads')) { fs.mkdirSync('downloads'); }
      outputFileName = info.title.trim().toLowerCase().replace(/[\s\W]+/g, '-');
      outputFileName = 'downloads/' + outputFileName + '.mp3';

      fetchVideoSize(format.url)
      .then(function(downloadSize) {    
        
        videoReadStream.on('data', function (chunk) {
          bar = bar || new ProgressBar('Downloading [:bar] :percent, :elapsed sec, :eta sec remaining, :current / :total', {
            complete: '=',
            incomplete: ' ',
            width: 25,
            total: parseInt(downloadSize || 1000000000)
          });

          bar.tick(chunk.length);
        });

        var writeStream = fs.createWriteStream(outputFileName);

        writeStream.on('close', function () {
          resolve(outputFileName);
        });

        writeStream.on('error', function (err) {
          reject(err);
        });

        ffmpeg({source: videoReadStream})
          .toFormat(opt.audioFormat)
          .writeToStream(writeStream);
      });

    });

    function filterVideo(format) {
      return format.container === (opt.videoFormat);
    }

  });
  
}

function fetchVideoSize(url) {
  return rp.head(url)
  .then(function(headers) {
    return headers['content-length'];
  })
  .catch(function(err) {
    console.log('error:', err);
    return null;
  })  
}
