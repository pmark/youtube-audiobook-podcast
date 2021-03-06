var fs = require('fs');
var util = require('./util');

module.exports = function(podcasts) {
	var html = [
`
<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>Audiobook Podcasts</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">    
    <link rel="stylesheet" href="http://martianrover.com/css/normalize.css">
    <link rel="stylesheet" href="http://martianrover.com/css/main.css">
	<link rel="stylesheet" type="text/css" href="http://martianrover.com/assets/audiobooks/bootstrap.simplex.min.css">
	<style>
	h1 { color: #3a87ad; }
	li { margin:4px 0; }
	body {
	    padding: 5px;
	    height: auto;
	    background: none;
	}
	.list-group-item {
		background-color: rgba(255,255,255,0.66);
		border-radius: 4px;
	}
	.list-group-item a {
		display: block;
		color: #3a87ad;
		font-size: 12pt;
	}
	.list-group-item a:hover {
		text-decoration: none;
		color: #204b60;
	}

	</style>
</head>

<div id="skrollr-body">  
<div class="alert alert-dismissible alert-info">
	<h1>Audiobook Podcasts</h1>
	<p>Each recording is split into hour long segments.</p>
</div>
<ul class="list-group">
	<li>
		<a href="index.xml" class="label label-primary">Subscribe to all</a>
		<a href="index.xml" style="border:none"><img src="http://martianrover.com/assets/audiobooks/subscribe.png" style="height:14px"/></a>
	</li>
`
	];
	
	Object.keys(podcasts).sort().forEach(function(slug) {
		var title = util.titleForSlug(slug);
		var count = podcasts[slug].hours;
		html.push(`<li class="list-group-item"><span class="badge"><a href="${slug}/audio.html" style="display:block; color:white; padding:4px;">${count}</a></span><a href="${slug}/podcast.xml">${title}</a></li>\n`);
	});

	html.push(
`
</ul>
</div>
`);

	// console.log('html:\n', html.join(''));
	fs.writeFileSync('./index.html', html.join(''));
};

// TODO: why was this uncommented ever?
//module.exports(require('./index.json'));

