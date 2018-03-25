
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

function init(args) {
    var git = require('simple-git')();

    var config = {
        title:  args.title,
        description: args.description,
        theme:  args.themeName,
    }

    gitInit()
    .then(gitSubmoduleInit)
    .then(gitCreateSourceBranch)
    .then(function() {

                var path = require('path');
                var fs = require('fs');

                var appPath = path.dirname(require.main.filename)
                var skelPath= path.normalize(appPath + '/../skel/');
                var baseDir = path.normalize('.');
                var srcDir  = path.normalize(baseDir + '/source');
                var layDir  = path.normalize(baseDir + '/layout');
                var themeDir= path.normalize(baseDir + '/themes');
                var pubDir  = path.normalize(baseDir + '/public');
                var scptDir = path.normalize(baseDir + '/script');

                fs.mkdirSync(srcDir);
                fs.mkdirSync(layDir);
                fs.mkdirSync(themeDir);
                fs.mkdirSync(pubDir);
                fs.mkdirSync(scptDir);
                console.log('Create Directory Structure');

                fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
                fs.writeFileSync('public/Notes', 'Site will be generated into this direcory');
                fs.writeFileSync('layout/Notes', 'Contains Site overrides of themes/layout');
                fs.writeFileSync('script/Notes', 'Contains Site specific functionality');
                console.log('Create Base Files Created');


                var ncp = require('ncp').ncp;
                ncp.limit = 16;

                ncp(skelPath, srcDir, function (err) {
                    if (err) { return console.error(err);process.exit();}
                    console.log("Skeleton Copied");

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
                });
    })
    .catch(function(err) {
        console.log("Error: " + err);
    });
}

module.exports = init;

