
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
function buildSiteDir(appData, src, dir) {
    var fs = require('fs');
    dir = dir.replace(src, appData.app.dir.public);
    fs.mkdirSync(dir);
}
function buildSiteFile(appData, src, obj) {
    var fs = require('fs');
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

function build(appData) {

    var avutil = require('../lib/util');

    avutil.cleanDirectory(appData, appData.app.dir.public)
    .then(() => gitCheckoutMaster(appData))
    .then(() => avutil.processesDir(appData, appData.app.dir.src, ignoreUnderscore, buildSiteFile, buildSiteDir))
    .then(() => console.log('Build: Done'))
    .catch(function(err) {throw err;});
}

module.exports = build;

