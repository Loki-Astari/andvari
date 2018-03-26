
function forceSiteBuild(args, appConfig) {
    return new Promise(function(resolve, reject) {
        var build = require('../lib/build');
        build(args, appConfig);
        console.log('Deploy: Started');
        resolve();
    });
}
function getDeploymentDir(args, appConfig) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        if (!fs.existsSync(appConfig.depDir + '/')) {
            git.getRemotes(true, function(err, data) {
                if (err) {reject(err);}
                else {
                    var repo = data.filter(obj => obj.name == 'origin')[0].refs.fetch;
                    git.clone(repo, appConfig.depDir, function(err, data) {
                        if (err) {reject(err);}
                        else {
                            console.log('Deploy: Got Current Site');
                            resolve();
                        }
                    });
                }
            });
        }
        else {
            console.log('Deploy: Current Site Found');
            resolve();
        }
    });
}
function getCurrentDeployment(args, appConfig) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')(appConfig.depDir);
        git.pull(function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Deploy: Fetch Current Site');
                resolve();
            }
        });
    });
}
function versionInfo(args, appConfig, update) {
    var fs = require('fs');
    var git = require('simple-git')();
    appConfig.versionString = fs.readFileSync('_version', {encoding: 'utf8'});
    if (update) {
        var versionArray  = appConfig.versionString.split('.');
        versionArray[2]++;
        appConfig.versionString = versionArray.join('.');
        fs.writeFileSync('_version', appConfig.versionString);
    }
    console.log('Deploy: Updated Version');
}
function commitLatestVersionAddNew(args, appConfig, dir, branch, status) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')(dir);
        if (status.not_added.length != 0) {
            git.add(status.not_added, function(err, data) {
                if (err) {reject(err);}
                else {
                    console.log('\tAdded New Files');
                    resolve(status);
                }
            });
        }
        else {
            console.log('\tNo New Files');
            resolve(status);
        }
    });
}
function commitLatestVersionDelOld(args, appConfig, dir, branch, status) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')(dir);
        if (status.deleted.length != 0) {
            git.rm(status.deleted, function(err, data) {
                if (err) {reject(err);}
                else {
                    console.log('\tRemoved Old Files');
                    resolve(status);
                }
            });
        }
        else {
            console.log('\tNo Old Files');
            resolve(status);
        }
    });
}
function commitLatestVersionCommit(args, appConfig, dir, branch, status) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')(dir);
        var files = status.files.map(file => file.path);
        git.commit(appConfig.versionString, files, function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('\tCommitted Files');
                resolve();
            }
        });
    });
}
function commitLatestVersion(args, appConfig, dir, branch) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')(dir);
        git.status(function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Deploy: Saving State: ' + branch);
                resolve(data);
            }
        });
    })
    .then(data => commitLatestVersionAddNew(args, appConfig, dir, branch, data))
    .then(data => commitLatestVersionDelOld(args, appConfig, dir, branch, data))
    .then(data => commitLatestVersionCommit(args, appConfig, dir, branch, data))
    .catch(err => {throw err;});
}
function pushLatestVersion(args, appConfig, dir, branch) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')(dir);
        git.push('origin', branch, function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Deploy: Pushing State ' + branch)
                resolve();
            }
        });
    });
}

function buildDeployFile(appConfig, src, dst) {
    var fs = require('fs');
    fs.createReadStream(src).pipe(fs.createWriteStream(dst));
}
function copyLastBuildToMaster(args, appConfig) {
    var avutil = require('../lib/util');

    avutil.cleanDirectory(args, appConfig, appConfig.depDir)
    .then(() => avutil.processesDir(args, appConfig, appConfig.pubDir, appConfig.depDir, () => true, buildDeployFile))
    .catch(err => {throw err;});
}

function deploy(args, appConfig) {
    forceSiteBuild(args, appConfig)
    .then(() => getDeploymentDir(args, appConfig))
    .then(() => getCurrentDeployment(args, appConfig))
    .then(() => versionInfo(args, appConfig, true))
    .then(() => commitLatestVersion(args, appConfig, '.', 'source'))
    .then(() => pushLatestVersion(args, appConfig, '.', 'source'))
    .then(() => copyLastBuildToMaster(args, appConfig))
    .then(() => commitLatestVersion(args, appConfig, appConfig.depDir, 'master'))
    .then(() => pushLatestVersion(args, appConfig, appConfig.depDir, 'master'))
    .then(() => console.log('Deploy: Done'))
    .catch(function(err) {throw err;});
}

module.exports = deploy;

