var config = require('./youtube-config.json');
var youtube = require('youtube-api');
var rp = require('request-promise');
var fs = require('fs');
var util = require('./util');

function playlistInfoRecursive(playlistId, callStackSize, pageToken, currentItems, callback) {
  youtube.playlistItems.list({
    part: 'snippet',
    pageToken: pageToken,
    maxResults: 50,
    playlistId: playlistId,
  }, function(err, data) {
    if (err) return console.log('error: ' + err);

    for (var x in data.items) {
      currentItems.push(data.items[x].snippet);
    }

    if (data.nextPageToken) {
      playlistInfoRecursive(playlistId, callStackSize + 1, data.nextPageToken, currentItems, callback);
    } else {
      callback(currentItems);
    }

  });
}


function playlistInfo(apiKey, playlistId, done) {
  youtube.authenticate({
    type: 'key',
    key: apiKey,
  });

  playlistInfoRecursive(playlistId, 0, null, [], done);
};

////////
function getNextPlaylistVideo() {

  console.log('Getting published podcasts...');
  return rp('http://martianrover.com/assets/audiobooks/podcasts.json')
  .then((body) => {
    console.log('existing podcasts:', body);
    return JSON.parse(body);
  })
  .then((podcasts) => {
    return new Promise(function(resolve, reject) {  
      playlistInfo(config.apiKey, config.playlistID, function(playlistItems) {
        var unpublished = {};

        playlistItems.forEach((item) => {

          var playlistItemSlug = util.slugForTitle(item.title);
          if (playlistItemSlug === 'deleted-video') return;
          var publishedItem = podcasts[playlistItemSlug];

          console.log(`${publishedItem ? '[PUBLISHED]' : '           ' }  ${playlistItemSlug}`);

          if (!publishedItem) {
            unpublished[playlistItemSlug] = item.resourceId.videoId;
          }
        });

        var unpublishedSlugs = Object.keys(unpublished || {});
        var nextSlug = null;
        var nextUnpublishedVideoId = null;

        if (unpublishedSlugs && unpublishedSlugs.length > 0) {
          nextSlug = unpublishedSlugs[0];
          nextUnpublishedVideoId = unpublished[nextSlug];
        }

        console.log('next video:', nextSlug, nextUnpublishedVideoId);
        resolve({
           publishedPodcasts: podcasts,
           nextUnpublishedVideoId: nextUnpublishedVideoId,
           nextUnpublishedVideoSlug: nextSlug,
        });
      });
    });
  });
  
}

////////

module.exports = getNextPlaylistVideo;
