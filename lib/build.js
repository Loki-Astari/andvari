
function build(args) {

    var rimraf = require('rimraf');
    var git = require('simple-git')();

    rimraf('public/*', function (err) {
        if (err) { console.error(err);process.exit();}

        git.checkout('public/', function(err, data){
            if (err) { console.error(err);process.exit();}

            var glob = require('glob');
            glob('source/**/*', {mark:true}, function(err, files) {
                if (err) { console.error(err);process.exit();}

                var dirs = files.filter(file => file.endsWith('/'));
                var objs = files.filter(file => !file.endsWith('/') && !file.startsWith('_'));

                var fs = require('fs');
                dirs.forEach(function(dir) {
                    dir = dir.replace(/^source/, 'public');
                    fs.mkdirSync(dir);
                });

                objs.forEach(function(obj) {
                    var dst = obj.replace(/^source/, 'public');
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

