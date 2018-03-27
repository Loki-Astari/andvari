

function argparseWrapper() {
    var ArgumentParser = require('argparse').ArgumentParser

    return {
        parser: new ArgumentParser({
            version: '0.0.1',
            addHelp:true,
            description: 'Andvari: Static Web Site Generator'
        }),

        parseArgs: function() {
            return this.parser.parseArgs();
        },

        addSubparsers: function(args) {
            return {
                subparsers: this.parser.addSubparsers({
                                title:'subcommands',
                                dest: 'action'
                            }),
                addParser: function(name, args) {
                    return {
                        aParser: this.subparsers.addParser(name, args),
                        addArgument: function(flags, args) {
                            this.aParser.addArgument(flags, args);
                            return this;
                        },
                    };
                },
            };
        },
    };
}

function andvari() {

    var path = require('path');

    var parser = argparseWrapper();
    var subparsers = parser.addSubparsers({
        title:'subcommands',
        dest: 'action'
    });

    subparsers.addParser( 'init', {addHelp:true, description: 'Init an Andvari Web Site',}
    ).addArgument(
        [ '-t', '--title' ], { action: 'store', type: 'string', help: 'The Title of the web site', defaultValue: 'My Blog'}
    ).addArgument(
        [ '-d', '--description' ], { action: 'store', type: 'string', help: 'A meta description of the site', defaultValue: 'I write about stuff'}
    ).addArgument(
        [ '--themeRepo' ], { action: 'store', type: 'string', help: 'The Github repo to use as the theme', defaultValue: 'git@github.com:Loki-Astari/andvari-theme-landscape.git'}
    ).addArgument(
        [ '--themeName' ], { action: 'store', type: 'string', help: 'The name used to identify the theme', defaultValue: 'landscape'}
    ).addArgument(
        [ '-r', '--repo' ], { action: 'store', type: 'string', help: 'The github repo for the blog', required: true}
    );

    subparsers.addParser( 'build',  {addHelp:true, description: ''});
    subparsers.addParser( 'deploy', {addHelp:true, description: ''});
    subparsers.addParser( 'server', {addHelp:true, description: ''}
    ).addArgument(
        ['-p', '--port' ], {action: 'store', type: 'int', help: 'Port Development Server listenes on', defaultValue: 4000}
    );

    var args = parser.parseArgs();

    var appPath = path.dirname(require.main.filename)
    var baseDir = path.normalize('.');
    var appDir = {
        skelPath:   path.normalize(appPath + '/../skel/'),
        src:        path.normalize(baseDir + '/source'),
        layout:     path.normalize(baseDir + '/layout'),
        themes:     path.normalize(baseDir + '/themes'),
        public:     path.normalize(baseDir + '/public'),
        deploy:     path.normalize(baseDir + '/deploy'),
        script:     path.normalize(baseDir + '/script'),
    };
    var gitInfo = {
        source:     'source',
        site:       'master'
    };

    var appData = {
        args:       args,
        app:    {
            dir:    appDir,
            git:    gitInfo
        }
    };


    try {
        var action = require('../lib/' + args.action);
        action(appData);
    }
    catch(error) {
        console.error(error);
        console.dir(args);
    }
}

module.exports = andvari;
