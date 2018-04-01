
module.exports = function(post, size) {
    var showdown  = require('showdown');
    var converter = new showdown.Converter();

    var render = (size != -1)
                    ? post.content.substr(0, size) + '[...more](' + post.path +')'
                    : post.content;
    return converter.makeHtml(render);
}
