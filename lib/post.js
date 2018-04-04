
function post(appData) {
    var fs = require('fs');
    var yaml = require('yamljs');
    var avutil = require('../lib/util');
    var dateFormat = require('dateformat');

    appData.config = avutil.loadAllConfig(appData);

    var date = Date.now();
    var prefix = dateFormat(date, 'yyyy"-"mm"-"dd"-"');
    var fileName = appData.args.article.toLowerCase().replace(/\+/g, ' plus').replace(' ', '-').replace(/-+/g, '-');
    var author = '';
    if ('author' in appData.config) {
        author = appData.config.author;
    }
    if (appData.args.author) {
        author = appData.args.author;
    }

    var data = {
        layout:     appData.args.layout,
        title:      appData.args.article,
        date:       dateFormat(date, 'isoUtcDateTime'),
        comments:   appData.args.comments,
        categories: appData.args.categories,
        tags:       appData.args.tags,
        series:     appData.args.series,
        subtitle:   appData.args.subtitle,
        author:     author,
        description:appData.args.description,
    };

    file    = appData.app.dir.src + appData.args.section + '/' + prefix + fileName + ".md";

    var stat = fs.stat(file, function(err, stats) {
        if (!err) {
            console.log('Failed to create as post already exists');
            console.log('Exists:  ' + file);
        }
        else {
            fs.writeFileSync(file,
                                  '---\n'
                                + yaml.stringify(data)
                                + '---\n'
                                + '# ' + appData.args.article + '\n'
                                + '\n\n\n\n');
            console.log('Created: ' + file);
        }
        console.log();
    });
}

module.exports = post;
