
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
    return !file.startsWith('_');
}
function isConfigFile(file) {
    return file == "_config.json";
}
function buildSiteDir(appData, src, dir) {
    var fs = require('fs');
    dir = dir.replace(src, appData.app.dir.public);
    fs.mkdirSync(dir);
}
function addSiteFile(appData, src, obj) {
    var name = obj.replace(/\.[^/.]+$/, "").replace(src, "");;
    var index = appData.pages.findIndex(function(element) {
        return element.name == name;
    });
    if (index != -1) {
        appData.pages[index].src = src;
        appData.pages[index].obj = obj;
    }
    else {
        appData.pages.push({src: src, obj: obj, name: name});
    }
}
function buildSiteFile(appData) {
    var fs = require('fs');

    var obj = appData.page.obj;
    var src = appData.page.src;
    var dst = obj.replace(src, appData.app.dir.public);
    var ext = dst.split('.').pop();
    console.log('\tBuilding: ' + dst);
    switch(ext)
    {
        default:
            fs.createReadStream(obj).pipe(fs.createWriteStream(dst));
            break;
    }
}

function processPages(appData) {

    for(var loop = 0; loop < appData.pages.length; loop++) {
        appData.page = appData.pages[loop];
        buildSiteFile(appData);
    }
}
function build(appData) {

    var fs = require('fs');
    var avutil = require('../lib/util');
    var configMainData = fs.readFileSync("config.json");
    var configMain = JSON.parse(configMainData);

    appData.app.dir.theme = appData.app.dir.themes + '/' + configMain.theme;

    var configThemeData = fs.readFileSync(appData.app.dir.theme + '/config.json');
    var configTheme = JSON.parse(configThemeData);

    appData.config = Object.assign({}, configMain, configTheme);
    appData.dirConfigs = [];
    appData.pages = [];

    avutil.cleanDirectory(appData, appData.app.dir.public)
    .then(() => gitCheckoutMaster(appData))
    .then(() => avutil.processesDir(appData, appData.app.dir.theme + '/source', ignoreUnderscore, addSiteFile, buildSiteDir))
    .then(() => avutil.processesDir(appData, appData.app.dir.src, ignoreUnderscore, addSiteFile, buildSiteDir))
    .then(() => processPages(appData))
    .then(() => console.log('Build: Done'))
    .catch(function(err) {throw err;});
}

module.exports = build;

