
function server(args) {
    var serve = require('serve');

    var chokidar = require('chokidar')
    var watcher = chokidar.watch('./src/')
    watcher.on('ready', function() {

        var server = serve('public', {port: args.port});
        console.log('Server Started');

        watcher.on('all', function() {
            console.log('Update: Rebuilding Site');
            var build = require("../lib/build");
            build();
            console.log('Update: Restarting Server');
            server.stop();
            server = serve('public', {port: args.port, silent: true});
            console.log('Update: Server Running');
        })
    })
}

module.exports = server;

