
function forceSiteBuild(appData) {
    return new Promise(function(resolve, reject) {
        var build = require('../lib/build');
        build(appData);
        console.log('Deploy: Started');
        resolve();
    });
}
function getDeploymentDir(appData) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        if (!fs.existsSync(appData.app.dir.deploy + '/')) {
            git.getRemotes(true, function(err, data) {
                if (err) {reject(err);}
                else {
                    var repo = data.filter(obj => obj.name == 'origin')[0].refs.fetch;
                    git.clone(repo, appData.app.dir.deploy, function(err, data) {
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
function getCurrentDeployment(appData) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')(appData.app.dir.deploy);
        git.pull(function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Deploy: Fetch Current Site');
                resolve();
            }
        });
    });
}
function versionInfo(appData, update) {
    var fs = require('fs');
    var git = require('simple-git')();
    appData.versionString = fs.readFileSync('_version', {encoding: 'utf8'});
    if (update) {
        var versionArray  = appData.versionString.split('.');
        versionArray[2]++;
        appData.versionString = versionArray.join('.');
        fs.writeFileSync('_version', appData.versionString);
    }
    console.log('Deploy: Updated Version');
}
function commitLatestVersionAddNew(appData, dir, branch, status) {
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
function commitLatestVersionDelOld(appData, dir, branch, status) {
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
function commitLatestVersionCommit(appData, dir, branch, status) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')(dir);
        var files = status.files.map(file => file.path);
        git.commit(appData.versionString, files, function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('\tCommitted Files');
                resolve();
            }
        });
    });
}
function commitLatestVersion(appData, dir, branch) {
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
    .then(data => commitLatestVersionAddNew(appData, dir, branch, data))
    .then(data => commitLatestVersionDelOld(appData, dir, branch, data))
    .then(data => commitLatestVersionCommit(appData, dir, branch, data))
    .catch(err => {throw err;});
}
function pushLatestVersion(appData, dir, branch) {
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

function buildDeployFile(appDir, src, dst) {
    var fs = require('fs');
    fs.createReadStream(src).pipe(fs.createWriteStream(dst));
}
function copyLastBuildToMaster(appData) {
    var avutil = require('../lib/util');

    avutil.cleanDirectory(appData, appData.app.dir.deploy)
    .then(() => avutil.processesDir(appData, appData.app.dir.public, appData.app.dir.deploy, () => true, buildDeployFile))
    .catch(err => {throw err;});
}

function deploy(appData) {
    forceSiteBuild(appData)
    .then(() => getDeploymentDir(appData))
    .then(() => getCurrentDeployment(appData))
    .then(() => versionInfo(appData, true))
    .then(() => commitLatestVersion(appData, '.', 'source'))
    .then(() => pushLatestVersion(appData, '.', 'source'))
    .then(() => copyLastBuildToMaster(appData))
    .then(() => commitLatestVersion(appData, appData.app.dir.deploy, 'master'))
    .then(() => pushLatestVersion(appData, appData.app.dir.deploy, 'master'))
    .then(() => console.log('Deploy: Done'))
    .catch(function(err) {throw err;});
}

module.exports = deploy;

