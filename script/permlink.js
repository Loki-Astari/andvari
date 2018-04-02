
module.exports = function(source, layout) {
    var link = '/' + source.replace(/\.md$/, '.html');
    if (layout == 'post') {
        link = '/' + source.replace(/\.md$/, '/index.html')
    }
    link = link.toLowerCase().replace(/\+/g, ' plus').replace(/(\d\d\d\d)-(\d\d)-(\d\d)-/, '$1/$2/$3/').replace(/ /g, '-').replace(/-+/g, '-');
    return link;
}
