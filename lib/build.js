
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
function buildSiteFile(appDir, src, dst) {
    var fs = require('fs');
    var ext = dst.split('.').pop();
    console.log('\tBuilding: ' + dst);
    switch(ext)
    {
        default:
            fs.createReadStream(src).pipe(fs.createWriteStream(dst));
            break;
    }
}

function build(appData) {

    var avutil = require('../lib/util');

    avutil.cleanDirectory(appData, appData.app.dir.public)
    .then(() => gitCheckoutMaster(appData))
    .then(() => avutil.processesDir(appData, appData.app.dir.src, appData.app.dir.public, ignoreUnderscore, buildSiteFile))
    .then(() => console.log('Build: Done'))
    .catch(function(err) {throw err;});
}

module.exports = build;

