
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
};

module.exports = util;

