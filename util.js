var fs = require('fs');
var path = require('path');

module.exports.slugForTitle = function(title) {
	return title.trim().replace(/\W/g, '-').replace(/^-|-$/g, '').replace(/-+/g, '-').toLowerCase();
};

module.exports.titleForSlug = function(slug) {
	return module.exports.capFirsts(slug.replace(/-/g, ' '));
};

module.exports.capFirsts = function(str) {
	var WORD_EXCLUSIONS = 'by a and an the'.split(' ');
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
};

module.exports.listFiles = function(dir) {
    var files = fs.readdirSync(dir);
    return files.map(function (file) {
        return path.join(dir, file);
    }).filter(function (file) {
        return fs.statSync(file).isFile();
    });
};
