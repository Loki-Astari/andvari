
module.exports = function(dateTime, format) {
    if (!format) {
        format = 'mmm d "<span>"S"</span>", yyyy';
    }
    var dt = new Date(dateTime);
    var dateFormat = require('dateformat');
    return '<time datetime="' + dateFormat(dt, 'isoUtcDateTime') + '" pubdate>' + dateFormat(dt, format) + '</time>';
}
