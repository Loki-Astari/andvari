
module.exports = function(post) {
    return '| <a href="' + post.path.replace(/index.html/, '') + '#disqus_thread" data-disqus-identifier="' + post.permlink + '">Comments</a>';
}
