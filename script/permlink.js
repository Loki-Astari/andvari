
module.exports = function(post) {
    var dateTime = new Date(post.date);
    var dateFormat = require('dateformat');
    if (post.layout == 'post') {
        var name = post.source;
        return '/' + name.replace(/\.md$/, '').toLowerCase().replace(/\+/g, ' plus').replace(/(\d\d\d\d)-(\d\d)-(\d\d)-/, '$1/$2/$3/').replace(/ /g, '-').replace(/-+/g, '-') + '/index.html';
    }
    return  post.source.replace(/\.md$/, '.html');
}
