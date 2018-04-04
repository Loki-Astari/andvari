
function gitInit(appData) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.init(function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Init: Started');
                resolve();
            }
        });
    });
}
function gitSetOrigin(appData) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.addRemote('origin', appData.args.repo, function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Init: Origin Set');
                resolve();
            }
        });
    });
}
function gitFetchFromOrigin(appData) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        git.fetch(function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Init: Fetch Done');
                resolve();
            }
        });
    });
}
function gitCreateInitialMaster(appData, andCommit) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();

        var file = fs.realpathSync(appData.app.dir.master);
        file = file.replace(process.cwd() + '/', '') + '/index.html';

        fs.writeFileSync(file, '<html><head><title>Andvari Site</title></head><body></body>');
        git.add([file], function(err, data) {
            if (err) {reject(err);}
            else {
                if (andCommit) {
                    git.commit('Initial Site', [file], function(err, data) {
                        if (err) {reject(err);}
                        else {
                            console.log('Init: Created Default Site');
                            resolve();
                        }
                    });
                }
                else {
                    resolve();
                }
            }
        });
    })
}
function gitInitMaster(appData) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.checkout(['-b', appData.app.git.siteBranch, 'origin/' + appData.app.git.siteBranch], function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Init: Found Existing Site');
                resolve();
            }
        });
    })
    .catch(() => gitCreateInitialMaster(appData, true));
}
function gitSubmoduleInit(appData) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.submoduleInit(function(err, data){
            if (err) {reject(err);}
            else {
                console.log('Init: Submodule Init');
                resolve();
            }
        });
    });
}
function gitCreateSourceBranch(appData, config) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        git.checkout(['--orphan', appData.app.git.sourceBranch], function(err, data) {
            if (err) {reject(err);}
            else {
                fs.unlinkSync('index.html');
                git.raw(['rm', '--cached', '-r', 'index.html'], function(err, data) {
                    if (err) {reject(err);}
                    else {
                        console.log('Init: Create Default Blog Source');
                        resolve();
                    }
                });
            }
        });
    })
    .then(() => createSiteLayout(appData, config))
    .then(() => copyAndvariSkeleton(appData))
    .then(() => gitAddAllFiles(appData))
    .then(() => gitAddTheme(appData))
    .then(() => gitCommitAllFiles(appData));
}
function gitInitSource(appData, config) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.checkout(['-b', appData.app.git.sourceBranch, 'origin/' + appData.app.git.sourceBranch], function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Init: Found Exisiting Blog Source');
                resolve();
            }
        });
    })
    .catch(() => gitCreateSourceBranch(appData, config));
}
function createSiteLayout(appData, config) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');

        fs.mkdirSync(appData.app.dir.src);
        fs.mkdirSync(appData.app.dir.layout);
        fs.mkdirSync(appData.app.dir.themes);
        fs.mkdirSync(appData.app.dir.public);
        fs.mkdirSync(appData.app.dir.script);
        console.log('\tBlog Source Directory Created');

        fs.writeFileSync(appData.app.dir.root + 'config.json', JSON.stringify(config, null, 4));
        fs.writeFileSync(appData.app.dir.root + '_version', '0.00.000');
        fs.writeFileSync(appData.app.dir.public + 'Notes', 'Site will be generated into this direcory');
        fs.writeFileSync(appData.app.dir.layout + 'Notes', 'Contains Site overrides of themes/layout/');
        fs.writeFileSync(appData.app.dir.script + 'Notes', 'Contains Site specific functionality');
        console.log('\tBlog Source Files Created');
        resolve();
    });
}
function copyAndvariSkeleton(appData) {
    return new Promise(function(resolve, reject) {
        var ncp = require('ncp').ncp;
        ncp.limit = 16;

        ncp(appData.app.dir.skelRoot, appData.app.dir.src, function (err) {
            if (err) {reject(err);}
            else {
                console.log('\tBlog Source Skeleton Copied');
                resolve();
            }
        });
    });
}
function gitAddAllFiles(appData) {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        var glob = require('glob');

        glob(appData.app.dir.root + '**/*', {mark:true}, function(err, files) {
            if (err) {reject(err);}
            else {
                files = files.filter(file => !file.endsWith('/'));
                files.forEach(function(value, index, array) {
                    array[index] = fs.realpathSync(value).replace(process.cwd() + '/', '');
                });
                git.add(files, function(err, data) {
                    if (err) {reject(err);}
                    else {
                        fs.writeFileSync(appData.app.dir.root + '.gitignore', appData.app.dir.public + '\n' + appData.app.dir.deploy + '\n');
                        var ignore = [appData.app.dir.root + '.gitignore'];
                        git.add(ignore, function(err, data) {
                            if (err) {reject(err);}
                            else {
                                console.log('\tBlog Source Ignore File Added');
                                resolve();
                            }
                        });
                    }
                });
            }
        });
    });
}
function gitAddTheme(appData) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.submoduleAdd(appData.args.themeRepo, appData.app.dir.themes + appData.args.themeName + '/', function(err, data){
            if (err) {reject(err);}
            else {
                console.log('\tBlog Source Theme Added');
                resolve();
            }
        });
    });
}
function gitCommitAllFiles(appData) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.commit('Initial Commit', function(err, data){
            if (err) {reject(err);}
            else {
                console.log('\tBlog Source Generation Finished');
                resolve();
            }
        });
    });
}
function gitPushToOrigin(appData, branch) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.push('origin', branch, ['-u'], function(err, data){
            if (err) {reject(err);}
            else {
                console.log('Init: Push: ' + branch);
                resolve();
            }
        });
    });
}
function createDeployDirectory(appData) {
    return new Promise(function(resolve, reject) {
        fs = require('fs');
        if (appData.args.dest == '' || appData.args.dest == '.') {
            reject('Invalid Destination for deployment => (' + appData.args.dest + ')');
        }
        else {
            fs.stat(appData.args.dest, function(err, stat) {
                if (!err) {
                    reject('Invalid Destination for deployment => (' + appData.args.dest + ') Already Exists');
                }
                else {
                    fs.stat(appData.app.dir.root, function(err, stat) {
                        if (!err) {
                            reject('Invalid Destination for deployment => (' + appData.app.dir.root + ') Already Exists');
                        }
                        else {
                            fs.mkdirSync(appData.args.dest);
                            fs.mkdirSync(appData.app.dir.root);
                            console.log('Create Deploy Directory: Done');
                            resolve();
                        }
                    });
                }
            });
        }
    });
}
function createSymLinkToDeploy(appData) {
    return new Promise(function(resolve, reject) {
        var link = appData.app.dir.deploy.substring(0, appData.app.dir.deploy.length - 1);
        fs.symlink('../' + appData.args.dest, link, 'dir', function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Create Sym Link: DONE');
                resolve();
            }
        });
    });
}
function getAddDeploySymLink(appData) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        var link = appData.app.dir.deploy.substring(0, appData.app.dir.deploy.length - 1);
        git.add([link], function(err, data) {
            if (err) {reject(err);}
            else {
                resolve();
            }
        });

    });
}

