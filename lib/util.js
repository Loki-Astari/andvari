
function cleanDirectory(args, appConfig, dir) {
    return new Promise(function(resolve, reject) {
        var rimraf = require('rimraf');
        rimraf(dir + '/*', function (err) {
            if (err) {reject(err);}
            else     {resolve();}
        });
    });
}

function processesDir(args, appConfig, src, dst, fileFilter, fileAction) {
    return new Promise(function(resolve, reject) {
        var glob = require('glob');
        glob(src + '/**/*', {mark:true}, function(err, files) {
            if (err) { console.error(err);process.exit();}

            var dirs = files.filter(file => file.endsWith('/'));
            var objs = files.filter(file => !file.endsWith('/') && fileFilter(file))

            var fs = require('fs');
            dirs.forEach(function(dir) {
                dir = dir.replace(src, dst);
                fs.mkdirSync(dir);
            });

            objs.forEach(function(obj) {
                var dstObj = obj.replace(src, dst);
                fileAction(appConfig, obj, dstObj);
            });
        });
    });
}

var util = {
    cleanDirectory: cleanDirectory,
    processesDir:   processesDir,
};

module.exports = util;

