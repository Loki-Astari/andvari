

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

function stringToBool(arg) {
    if (arg.toLowerCase() == 'true') {
        return true;
    }
    if (arg.toLowerCase() == 'false') {
        return false;
    }
    throw 'Argument: (' + arg + ') is not a Boolean';
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
        [ '--dest' ], { action: 'store', type: 'string', help: 'A directory where the blog will be built', defaultValue: 'public/'}
    ).addArgument(
        [ '--themeRepo' ], { action: 'store', type: 'string', help: 'The Github repo to use as the theme', defaultValue: 'git@github.com:Loki-Astari/andvari-theme-landscape.git'}
    ).addArgument(
        [ '--themeName' ], { action: 'store', type: 'string', help: 'The name used to identify the theme', defaultValue: 'landscape'}
    ).addArgument(
        [ 'repo' ], { action: 'store', type: 'string', help: 'The github repo for the blog or a directory to hold the articles.\n'
                                                           + 'If a directory then the --dest flag indicates where the blog will be built.'}
    );

    subparsers.addParser( 'build',  {addHelp:true, description: ''});
    subparsers.addParser( 'deploy', {addHelp:true, description: ''});
    subparsers.addParser( 'server', {addHelp:true, description: ''})
    .addArgument(
        ['-p', '--port' ], {action: 'store', type: 'int', help: 'Port Development Server listenes on', defaultValue: 4000}
    );
    subparsers.addParser( 'post',   {addHelp:true, description: ''})
    .addArgument(
        ['section'],{action: 'store', type: 'string', help: 'The directory (section) to store an article'}
    )
    .addArgument(
        ['article'],{action: 'store', type: 'string', help: 'The name of the article. Used in file name (and thus permlink) and default title.'}
    )
    .addArgument(['--layout'],{action: 'store', type: 'string', help: '', defaultValue: 'post'})
    .addArgument(['--comments'],{action: 'store', type: stringToBool, help: '', defaultValue: true})
    .addArgument(['--categories'],{action: 'store', type: 'string', help: '', defaultValue: ''})
    .addArgument(['--series'],{action: 'store', type: 'string', help: '', defaultValue: ''})
    .addArgument(['--tags'],{action: 'store', type: 'string', help: '', defaultValue: ''})
    .addArgument(['--subtitle'],{action: 'store', type: 'string', help: '', defaultValue: ''})
    .addArgument(['--author'],{action: 'store', type: 'string', help: '', defaultValue: null})
    .addArgument(['--description'],{action: 'store', type: 'string', help: '', defaultValue: ''})
    ;


    var args = parser.parseArgs();

    var fs = require('fs');
    var file = './config.json';
    var themeName = 'landscape';
    if (fs.existsSync(file)) {
        var data = fs.readFileSync(file);
        themeName = JSON.parse(data).theme;
    }

    var blogRoot = path.normalize('.') + '/';
    if (args.action == 'init' && (!args.repo.startsWith('https://') && !args.repo.startsWith('git@'))) {
        blogRoot += args.repo + '/';
    }
    var themeRoot = blogRoot + '/themes/' + themeName + '/';
    var appRoot = path.dirname(require.main.filename) + '/../';
    var appDir = {
        appRoot:    path.normalize(appRoot),
        appScript:  path.normalize(appRoot + '/script/'),
        appLayout:  path.normalize(appRoot + '/layout/'),
        skelRoot:   path.normalize(appRoot + '/skel/'),

        themeRoot:  path.normalize(themeRoot),
        themeSource:path.normalize(themeRoot + '/source/'),
        themeLayout:path.normalize(themeRoot + '/layout/'),
        themeScript:path.normalize(themeRoot + '/script/'),

        root:       path.normalize(blogRoot),
        src:        path.normalize(blogRoot + '/source/'),
        layout:     path.normalize(blogRoot + '/layout/'),
        themes:     path.normalize(blogRoot + '/themes/'),
        public:     path.normalize(blogRoot + '/public/'),
        deploy:     path.normalize(blogRoot + '/deploy/'),
        script:     path.normalize(blogRoot + '/script/'),

        source:     blogRoot,
        master:     blogRoot,
    };

    /*
     * If we are not using branches then we build things inthe deploy location
     * Not the master branch specifically
     */
    if (args.action == 'init' && (!args.repo.startsWith('https://') && !args.repo.startsWith('git@'))) {
        appDir.master   = appDir.deploy;
    }


    var gitInfo = {
        sourceBranch:     'source',
        siteBranch:       'master'
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
