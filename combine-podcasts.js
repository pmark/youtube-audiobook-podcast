var combiner = require('./combine-rss/index.js').combiner()
var fs = require('fs');

module.exports = function(podcasts) {
  // var podcast1 = "http://s3.amazonaws.com/martianrover.com/assets/audiobooks/the-martian/podcast.xml"
  // var podcast2 = "http://s3.amazonaws.com/martianrover.com/assets/audiobooks/hocus-pocus-by-kurt-vonnegut/podcast.xml"

  var schema = {
    title: "Audiobooks",
    description: "A curated selection of audiobooks.",
    subtitle: "Authors include Kurt Vonnegut, Neal Stephenson and some older writers too.",
    link: "http://martianrover.com/assets/audiobooks",
    feed_url: "http://martianrover.com/assets/audiobooks/index.xml",
    site_url: "http://martianrover.com/assets/audiobooks",
    image_url: "http://martianrover.com/assets/audiobooks/audiobooks.jpg",
    author: "Cy Swerdlow",
    category: "Audiobooks",
    subcategory: "Sci-fi",
  }

  Object.keys(podcasts).forEach((slug) => {
    console.log('Adding', slug);
    combiner.add(`http://martianrover.com/assets/audiobooks/${slug}/podcast.xml`);
  });

  return new Promise((resolve, reject) => {
    combiner.combine((rss) => {
      rss.output(schema, (xml) => {
        fs.writeFileSync('./index.xml', xml);
        resolve();
      });        
    });
  });
};
