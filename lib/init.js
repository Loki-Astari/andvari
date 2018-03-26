
function gitInit() {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.init(function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Git Init');
                resolve();
            }
        });
    });
}
function gitSetOrigin(args) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.addRemote('origin', args.repo, function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Origin Set');
                resolve();
            }
        });
    });
}
function gitFetchFromOrigin() {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        git.fetch(function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Git Fetch');
                resolve();
            }
        });
    });
}
function gitCreateInitialMaster() {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        fs.writeFileSync('index.html', '<html><head><title>Andvari Site</title></head><body></body>');
        git.add(['index.html'], function(err, data) {
            if (err) {reject(err);}
            else {
                git.commit('Initial Site', ['index.html'], function(err, data) {
                    if (err) {reject(err);}
                    else {
                        console.log("Git Master Created");
                        resolve();
                    }
                });
            }
        });
    })
    .then(gitSubmoduleInit);
}
function gitInitMaster() {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.checkout(['-b', 'master', 'origin/master'], function(err, data) {
            if (err) {reject(err);}
            else {
                console.log("Git Master Using Current");
                resolve();
            }
        });
    })
    .catch(gitCreateInitialMaster);
}
function gitSubmoduleInit() {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.submoduleInit(function(err, data){
            if (err) {reject(err);}
            else {
                console.log("Git Submodule Init");
                resolve();
            }
        });
    });
}
function gitCreateSourceBranch() {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        git.checkout(["--orphan", "source"], function(err, data) {
            if (err) {reject(err);}
            else {
                fs.unlinkSync('index.html');
                git.raw(['rm', '--cached', '-r', 'index.html'], function(err, data) {
                    if (err) {reject(err);}
                    else {
                        console.log("Git Create Source Branch");
                        resolve();
                    }
                });
            }
        });
    })
    .then(() => createSiteLayout(config, appConfig))
    .then(() => copyAndvariSkeleton(appConfig))
    .then(() => gitAddAllFiles(appConfig))
    .then(() => gitAddTheme(args, appConfig))
    .then(gitCommitAllFiles);
}
function gitInitSource() {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.checkout(['-b', 'source', 'origin/source'], function(err, data) {
            if (err) {reject(err);}
            else {
                console.log("Git Source Using Current");
                resolve();
            }
        });
    })
    .catch(gitCreateInitialMaster);
}
function createSiteLayout(config, appConfig) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');

        fs.mkdirSync(appConfig.srcDir);
        fs.mkdirSync(appConfig.layDir);
        fs.mkdirSync(appConfig.themeDir);
        fs.mkdirSync(appConfig.pubDir);
        fs.mkdirSync(appConfig.scptDir);
        console.log('Create Directory Structure');

        fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
        fs.writeFileSync(appConfig.pubDir + '/Notes', 'Site will be generated into this direcory');
        fs.writeFileSync(appConfig.layDir + '/Notes', 'Contains Site overrides of themes/layout');
        fs.writeFileSync(appConfig.scptDir+ '/Notes', 'Contains Site specific functionality');
        fs.writeFileSync('_version', '0.00.000');
        console.log('Create Base Files Created');
        resolve();
    });
}
function copyAndvariSkeleton(appConfig) {
    return new Promise(function(resolve, reject) {
        var ncp = require('ncp').ncp;
        ncp.limit = 16;

        ncp(appConfig.skelPath, appConfig.srcDir, function (err) {
            if (err) {reject(err);}
            else {
                console.log("Skeleton Copied");
                resolve();
            }
        });
    });
}
function gitAddAllFiles(appConfig) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        var glob = require('glob');

        glob('**/*', {mark:true}, function(err, files) {
            if (err) {reject(err);}
            else {
                files = files.filter(file => !file.endsWith('/'));
                git.add(files, function(err, data) {
                    if (err) {reject(err);}
                    else {
                        console.log("Git Added Files");

                        fs.writeFileSync('.gitignore', appConfig.pubDir + '/\n' + appConfig.depDir + '/\n');
                        var ignore = ['.gitignore'];
                        git.add(ignore, function(err, data) {
                            if (err) {reject(err);}
                            else {
                                console.log("Get Add Ignore File");
                                resolve();
                            }
                        });
                    }
                });
            }
        });
    });
}
function gitAddTheme(args, appConfig) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.submoduleAdd(args.themeRepo, appConfig.themeDir + '/' + args.themeName, function(err, data){
            if (err) {reject(err);}
            else {
                console.log("Git Submodule Theme added");
                resolve();
            }
        });
    });
}
function gitCommitAllFiles() {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.commit("Initial Commit", function(err, data){
            if (err) {reject(err);}
            else {
                console.log("Git Commit");
                resolve();
            }
        });
    });
}
function gitPushToOrigin(branch) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.push("origin", branch, ["-u"], function(err, data){
            if (err) {reject(err);}
            else {
                console.log("Git Push: " + branch);
                resolve();
            }
        });
    });
}

function init(args, appConfig) {

    var config = {
        title:  args.title,
        description: args.description,
        theme:  args.themeName,
    }

    gitInit()
    .then(() => gitSetOrigin(args))
    .then(gitFetchFromOrigin)
    .then(gitInitMaster)
    .then(gitInitSource)
    .then(() => gitPushToOrigin('master'))
    .then(() => gitPushToOrigin('source'))
    .catch(function(err) {throw err;});
}

module.exports = init;

