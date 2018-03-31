
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
    var mkdirp = require('mkdirp');
    dir = dir.replace(src, appData.app.dir.public);
    console.log('Buid Dir: ' + dir);
    try {
        mkdirp.sync(dir);
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
        return element.name == appData.page.layout;
    });
    if (!layout) {
        throw 'Invalid Page Layout: ' + appData.page.layout;
    }

    var fs = require('fs');
    var ejs = require('ejs');
    var fileText = fs.readFileSync(layout.obj, {encoding: 'utf8'});
    html = ejs.renderFile(layout.obj, appData, function(err, result) {
        if (err) {throw err;}
        else {
            fs.writeFileSync(dst, result);
        }
    });
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

        var fileText = fs.readFileSync(fileName);
        var matterData = matter(fileText);

        var pageData = Object.assign({
            title:          '',             // Article title	string
            draft:          false,
            date:           stat.ctime,     // Article created date	Moment.js object
            updated:        stat.mtime,     // Article last updated date	Moment.js object
            comments:       true,           // Comment enabled or not	boolean
            comment:        appData.config.comment,
            layout:         defaultLayout,  // Layout name	string
            content:        '',             // The full processed content of the article	string
            excerpt:        '',             // Article excerpt	string
            more:           '',             // Contents except article excerpt	string
            full_source:    fileName,       // source/blog/2016-04-09-socket-read.md
            source:         filePath,       // blog/2016-04-09-socket-read.md
            path:           null,           // /blog/2016/04/09/socket-read/index.html
            permlink:       null,           // http://site.com/blog/2016/04/09/socket-read/
            prev:           null,           // The previous post, null if the post is the first post	???
            next:           null,           // The next post, null if the post is the last post	???
            raw:            fileText,       // The raw data of the article	???
            link:           '',             // The external link of the article (Used in link posts)	string
            series:         [],
            catagories:     [],
            tags:           [],
            srcLoc:         baseDir,
        }, matterData.data);
        pageData.content = converter.makeHtml(matterData.content);
        pageData.excerpt = converter.makeHtml(matterData.content.substr(0, 100));
        pageData.more    = converter.makeHtml(matterData.content.substr(100));

        /*
         * If `path` or `permlink` are defined in the page front matter then we will use it.
         * Otherwise we use the scripts/permlink.js function to build a permlink.
         * The default one uses the filename (as in page.source) but this can be overridden
         * by the layout or the blog by defining this function.
         */
        var permfile = appData.permlink(pageData);
        var permlink = permfile.substr(0, permfile.lastIndexOf('/')) + '/';
        if (!pageData.path) {
            pageData.path = permfile;
        }
        if (!pageData.permlink) {
            pageData.permlink   = appData.config.site + permlink;
        }
        /* Make sure we have the directory to place the final article. */
        if (permlink != '') {
            buildSiteDir(appData, '', permlink);
        }


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
    appData.site.posts = appData.site.pages.filter(page => (page.layout == 'post'))
    .sort(function(lhs, rhs) {
        var l = new Date(lhs.date);
        var r = new Date(rhs.date);
        return r - l;
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
function loadScripts(dir) {
    var fs = require('fs');
    var result = {};
    if (fs.existsSync(dir)) {
        var files = fs.readdirSync(dir);

        files.forEach(function(file) {
            if (file.endsWith('.js')) {
                var name = file.substr(0, file.length - 3);
                var action = require(dir + '/' + name);
                result[name] = action;
            }
        });
    }
    return result;
}
function loadConfig(dir) {
    var fs = require('fs');
    var file = dir + '/config.json';
    if (!fs.existsSync(file)) {
        return {};
    }
    var data = fs.readFileSync(file);
    return JSON.parse(data);
}
function build(appData) {

    var configApp   = loadConfig(appData.app.dir.appRoot);
    var configTheme = loadConfig(appData.app.dir.themeRoot);
    var configBlog  = loadConfig(appData.app.dir.root);

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
    appData.config = Object.assign({}, configApp, configTheme, configBlog);

    /*
     * Load Scripts
     */
    var scriptApp   = loadScripts(appData.app.dir.appScript);
    var scriptTheme = loadScripts(appData.app.dir.themeScript);
    var scriptblog  = loadScripts(appData.app.dir.script);

    /*
     * Internal Meta Data
     */
    appData.dirConfigs  = [];
    appData.pageSources = [];
    appData.stylus      = [];
    appData.copyFiles   = [];
    appData.layouts     = [({dir: appData.app.dir.appLayout,  obj: appData.app.dir.appLayout + '/page.ejz', name: 'page'})];
    Object.assign(appData, scriptApp, scriptTheme, scriptblog);

    var avutil = require('../lib/util');
    avutil.cleanDirectory(appData, appData.app.dir.public)
    .then(() => gitCheckoutMaster(appData))
    .then(() => avutil.processesDir(appData, appData.app.dir.themeSource, ignoreUnderscore, addSiteFile, buildSiteDir))
    .then(() => avutil.processesDir(appData, appData.app.dir.src, ignoreUnderscore, addSiteFile, buildSiteDir))
    .then(() => avutil.processesDir(appData, appData.app.dir.themeLayout, ignoreUnderscore, addLayoutFile, () => {}))
    .then(() => avutil.processesDir(appData, appData.app.dir.layout, ignoreUnderscore, addLayoutFile, () => {}))
    .then(() => processPages(appData))
    .then(() => console.log('Build: Done'))
    .catch(function(err) {throw err;});
}

module.exports = build;

