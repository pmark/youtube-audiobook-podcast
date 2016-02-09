var RSS = require('rss');
var fs = require('fs');
var moment = require('moment');
var pubDate = moment();

/* lets create an rss feed */
var feed = new RSS({
    title: 'The Martian',
    description: 'Audiobook',
    feed_url: 'http://martianrover.com/assets/the-martian/the-martian-rss.xml',
    site_url: 'http://martianrover.com',
    image_url: 'https://s3.amazonaws.com/martianrover.com/assets/the-martian/the-martian.jpg',
    docs: 'http://blogs.law.harvard.edu/tech/rss',
    managingEditor: null,
    webMaster: 'matt@damon.com',
    copyright: 'Copyright 2016',
    language: 'en',
    categories: ['sci-fi'],
    pubDate: pubDate.format(),
    ttl: '60',
    custom_namespaces: {
      'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
    },
    custom_elements: []
});

/* loop over data and add to feed */
var itemDate = pubDate.subtract(11, 'hours');
for (var i=0; i < 11; i++) {
	var url = `https://s3.amazonaws.com/martianrover.com/assets/the-martian/the-martian-h${i}.mp3`
    itemDate.add(1, 'hour');

	feed.item({
	    title:  `Hour ${i+1}`,
	    description: `${i}:00`,
	    url: url,
	    guid: null,
	    categories: ['Audiobook', 'Sci-Fi'],
	    author: 'Andy Weir', // optional - defaults to feed author property
	    date: itemDate.format(), // any format that js Date can parse.
	    lat: null,
	    long: null,
	    enclosure: {
            url:url, 
            size:fs.statSync(`../the-martian/the-martian-h${i}.mp3`).size, 
            type:"audio/mpeg"
        }, 
	    custom_elements: null
	});
}

// cache the xml to send to clients
var xml = feed.xml();
fs.writeFileSync('the-martian-rss.xml', xml);



















