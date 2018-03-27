
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
function buildHtmlFromMd(appData, dst) {

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

function processPages(appData) {

    var fs = require('fs');
    var stylus = require('stylus');
    var matter = require('gray-matter');
    var showdown  = require('showdown');
    var converter = new showdown.Converter();

    for(var loop = 0; loop < appData.pageSources.length; loop++) {
        var fileText = fs.readFileSync(appData.pageSources[loop].obj);
        var pageData = matter(fileText);
        var data = pageData.data;
        data.content = converter.makeHtml(pageData.content);
        appData.pages.push(data);
    }
    for(var loop = 0; loop < appData.pageSources.length; loop++) {
        appData.page = appData.pages[loop];
        appData.pageSource = appData.pageSources[loop];

        var obj = appData.pageSource.obj;
        var dir = appData.pageSource.dir;
        console.log('\tTransforming: ' + obj);

        var dst = obj.replace(dir, appData.app.dir.public).replace(/.md$/, '.html');
        buildHtmlFromMd(appData, dst);
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

    appData.config = Object.assign({}, configMain, configTheme);
    appData.dirConfigs  = [];
    appData.pageSources = [];
    appData.pages       = [];
    appData.stylus      = [];
    appData.copyFiles   = [];
    appData.layouts     = [];

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

