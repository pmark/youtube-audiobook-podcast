module.exports.slugForTitle = function(title) {
	return title.trim().toLowerCase().replace(/[\s\W]+/g, '-');
}