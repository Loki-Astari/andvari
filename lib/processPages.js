function pushOrApply(dst, value) {
    if (Array.isArray(value)) {
        dst = dst.concat(value);
    }
    else {
        dst.push(value);
    }
    return dst;
}
function uniqueIfy(dst) {
    return dst.filter(function(value, index, self) { 
        return self.indexOf(value) === index;
    });
}
function buildPageDataFrom(appData, list, action) {
    var avutil = require('../lib/util');
    for(var loop = 0; loop < list.length; loop++) {
        var fileName = action.getName(list[loop]);
        var baseDir = action.getDir(list[loop]);
        var filePath = fileName.replace(baseDir, '');
        var fileText = action.getFileText(fileName);
        var matterData = action.matter(fileText);

        var pageData = Object.assign({
            title:          action.defaultTitle(list[loop]), // Article title	string
            draft:          false,
            date:           action.getCtime(fileName), // Article created date	Moment.js object
            updated:        action.getMtime(fileName), // Article last updated date	Moment.js object
            comments:       action.useComments(),           // Comment enabled or not	boolean
            comment:        appData.config.comment,
            layout:         action.defaultLayout(fileName),  // Layout name	string
            content:        '',             // The full processed content of the article	string
            full_source:    fileName,       // source/blog/2016-04-09-socket-read.md
            source:         filePath,       // blog/2016-04-09-socket-read.md
            path:           null,           // /blog/2016/04/09/socket-read/index.html
            permlink:       null,           // http://site.com/blog/2016/04/09/socket-read/
            prev:           null,           // The previous post, null if the post is the first post	???
            next:           null,           // The next post, null if the post is the last post	???
            raw:            fileText,       // The raw data of the article	???
            link:           '',             // The external link of the article (Used in link posts)	string
            series:         [],
            categories:     [],
            tags:           [],
            srcLoc:         baseDir,
        }, matterData.data);
        pageData.content = matterData.content;

        /*
         * If `path` or `permlink` are defined in the page front matter then we will use it.
         * Otherwise we use the scripts/permlink.js function to build a permlink.
         * The default one uses the filename (as in page.source) but this can be overridden
         * by the layout or the blog by defining this function.
         */
        var permfile = appData.permlink(pageData.source, pageData.layout);
        var permlink = permfile.substr(0, permfile.lastIndexOf('/')) + '/';
        if (!pageData.path) {
            pageData.path = permfile;
        }
        if (!pageData.permlink) {
            pageData.permlink   = appData.config.site + permlink;
        }
        /* Make sure we have the directory to place the final article. */
        if (permlink != '') {
            avutil.buildSiteDir(appData, '', permlink);
        }

        appData.site.pages.push(pageData);
    }
}
function buildPageData(appData) {
    return new Promise(function(resolve, reject) {
        action = {
            getName:        page => page.obj,
            getDir:         page => page.dir,
            defaultTitle:   page => '',
            getCtime:       fileName => {var fs = require('fs');var stat = fs.statSync(fileName);return stat.ctime;},
            getMtime:       fileName => {var fs = require('fs');var stat = fs.statSync(fileName);return stat.mtime;},
            useComments:    () => true,
            defaultLayout:  fileName => {var objectPath = fileName.split('/');
                                           objectPath.pop(); // Pop file name
                                           return objectPath.pop();
                                        },
            getFileText:    fileName => {var fs = require('fs');return fs.readFileSync(fileName);},
            matter:         fileText => {var matter = require('gray-matter');
                                         var matterData = matter(fileText);
                                         if (!matterData.data.categories) {
                                            matterData.data.categories = [];
                                         }
                                         else if (!Array.isArray(matterData.data.categories)) {
                                            matterData.data.categories = matterData.data.categories.split(',');
                                         }
                                         return matterData; 
                                        },
        };
        buildPageDataFrom(appData, appData.pageSources, action);
        resolve();
    });
}
function buildCategoryPages(appData) {
    return new Promise(function(resolve, reject) {
        action = {
            getName:        category => appData.app.dir.src + '/categories/' + category + '/index.html',
            getDir:         category => appData.app.dir.src,
            defaultTitle:   category => category,
            getCtime:       fileName => 0,
            getMtime:       fileName => 0,
            useComments:    () => false,
            defaultLayout:  fileName => 'category',
            getFileText:    fileName => '',
            matter:         fileText => {return {data: {}, content: ''};},
        };
        buildPageDataFrom(appData, appData.site.categories, action);
        resolve();
    });
}
function sortPosts(appData) {
    return new Promise(function(resolve, reject) {
        // Sort pages into date order.
        appData.site.posts = appData.site.pages.filter(page => (page.layout == 'post'))
        .sort(function(lhs, rhs) {
            var l = new Date(lhs.date);
            var r = new Date(rhs.date);
            return r - l;
        });
        resolve();
    });
}
function linkPostPrevNext(appData) {
    return new Promise(function(resolve, reject) {
        for(var loop = 0; loop < appData.site.posts.length; loop++) {
            appData.site.posts[loop].prev = (loop == 0) ? null : appData.site.posts[loop - 1];
            appData.site.posts[loop].next = (loop == appData.site.posts.length - 1) ? null : appData.site.posts[loop + 1];
        }
        resolve();
    });
}
function buildSiteInfo(appData) {
    return new Promise(function(resolve, reject) {
        for(var loop = 0; loop < appData.site.posts.length; loop++) {
            appData.site.series = pushOrApply(appData.site.series, appData.site.posts[loop].series);
            appData.site.categories = pushOrApply(appData.site.categories, appData.site.posts[loop].categories);
            appData.site.tags = pushOrApply(appData.site.tags, appData.site.posts[loop].tags);
            appData.site.dates.push(appData.site.posts[loop].date);
        }
        appData.site.series = uniqueIfy(appData.site.series);
        appData.site.categories = uniqueIfy(appData.site.categories);
        appData.site.tags = uniqueIfy(appData.site.tags);
        appData.site.dates = uniqueIfy(appData.site.dates);

        resolve();
    });
}
function buildHtmlFromMd(appData, page, reject) {
    return new Promise(function(resolve, reject) {
        var src = page.srcLoc + page.source;
        var dst = appData.app.dir.public + page.path;

        var layout = appData.layouts.find(function(element) {
            return element.name == page.layout;
        });
        if (!layout) {
            reject('Invalid Page Layout: ' + page.layout);
        }

        var fs = require('fs');
        var ejs = require('ejs');
        html = ejs.renderFile(appData.app.dir.themeLayout + 'page.ejs', Object.assign({}, appData, {page: page}), function(err, result) {
            if (err) {reject(err);}
            else {
                fs.writeFileSync(dst, result);
            }
        });
    })
    .catch(err => reject(err));
}
function buildCssFromStyl(appData, page, reject) {
    return new Promise(function(resolve, reject) {
        var fileText = fs.readFileSync(page.obj,{encoding: 'utf8'});
        var dst = page.obj.replace(dir, appData.app.dir.public).replace(/.styl$/, '.css');
        try
        {
            stylus(fileText)
            .set('filename', dst)
            .include(require('nib').path)
            .include(page.obj.substring(0, obj.lastIndexOf("/")))
            .render(function(err, css){
                if (err) throw err;
            });
        }
        catch(err) {
            reject(err);
        }
    })
    .catch(err => reject(err));
}
function CopyOtherFiles(appData, page, reject) {
    return new Promise(function(resolve, reject) {
        var src = page.obj;
        var dst = page.obj.replace(page.dir, appData.app.dir.public);
        var fs = require('fs');
        fs.createReadStream(src).pipe(fs.createWriteStream(dst));
        resolve();
    })
    .catch(err => reject(err));
}
function buildAllFiles(appData, list, text, sub, src) {
    return new Promise(function(resolve, reject) {
        for(var loop = 0; loop < list.length; loop++) {
            console.log('\t' + text + ': ' + src(list[loop]));
            sub(appData, list[loop], reject);
        }
    })
    .catch(err => {throw err;});
}
function processPages(appData) {

    var avutil = require('../lib/util');
    var fs = require('fs');
    var stylus = require('stylus');
    var matter = require('gray-matter');

    buildPageData(appData)
    .then(() => sortPosts(appData))
    .then(() => linkPostPrevNext(appData))
    .then(() => buildSiteInfo(appData))
    .then(() => buildCategoryPages(appData))
    .then(function() {

        buildAllFiles(appData, appData.site.pages, 'Transforming', buildHtmlFromMd, (page) => page.srcLoc + page.source);
        buildAllFiles(appData, appData.stylus, 'Compiling', buildCssFromStyl, (page) => page.obj);
        buildAllFiles(appData, appData.copyFiles, 'Copying', CopyOtherFiles, (page) => page.obj);
    })
    .catch(err => {throw err;});
}

module.exports = processPages;

