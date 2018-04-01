
module.exports = function(post) {
    var commentSystems = {
        disque: (post) => 'data-disqus-identifier="' + post.permlink + '"',
    };
    var mark = commentSystems[post.comment](post);
    return '| <a href="' + post.path.replace(/index.html/, '') + '#CommentSection" ' + mark + '>Comments</a>';
}
