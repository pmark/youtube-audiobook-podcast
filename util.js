
module.exports.slugForTitle = function(title) {
	return title.trim().replace(/\W/g, '-').replace(/^-|--{1}|-$/g, '').toLowerCase();
}

module.exports.titleForSlug = function(slug) {
	return module.exports.capFirsts(slug.replace(/-/g, ' '));
}

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
}

