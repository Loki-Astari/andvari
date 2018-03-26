
function gitInit() {
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
function gitSetOrigin(args) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.addRemote('origin', args.repo, function(err, data) {
            if (err) {reject(err);}
            else {
                console.log('Init: Origin Set');
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
                console.log('Init: Fetch Done');
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
                        console.log('Init: Created Default Site');
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
                console.log('Init: Found Existing Site');
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
                console.log('Init: Submodule Init');
                resolve();
            }
        });
    });
}
function gitCreateSourceBranch() {
    return new Promise(function(resolve, reject) {
        var fs = require('fs');
        var git = require('simple-git')();
        git.checkout(['--orphan', 'source'], function(err, data) {
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
                console.log('Init: Found Exisiting Blog Source');
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
        console.log('\tBlog Source Directory Created');

        fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
        fs.writeFileSync(appConfig.pubDir + '/Notes', 'Site will be generated into this direcory');
        fs.writeFileSync(appConfig.layDir + '/Notes', 'Contains Site overrides of themes/layout');
        fs.writeFileSync(appConfig.scptDir+ '/Notes', 'Contains Site specific functionality');
        fs.writeFileSync('_version', '0.00.000');
        console.log('\tBlog Source Files Created');
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
                console.log('\tBlog Source Skeleton Copied');
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
                        console.log('\tBlog Source Files Added');

                        fs.writeFileSync('.gitignore', appConfig.pubDir + '/\n' + appConfig.depDir + '/\n');
                        var ignore = ['.gitignore'];
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
function gitAddTheme(args, appConfig) {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.submoduleAdd(args.themeRepo, appConfig.themeDir + '/' + args.themeName, function(err, data){
            if (err) {reject(err);}
            else {
                console.log('\tBlog Source Theme Added');
                resolve();
            }
        });
    });
}
function gitCommitAllFiles() {
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
function gitPushToOrigin(branch) {
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
    .then(() => console.log('Init: Done'))
    .catch(function(err) {throw err;});
}

module.exports = init;

