
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
        git.checkout(["-b", "source"], function(err, data) {
            if (err) {reject(err);}
            else {
                console.log("Git Create Source Branch");
                files = fs.readdirSync(".");
                files = files.filter(file => file != ".git");
                if (files.length != 0) {
                    reject("Repository Already Set Up");
                }
                else {
                    resolve();
                }
            }
        });
    });
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
                files.push(appConfig.pubDir + '/Notes');
                files.push(appConfig.layDir + '/Notes');
                files.push(appConfig.scptDir+ '/Notes');
                files = files.filter(file => !file.endsWith('/'));
                git.add(files, function(err, data) {
                    if (err) {reject(err);}
                    else {
                        console.log("Git Added Files");

                        fs.writeFileSync('.gitignore', appConfig.pubDir + '/\n');
                        var ignore = ['.gitignore'];
                        git.add(ignore, function(err, data) {
                            if (err) {reject(err);}
                            else {
                                console.log("Skeleton Copied");
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
function gitPushToOrigin() {
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.push("origin", "source", ["-u"], function(err, data){
            if (err) {reject(err);}
            else {
                console.log("Git Push");
                resolve();
            }
        });
    });
}
function cleanUp(path, current) {
    var fs = require('fs');
    fs.readdirSync(path).forEach(function(file, index){
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
            cleanUp(curPath, true);
        } else { // delete file
            fs.unlinkSync(curPath);
        }
    });
    if (current) {
        fs.rmdirSync(path);
    }
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
    .then(gitCreateSourceBranch)
    .then(gitSubmoduleInit)
    .then(() => createSiteLayout(config, appConfig))
    .then(() => copyAndvariSkeleton(appConfig))
    .then(() => gitAddAllFiles(appConfig))
    .then(() => gitAddTheme(args, appConfig))
    .then(gitCommitAllFiles)
    .then(gitPushToOrigin)
    .catch(function(err) {
        console.log("Error: " + err);
        //cleanUp(".");
    });
}

module.exports = init;