function init(appData) {

    var config = {
        author: appData.args.title,
        title:  appData.args.title,
        description: appData.args.description,
        theme:  appData.args.themeName,
        themeGit: appData.args.themeRepo,
    }

    if (appData.args.repo.startsWith('https://') || appData.args.repo.startsWith('git@')) {
        gitInit(appData)
        .then(() => gitSetOrigin(appData))
        .then(() => gitFetchFromOrigin(appData))
        .then(() => gitInitMaster(appData))
        .then(() => gitSubmoduleInit(appData))
        .then(() => gitInitSource(appData, config))
        .then(() => gitPushToOrigin(appData, appData.app.git.siteBranch))
        .then(() => gitPushToOrigin(appData, appData.app.git.sourceBranch))
        .then(() => console.log('Init: Done'))
        .catch(function(err) {throw err;});
    }
    else {
        createDeployDirectory(appData)
        .then(() => createSymLinkToDeploy(appData))
        .then(() => gitCreateInitialMaster(appData, false))
        .then(() => createSiteLayout(appData, config))
        .then(() => copyAndvariSkeleton(appData))
        .then(() => gitAddAllFiles(appData))
        .then(() => getAddDeploySymLink(appData))
        .then(() => gitAddTheme(appData))
        .then(() => gitCommitAllFiles(appData));
    }
}

module.exports = init;

