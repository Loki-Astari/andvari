
function build(args, appConfig) {

    var rimraf = require('rimraf');
    var git = require('simple-git')();

    rimraf(appConfig.pubDir + '/*', function (err) {
        if (err) { console.error(err);process.exit();}

        git.checkout(appConfig.pubDir + '/', function(err, data){
            if (err) { console.error(err);process.exit();}

            var glob = require('glob');
            glob(appConfig.srcDir + '/**/*', {mark:true}, function(err, files) {
                if (err) { console.error(err);process.exit();}

                var dirs = files.filter(file => file.endsWith('/'));
                var objs = files.filter(file => !file.endsWith('/') && !file.startsWith('_'));

                var fs = require('fs');
                dirs.forEach(function(dir) {
                    dir = dir.replace(appConfig.srcDir, appConfig.pubDir);
                    fs.mkdirSync(dir);
                });

                objs.forEach(function(obj) {
                    var dst = obj.replace(appConfig.srcDir, appConfig.pubDir);
                    var ext = dst.split('.').pop();
                    switch(ext)
                    {
                        default:
                            fs.createReadStream(obj).pipe(fs.createWriteStream(dst));
                            break;
                    }
                });
            });
        });
    });
}

module.exports = build;

