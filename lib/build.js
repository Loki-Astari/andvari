
function gitCheckoutMaster(appData) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.checkout(appData.app.dir.public + '/', function(err, data){
            if (err) {reject(err);}
            else {
                console.log('Build: Started');
                resolve();
            }
        });
    });
}
function ignoreUnderscore(file) {
    var path = file.split('/');
    return !path.find(element => element.startsWith('_'));
}
function isConfigFile(file) {
    return file == '_config.json';
}
function buildSiteDir(appData, src, dir) {
    var fs = require('fs');
    dir = dir.replace(src, appData.app.dir.public);
    console.log('Buid Dir: ' + dir);
    try {
        fs.mkdirSync(dir);
    }
    catch(err) {
        /* Ignore */
    }
}
function addFilesToList(appData, dir, obj, list) {
    var name = obj.replace(/\.[^/.]+$/, '').replace(dir + '/', '');;
    var index = list.findIndex(function(element) {
        return element.name == name;
    });
    if (index != -1) {
        list[index].dir = dir;
        list[index].obj = obj;
    }
    else {
        list.push({dir: dir, obj: obj, name: name});
    }
}
function addSiteFile(appData, dir, obj) {
    var ext = obj.split('.').pop();
    if (ext == 'md') {
        addFilesToList(appData, dir, obj, appData.pageSources);
    }
    else if (ext == 'styl') {
        addFilesToList(appData, dir, obj, appData.stylus);
    }
    else {
        addFilesToList(appData, dir, obj, appData.copyFiles);
    }
}
function addLayoutFile(appData, dir, obj) {
    addFilesToList(appData, dir, obj, appData.layouts);
}
function buildHtmlFromMd(appData) {

    var src = appData.page.srcLoc + '/' + appData.page.source;
    var dst = appData.app.dir.public + '/' + appData.page.path;

    var layout = appData.layouts.find(function(element) {
        return element.name == appData.page.type;
    });
    if (!layout) {
        throw 'Invalid Page type: ' + appData.page.type;
    }

    var fs = require('fs');
    var ejs = require('ejs');
    var fileText = fs.readFileSync(layout.obj, {encoding: 'utf8'});
    html = ejs.render(fileText, appData);
    fs.writeFileSync(dst, html);
}
function pushOrApply(dst, value) {
    if (Array.isArray(value)) {
        dst.push.apply(value);
    }
    else {
        dst.push(value);
    }
}
function uniqueIfy(dst) {
    dst.filter(function(value, index, self) { 
        return self.indexOf(value) === index;
    });
}
function processPages(appData) {

    var fs = require('fs');
    var stylus = require('stylus');
    var matter = require('gray-matter');
    var showdown  = require('showdown');
    var converter = new showdown.Converter();

    for(var loop = 0; loop < appData.pageSources.length; loop++) {
        var fileName = appData.pageSources[loop].obj;
        var baseDir = appData.pageSources[loop].dir;

        var stat = fs.statSync(fileName);
        var objectPath = fileName.split('/');
        objectPath.pop(); // Pop file name
        var defaultLayout = objectPath.pop();

        var filePath = fileName.replace(baseDir + '/', '');
        var url = filePath.replace('.md', '.html');
        var permlink = url;

        var fileText = fs.readFileSync(fileName);
        var matterData = matter(fileText);

        var pageData = Object.assign({
            title:          '',             // Article title	string
            draft:          false,
            date:           stat.ctime,     // Article created date	Moment.js object
            updated:        stat.mtime,     // Article last updated date	Moment.js object
            comments:       true,           // Comment enabled or not	boolean
            layout:         defaultLayout,  // Layout name	string
            content:        '',             // The full processed content of the article	string
            excerpt:        '',             // Article excerpt	string
            more:           '',             // Contents except article excerpt	string
            source:         filePath,       // The path of the source file	string
            full_source:    fileName,       // Full path of the source file	string
            path:           url,            // The URL of the article without root URL. We usually use url_for(page.path) in theme.	string
            permalink:      permlink,       // Full URL of the article	string
            prev:           null,           // The previous post, null if the post is the first post	???
            next:           null,           // The next post, null if the post is the last post	???
            raw:            fileText,      // The raw data of the article	???
            link:           '',             // The external link of the article (Used in link posts)	string
            series:         [],
            catagories:     [],
            tags:           [],
            srcLoc:         baseDir,
        }, matterData.data);
        pageData.content = converter.makeHtml(matterData.content);
        pageData.excerpt = converter.makeHtml(matterData.content.substr(0, 100));
        pageData.more    = converter.makeHtml(matterData.content.substr(100));

        appData.site.pages.push(pageData);
        appData.site.series.push(pageData.series);
        pushOrApply(appData.site.catagories, pageData.catagories);
        pushOrApply(appData.site.tags, pageData.tags);
        appData.site.dates.push(pageData.date);
    }
    uniqueIfy(appData.site.series);
    uniqueIfy(appData.site.catagories);
    uniqueIfy(appData.site.tags);
    uniqueIfy(appData.site.dates);

    // Sort pages into date order.
    appData.site.pages.sort(function(lhs, rhs) {
        return lhs.date == rhs.date ? 0
                : lhs.date < rhs.date ? -1 : +1;
    });

    for(var loop = 0; loop < appData.site.pages.length; loop++) {
        appData.page = appData.site.pages[loop];

        var src = appData.page.srcLoc + '/' + appData.page.source;
        var dst = appData.app.dir.public + '/' + appData.page.path;
        console.log('\tTransforming: ' + src + ' => ' + dst);

        buildHtmlFromMd(appData);
    }
    for(var loop = 0; loop < appData.stylus.length; loop++) {
        var obj = appData.stylus[loop].obj;
        var dir = appData.stylus[loop].dir;
        var dst = obj.replace(dir, appData.app.dir.public).replace(/.styl$/, '.css');

        var fileText = fs.readFileSync(appData.stylus[loop].obj,{encoding: 'utf8'});
        console.log('\tCompiling: ' + obj);
        try
        {
            stylus(fileText)
            .set('filename', dst)
            .include(require('nib').path)
            .include(obj.substring(0, obj.lastIndexOf("/")))
            .render(function(err, css){
                if (err) throw err;
            });
        }
        catch(err) {
            console.log('Error: ' + err);
        }
    }
    for(var loop = 0; loop < appData.copyFiles.length; loop++) {
        var fs = require('fs');

        var obj = appData.copyFiles[loop].obj;
        var dir = appData.copyFiles[loop].dir;
        console.log('\tCopying: ' + obj);

        var dst = obj.replace(dir, appData.app.dir.public);
        fs.createReadStream(obj).pipe(fs.createWriteStream(dst));
    }
}
function build(appData) {

    var fs = require('fs');
    var avutil = require('../lib/util');
    var configMainData = fs.readFileSync('config.json');
    var configMain = JSON.parse(configMainData);

    appData.app.dir.theme = appData.app.dir.themes + '/' + configMain.theme;

    var configThemeData = fs.readFileSync(appData.app.dir.theme + '/config.json');
    var configTheme = JSON.parse(configThemeData);

    /*
     * User Available Data
     */
    appData.site        = {
        pages:      [],
        series:     [],
        catagories: [],
        tags:       [],
        dates:      [],
    };
    // appData.page     Will be assigned per page
    appData.config = Object.assign({}, configMain, configTheme);
    /*
     * Internal Meta Data
     */
    appData.dirConfigs  = [];
    appData.pageSources = [];
    appData.stylus      = [];
    appData.copyFiles   = [];
    appData.layouts     = [({dir: appData.app.dir.defLayout,  obj: appData.app.dir.defLayout + 'Page.ejz', name: 'Page'})];

    avutil.cleanDirectory(appData, appData.app.dir.public)
    .then(() => gitCheckoutMaster(appData))
    .then(() => avutil.processesDir(appData, appData.app.dir.theme + '/source', ignoreUnderscore, addSiteFile, buildSiteDir))
    .then(() => avutil.processesDir(appData, appData.app.dir.src, ignoreUnderscore, addSiteFile, buildSiteDir))
    .then(() => avutil.processesDir(appData, appData.app.dir.theme + '/layout', () => true, addLayoutFile, () => {}))
    .then(() => avutil.processesDir(appData, appData.app.dir.layout, () => true, addLayoutFile, () => {}))
    .then(() => processPages(appData))
    .then(() => console.log('Build: Done'))
    .catch(function(err) {throw err;});
}

module.exports = build;

