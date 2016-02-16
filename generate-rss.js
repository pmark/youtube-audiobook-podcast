var RSS = require('rss');
var fs = require('fs');
var moment = require('moment');
var pubDate = null;
var path = require('path');
var Constants = require('./constants');
var util = require('./util');

module.exports = generateRSS;
function generateRSS(podcast) {
    console.log('generateRSS:', podcast);
    var titleSlug = podcast.slug;
    var localDir = path.join(Constants.DOWNLOADS_DIR, titleSlug);
    var title = util.titleForSlug(titleSlug);
    var webPath = `martianrover.com/assets/audiobooks/${titleSlug}`;
    var podcastFileName = 'podcast.xml';
    pubDate = moment(podcast.pubDate);

    var feed = new RSS({
        title: title,
        description: 'Audiobook',
        feed_url: `http://${webPath}/${podcastFileName}`,
        site_url: 'http://martianrover.com',
        image_url: `https://${webPath}/cover.jpg`,
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
    var itemDate = pubDate.clone().add(files.length, 'minutes');

    files.forEach(function(filePath, i) {
        var fileName = path.basename(filePath);
        var url = `http://${webPath}/${fileName}`;
        var fileSize = fs.statSync(filePath).size;
        var h = i + 1;

        itemDate.subtract(1, 'minute');

        feed.item({
            title:  `${i}:00 ${util.capFirsts(title)}`,
            description: `Hour ${h}`,
            url: url,
            guid: null,
            categories: ['Audiobook'],
            author: '', // optional - defaults to feed author property
            date: itemDate.format(), // any format that js Date can parse.
            lat: null,
            long: null,
            size:fileSize,
            enclosure: {
                url:url, 
                size:fileSize,
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
                console.log('can\'t write', xmlPath);
                reject(err);
            }
            else {
                resolve(localDir);
            }
        });
    });
}

function listMP3Files(dir) {
    var files = fs.readdirSync(dir);
    return files.map(function (file) {
        return path.join(dir, file);
    }).filter(function (file) {
        return fs.statSync(file).isFile() && path.extname(file) === '.mp3';
    });
}
