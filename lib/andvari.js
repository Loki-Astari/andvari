

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

    var parser = argparseWrapper();
    var subparsers = parser.addSubparsers({
        title:'subcommands',
        dest: 'action'
    });

    subparsers.addParser( 'init', {addHelp:true, description: 'Init an Andvari Web Site',}
    ).addArgument(
        [ '-t', '--titel' ], { action: 'store', type: 'string', help: 'The Title of the web site', defaultValue: 'My Blog'}
    ).addArgument(
        [ '-d', '--description' ], { action: 'store', type: 'string', help: 'A meta description of the site', defaultValue: 'I write about stuff'}
    ).addArgument(
        [ '--themeRepo' ], { action: 'store', type: 'string', help: 'The Github repo to use as the theme', defaultValue: 'git@github.com:hexojs/hexo-theme-landscape.git'}
    ).addArgument(
        [ '--themeName' ], { action: 'store', type: 'string', help: 'The name used to identify the theme', defaultValue: 'landscape'}
    );

    subparsers.addParser( 'build',  {addHelp:true, description: ''});
    subparsers.addParser( 'deploy', {addHelp:true, description: ''});
    subparsers.addParser( 'server', {addHelp:true, description: ''}
    ).addArgument(
        ['-p', '--port' ], {action: 'store', type: 'int', help: 'Port Development Server listenes on', defaultValue: 4000}
    );

    var args = parser.parseArgs();

    try {
        var action = require('../lib/' + args.action);
        action(args);
    }
    catch(error) {
        console.log(error);
        console.dir(argparse);
    }
}

module.exports = andvari;