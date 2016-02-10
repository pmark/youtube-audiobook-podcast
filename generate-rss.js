var RSS = require('rss');
var fs = require('fs');
var moment = require('moment');
var pubDate = moment();
var path = require('path');
var WORD_EXCLUSIONS = 'by a and an the'.split(' ');

module.exports = generateRSS;
function generateRSS(localDir) {
    var titleSlug = path.basename(localDir);
    var title = capFirsts(titleSlug.replace(/-/g, ' '));
    var webPath = `martianrover.com/assets/${titleSlug}`;
    var podcastFileName = 'podcast.xml';

    var feed = new RSS({
        title: title,
        description: 'Audiobook',
        feed_url: `http://${webPath}/${podcastFileName}`,
        site_url: 'http://martianrover.com',
        image_url: `https://s3.amazonaws.com/${webPath}/cover.jpg`,
        docs: 'http://blogs.law.harvard.edu/tech/rss',
        managingEditor: null,
        webMaster: '',
        copyright: 'Copyright 2016',
        language: 'en',
        categories: ['Audiobook'],
        pubDate: pubDate.format(),
        ttl: '60',
        custom_namespaces: {
          'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
        },
        custom_elements: []
    });

    var files = listMP3Files(localDir);
    var itemDate = pubDate.subtract(files.length, 'hours');

    files.forEach(function(filePath, i) {
        var fileName = path.basename(filePath);
        var url = `https://s3.amazonaws.com/${webPath}/${fileName}`;

        itemDate.add(1, 'hour');

        feed.item({
            title:  `Hour ${i+1}`,
            description: `${i}:00`,
            url: url,
            guid: null,
            categories: ['Audiobook'],
            author: '', // optional - defaults to feed author property
            date: itemDate.format(), // any format that js Date can parse.
            lat: null,
            long: null,
            enclosure: {
                url:url, 
                size:fs.statSync(filePath).size, 
                type:"audio/mpeg"
            }, 
            custom_elements: null
        });
    }); // for each file

    return new Promise(function(resolve, reject) {
        // cache the xml to send to clients
        var xml = feed.xml();
        var xmlPath = path.join(localDir, podcastFileName);
        fs.writeFile(xmlPath, xml, function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}


function capFirsts(str) {
    var pieces = str.toLowerCase().split(' ');
    for (var i=0; i < pieces.length; i++) {
        var word = pieces[i];
        var letter = word.charAt(0)

        if (i === 0 || WORD_EXCLUSIONS.indexOf(word) === -1) {
            letter = letter.toUpperCase();
        }

        pieces[i] = letter + word.substr(1);
    }
    return pieces.join(' ');
}

function listMP3Files(dir) {
    var files = fs.readdirSync(dir);
    return files.map(function (file) {
        return path.join(dir, file);
    }).filter(function (file) {
        return fs.statSync(file).isFile() && path.extname(file) === '.mp3';
    });
}

// generateRSS('downloads/hocus-pocus-by-kurt-vonnegut');