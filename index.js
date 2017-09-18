'use strict'

var fs = require('fs-extra')
var htmlparser = require('htmlparser')
var npm = require('npm')
var request = require('request')
var select = require('soupselect').select
var targz = require('tar.gz')

var webpage = 'https://www.npmjs.com/browse/depended'
var tempDir = './tmp/'


// I found an API that kind of lets you query the npm package registry
// but I've built a couple web scrapers in the last couple months so
// I've gotten pretty proficient at making them

function requestTopPackages(callback) {
    request(webpage, function(error, response, body) {
        var handler = new htmlparser.DefaultHandler(function (error, dom) {
            if (error) {
                callback([], 'There was a problem parsing the webpage')
            }

            parseTopPackages(dom, callback)
        });

        var parser = new htmlparser.Parser(handler)
        parser.parseComplete(body)
    });
}

function parseTopPackages(dom, callback) {
    var listElements = select(dom, '.package-details h3 a')

    if (listElements && listElements.length > 0) {
        var items = []

        listElements.forEach(function (element) {
            var name = element.children[0]
            items.push(name.raw)
        })

        callback(items, null)
    } else {
        callback([], 'No packages found')
    }
}

function downloadPackage(pkg, callback) {
    npm.load({
        loaded: false
    }, function (err) {
        if (err) {
            callback(false, 'Could not load npm')
            return
        }

        // download

        console.log(pkg)

        npm.commands.info([pkg], function(error, data) {
            // a little hacky :/
            var latest = Object.keys(data)[0]
            var info = data[latest]
            var url = info.dist.tarball

            var tmpPkgLoc = tempDir + pkg


            var rs = request(url);
            var ws = targz().createWriteStream(tmpPkgLoc);

            ws.on('close', function() {
                console.log('done!!')

                // fs.move('./tmp/package', './packages/level')
            })


            rs.pipe(ws);
        })
    })
}



function downloadTopPackages (count, callback) {
    requestTopPackages(function(list, error) {
        if (error) {
            console.log('ERROR: ' + error)
            return
        }

        var topList = list.slice(0, count)

        console.log(topList)

        downloadPackage(topList[0], function(completed, error) {

        })
    })
}

module.exports = downloadTopPackages
