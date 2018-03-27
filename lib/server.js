
function server(appData) {
    var serve = require('serve');

    var chokidar = require('chokidar')
    var watcher = chokidar.watch(appData.app.dir.source)
    watcher.on('ready', function() {

        var server = serve('public', {port: appData.args.port});
        console.log('Server: Started');

        watcher.on('all', function() {
            console.log('Server: Update');
            console.log('\tRebuilding Site');
            var build = require('../lib/build');
            build();
            console.log('\tRestarting Server');
            server.stop();
            server = serve('public', {port: appData.args.port, silent: true});
            console.log('\tServer Running');
        })
    })
}

module.exports = server;

