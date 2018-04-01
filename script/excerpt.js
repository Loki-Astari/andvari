
module.exports = function(size, post) {
    console.log('Excerpt');
    var showdown  = require('showdown');
    var converter = new showdown.Converter();

    var excerpt = post.content.substr(0, size) + '[...more](' + post.path +')'
    return converter.makeHtml(excerpt);
}
