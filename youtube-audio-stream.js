var ytdl     = require('ytdl-core');
var ffmpeg   = require('fluent-ffmpeg');
var ProgressBar = require('progress');
var through  = require('through2');
var defaults = require('./defaults');
var fs       = require('fs');
var rp       = require('request-promise');
var path     = require('path');
var downloadImage = require('./download-image.js');
var util     = require('./util');
var Constants = require('./constants');

module.exports = streamify;

function streamify(videoId, opt) {
  defaults.set(opt = opt || {});

  return new Promise(function(resolve, reject) {
    if (!videoId) {
      reject(new Error('No videoId'));
      return;
    }

    var uri = 'https://www.youtube.com/watch?v=' + videoId;

    console.log('Fetching', uri)

    var videoReadStream = ytdl(uri, {
      filter: filterVideo,
      quality: opt.quality
    });

    videoReadStream.on('info', function(info, format) {
      console.log('info event:', info);

      if (!fs.existsSync(Constants.DOWNLOADS_DIR)) { fs.mkdirSync(Constants.DOWNLOADS_DIR); }

      var outputFileName = util.slugForTitle(info.title);
      var outputFilePath = path.join(Constants.DOWNLOADS_DIR, outputFileName + '.mp3');

      if (fs.existsSync(outputFilePath)) {
        resolve(outputFilePath);
        return;
      }

      console.log('Downloading video to', outputFilePath, 'from', uri);

      var bar = null;
      var imgDir = path.join(Constants.DOWNLOADS_DIR, outputFileName);
      if (!fs.existsSync(imgDir)) { fs.mkdirSync(imgDir); }
      var imgPath = path.join(imgDir, 'cover.jpg');

      fetchThumbnail(extractThumbnailURL(info.videoDetails), imgPath)
      .then(function() {
        return fetchVideoSize(format.url);
      })
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

        var writeStream = fs.createWriteStream(outputFilePath);

        writeStream.on('close', function () {
          resolve(outputFilePath);
        });

        writeStream.on('error', function (err) {
          reject(err);
        });

        ffmpeg({source: videoReadStream})
          .toFormat(opt.audioFormat)
          .writeToStream(writeStream);
      });

    });

    videoReadStream.on('error', function(err) {
      console.log('ytdl error:', err);
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

function fetchThumbnail(url, imgPath) {
  console.log('fetchThumbnail:', url);

  return downloadImage(url, imgPath)
  .catch(function(err) {
    console.log('error fetching thumbnail:', err);
    return null;
  });
}

function extractThumbnailURL(videoDetails) {
  var thumbnails = videoDetails && videoDetails.thumbnail && videoDetails.thumbnail.thumbnails;
  if (thumbnails) {
    var last = thumbnails[thumbnails.length-1];
    if (last) {
      return last.url;
    }
  }
  return null;
}


// streamify('V44YvBUHkt4');