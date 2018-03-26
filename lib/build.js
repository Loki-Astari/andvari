
function gitCheckoutMaster(appConfig) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.checkout(appConfig.pubDir + '/', function(err, data){
            if (err) {reject(err);}
            else     {resolve();}
        });
    });
}
function ignoreUnderscore(file) {
    return !file.startsWith('_');
}
function buildSiteFile(appConfig, src, dst) {
    var fs = require('fs');
    var ext = dst.split('.').pop();
    switch(ext)
    {
        default:
            fs.createReadStream(src).pipe(fs.createWriteStream(dst));
            break;
    }
}

function build(args, appConfig) {

    var avutil = require('../lib/util');

    avutil.cleanDirectory(args, appConfig, appConfig.pubDir)
    .then(() => gitCheckoutMaster(appConfig))
    .then(() => avutil.processesDir(args, appConfig, appConfig.srcDir, appConfig.pubDir, ignoreUnderscore, buildSiteFile))
    .catch(function(err) {throw err;});
}

module.exports = build;

