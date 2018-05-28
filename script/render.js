
module.exports = function(post, size) {
    var ejs = require('ejs');
    var showdown  = require('showdown');
    showdown.setOption('tables', true);
    showdown.setFlavor('github');
    var converter = new showdown.Converter();

    var render = (size != -1)
                    ? post.content.substr(0, size) + '[...more](' + post.path +')'
                    : post.content;
    render = ejs.render(render, this);
    return converter.makeHtml(render);
}
