var parser = require('parse-rss');

var url = "https://s3.amazonaws.com/martianrover.com/assets/audiobooks/hocus-pocus-by-kurt-vonnegut/podcast.xml"

parser(url, function(err, articles, b) {
          console.log('articles:', articles, b);
        });