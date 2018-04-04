function loadConfig(dir) {
    var fs = require('fs');
    var file = dir + 'config.json';
    if (!fs.existsSync(file)) {
        return {};
    }
    var data = fs.readFileSync(file);
    return JSON.parse(data);
}

function loadAllConfig(appData) {

    var configApp   = loadConfig(appData.app.dir.appRoot);
    var configTheme = loadConfig(appData.app.dir.themeRoot);
    var configBlog  = loadConfig(appData.app.dir.root);

    return Object.assign({}, configApp, configTheme, configBlog);
}

function cleanDirectory(appData, dir) {
    return new Promise(function(resolve, reject) {
        var rimraf = require('rimraf');
        rimraf(dir + '/*', function (err) {
            if (err) {reject(err);}
            else     {resolve();}
        });
    });
}

function processesDir(appData, src, fileFilter, fileAction, dirAction) {
    return new Promise(function(resolve, reject) {
        var glob = require('glob');
        glob(src + '/**/*', {mark:true}, function(err, files) {
            if (err) { reject(err);}
            else {
                var dirs = files.filter(file => file.endsWith('/') && fileFilter(file));
                var objs = files.filter(file => !file.endsWith('/') && fileFilter(file))

                dirs.forEach(function(dir) {
                    dirAction(appData, src, dir);
                });

                objs.forEach(function(obj) {
                    fileAction(appData, src, obj);
                });
                resolve();
            }
        });
    });
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

var util = {
    cleanDirectory: cleanDirectory,
    processesDir:   processesDir,
    buildSiteDir:   buildSiteDir,
    loadAllConfig:  loadAllConfig,
};

module.exports = util;

