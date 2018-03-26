
function server(args) {
    var serve = require('serve');

    var chokidar = require('chokidar')
    var watcher = chokidar.watch('./source/')
    watcher.on('ready', function() {

        var server = serve('public', {port: args.port});
        console.log('Server: Started');

        watcher.on('all', function() {
            console.log('Server: Update');
            console.log('\tRebuilding Site');
            var build = require('../lib/build');
            build();
            console.log('\tRestarting Server');
            server.stop();
            server = serve('public', {port: args.port, silent: true});
            console.log('\tServer Running');
        })
    })
}

module.exports = server;

