
module.exports = function(dateTime) {
    // time datetime="Sun May 29 2016 21:13:39 GMT-0700 (PDT)" pubdate data-updated="true">May 29<span>th</span>, 2016</time>
    // 2015-01-15 08:13:47 -0800
    // <time datetime="<%- post.date %>" pubdate data-updated="true">May 29<span>th</span>, 2016</time>
    var dt = new Date(dateTime);
    var dateFormat = require('dateformat');
    return '<time datetime="' + dt.toString() + '" data-updated="true">' + dateFormat(dt, 'mmm d "<span>"S"</span>", yyyy') + '</time>';
}
