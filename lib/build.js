
function gitCheckoutMaster(appData) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.checkout(appData.app.dir.public, function(err, data){
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
function addFilesToList(appData, dir, obj, list) {
    var name = obj.replace(/\.[^/.]+$/, '').replace(dir, '');;
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
function loadScripts(dir) {
    var fs = require('fs');
    var result = {};
    if (fs.existsSync(dir)) {
        var files = fs.readdirSync(dir);

        files.forEach(function(file) {
            if (file.endsWith('.js')) {
                var name = file.substr(0, file.length - 3);
                var action = require(dir + name);
                result[name] = action;
            }
        });
    }
    return result;
}
function loadConfig(dir) {
    var fs = require('fs');
    var file = dir + 'config.json';
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
        categories: [],
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
    appData.layouts     = [({dir: appData.app.dir.appLayout,  obj: appData.app.dir.appLayout + 'page.ejz', name: 'page'})];
    Object.assign(appData, scriptApp, scriptTheme, scriptblog);

    var avutil = require('../lib/util');
    var processPages = require('../lib/processPages');
    avutil.cleanDirectory(appData, appData.app.dir.public)
    .then(() => gitCheckoutMaster(appData))
    .then(() => avutil.processesDir(appData, appData.app.dir.themeSource, ignoreUnderscore, addSiteFile, avutil.buildSiteDir))
    .then(() => avutil.processesDir(appData, appData.app.dir.src, ignoreUnderscore, addSiteFile, avutil.buildSiteDir))
    .then(() => avutil.processesDir(appData, appData.app.dir.themeLayout, ignoreUnderscore, addLayoutFile, () => {}))
    .then(() => avutil.processesDir(appData, appData.app.dir.layout, ignoreUnderscore, addLayoutFile, () => {}))
    .then(() => processPages(appData))
    .then(() => console.log('Build: Done'))
    .catch(function(err) {throw err;});
}

module.exports = build;

