
function forceSiteBuild(appData) {
    return new Promise(function(resolve, reject) {
        var build = require('../lib/build');
        build(appData, resolve, reject);
        console.log('Deploy: Started');
    });
}
function getDeploymentDir(appData) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        if (!fs.existsSync(appData.app.dir.deploy)) {
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
            var files = status.not_added.map(file => appData.base + file);
            git.add(files, function(err, data) {
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
            var files = status.deleted.map(file => appData.base + file);
            git.rm(files, function(err, data) {
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
        var files = status.files.map(file => appData.base + file.path);
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
    });
}
function pushLatestVersion(appData, dir, branch) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')(dir);
        git.branch(function(err, branchInfo) {
            if (err) {reject(err);}
            else {
                git.push('origin', branchInfo.current, function(err, data) {
                    if (err) {reject(err);}
                    else {
                        console.log('Deploy: Pushing State ' + branch)
                        resolve();
                    }
                });
            }
        });
    });
}
function buildSiteDir(appData, src, dir) {
    var fs = require('fs');
    dir = dir.replace(src, appData.app.dir.deploy);
    fs.mkdirSync(dir);
}
/*
 * Yes this should be done async.
 * Quick fix to get it working for now.
 *
 * We need to make async copy work with util.processesDir
 */
function buildDeployFile(appData, src, obj) {
    var dst = obj.replace(src, appData.app.dir.deploy);
    const copyFileSync = require('fs-copy-file-sync');
    copyFileSync(obj, dst);
    /*
     * Original Async code
     * var fs = require('fs');
     * var dst = obj.replace(src, appData.app.dir.deploy);
     * fs.createReadStream(obj).pipe(fs.createWriteStream(dst));
     */
}

function deploy(appData) {
    var avutil = require('../lib/util');

    avutil.gitRoot(appData)
    .then(() => forceSiteBuild(appData))
    .then(() => getDeploymentDir(appData))
    .then(() => getCurrentDeployment(appData))
    .then(() => versionInfo(appData, true))

    // Commit Source and push
    .then(() => commitLatestVersion(appData, '.', appData.app.git.sourceBranch))
    .then(data => commitLatestVersionAddNew(appData, '.', appData.app.git.sourceBranch, data))
    .then(data => commitLatestVersionDelOld(appData, '.', appData.app.git.sourceBranch, data))
    .then(data => commitLatestVersionCommit(appData, '.', appData.app.git.sourceBranch, data))
    .then(() => pushLatestVersion(appData, '.', appData.app.git.sourceBranch))

    // Clean the deploy directory then copy build
    .then(() => avutil.cleanDirectory(appData, appData.app.dir.deploy))
    .then(() => avutil.processesDir(appData, appData.app.dir.public, () => true, buildDeployFile, buildSiteDir))

    // Commit Master and push
    .then(() => commitLatestVersion(appData, appData.app.dir.deploy, appData.app.git.siteBranch))
    .then(data => commitLatestVersionAddNew(appData, appData.app.dir.deploy, appData.app.git.siteBranch, data))
    .then(data => commitLatestVersionDelOld(appData, appData.app.dir.deploy, appData.app.git.siteBranch, data))
    .then(data => commitLatestVersionCommit(appData, appData.app.dir.deploy, appData.app.git.siteBranch, data))
    .then(() => pushLatestVersion(appData, appData.app.dir.deploy, appData.app.git.siteBranch))

    .then(() => console.log('Deploy: Done'))
    .catch(function(err) {throw err;});
}

module.exports = deploy;

