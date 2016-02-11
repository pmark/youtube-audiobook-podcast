var youtube = require('youtube-api');
var fs = require('fs');

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


module.exports = playlistInfo;
function playlistInfo(apiKey, playlistId, done) {

  youtube.authenticate({
    type: 'key',
    key: apiKey,
  });

  playlistInfoRecursive(playlistId, 0, null, [], done);
};

// pullPlayList("playlist id here", "name of mp3 here");

////////

var config = require('./youtube-config.json');
playlistInfo(config.apiKey, config.playlistID, function(playlistItems) {
  var videoIds = playlistItems.map((item) => item.resourceId.videoId);
  // console.log(playlistItems);
  console.log(videoIds);
});