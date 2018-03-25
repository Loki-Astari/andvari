
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
function gitSubmoduleInit()
{
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
function gitCreateSourceBranch()
{
    return new Promise(function(resolve, reject) {
        var git = require('simple-git')();
        git.checkoutLocalBranch("source", function(err, data){
            if (err) {reject(err);}
            else {
                console.log("Git Create Source Branch");
                resolve();
            }
        });
    });
}
function createSiteLayout(config, appConfig)
{
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
function copyAndvariSkeleton(appConfig)
{
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

function init(args) {
    var fs = require('fs');
    var git = require('simple-git')();
    var path = require('path');

    var config = {
        title:  args.title,
        description: args.description,
        theme:  args.themeName,
    }

    var appPath = path.dirname(require.main.filename)
    var baseDir = path.normalize('.');
    var appConfig = {
        skelPath:   path.normalize(appPath + '/../skel/'),
        srcDir:     path.normalize(baseDir + '/source'),
        layDir:     path.normalize(baseDir + '/layout'),
        themeDir:   path.normalize(baseDir + '/themes'),
        pubDir:     path.normalize(baseDir + '/public'),
        scptDir:    path.normalize(baseDir + '/script'),
    };

    gitInit()
    .then(gitSubmoduleInit)
    .then(gitCreateSourceBranch)
    .then(() => createSiteLayout(config, appConfig))
    .then(() => copyAndvariSkeleton(appConfig))
    .then(function() {


                    var glob = require('glob');
                    glob('**/*', {mark:true}, function(err, files) {
                        if (err) { console.error(err);process.exit();}

                        files.push('public/Notes');
                        files.push('layout/Notes');
                        files.push('script/Notes');
                        files = files.filter(file => !file.endsWith('/'));
                        git.add(files, function(err, data) {
                            if (err) { console.error(err);process.exit();}
                            console.log("Git Added Files");

                            fs.writeFileSync('.gitignore', 'public/\n');
                            var ignore = ['.gitignore'];
                            git.add(ignore, function(err, data) {
                                if (err) { console.error(err);process.exit();}

                                git.submoduleAdd(args.themeRepo, 'themes/' + args.themeName, function(err, data){
                                    if (err) { console.error(err);process.exit();}
                                    console.log("Git Submodule Theme added");

                                    git.commit("Initial Commit", function(err, data){
                                        if (err) { console.error(err);process.exit();}
                                        console.log("Git DONE");
                                    });
                                });
                            });
                        });
                    });
    })
    .catch(function(err) {
        console.log("Error: " + err);
    });
}

module.exports = init;

