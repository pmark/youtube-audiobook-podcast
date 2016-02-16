var fs = require('fs');
var util = require('./util');

module.exports = function(podcasts) {
	var html = [
		'<link rel="stylesheet" type="text/css" href="http://martianrover.com/assets/audiobooks/bootstrap.simplex.min.css">',
		'<style> li { margin:4px 0; } </style>',
		'<div class="alert alert-dismissible alert-info"><h1>Audiobook Podcasts</h1>Each recording is split into hour long segments.</div>',
		'<ul><li><a href="index.xml" class="btn btn-primary">Subscribe to All</a> <a href="index.xml" style="border:none"><img src="http://martianrover.com/assets/audiobooks/subscribe.png" style="height:22px"/></a></li>',
	];
	
	Object.keys(podcasts).forEach(function(slug) {
		var title = util.titleForSlug(slug);
		var count = podcasts[slug].hours;
		html.push(`<li><a href="${slug}/podcast.xml" class="btn btn-info">${title}</a> \
			<span class="badge">${count} hour${count === 1 ? '' : 's'}</span></li>`);
	});

	html.push('</ul>');
	// console.log('html:\n', html.join(''));
	fs.writeFileSync('./index.html', html.join(''));
};