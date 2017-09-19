'use strict'

var fs = require('fs')
var htmlparser = require('htmlparser')
var mv = require('mv')
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
        })

        var parser = new htmlparser.Parser(handler)
        parser.parseComplete(body)
    })
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
    npm.load(function (error) {
        if (error) {
            callback(false, 'Could not load npm')
            return
        }

        // npm command to get package info, extracting the package URL
        npm.commands.view([pkg, 'dist'], function(error, data) {
            // a little hacky :/
            var latest = Object.keys(data)[0]
            var info = data[latest]
            var url = info.dist.tarball

            var tmpGzipLoc = tempDir + pkg + '.tgz'
            var tmpPkgLoc = tempDir + pkg
            var pkgPkgLoc = './packages/' + pkg

            var rs = request(url).pipe(fs.createWriteStream(tmpGzipLoc))
            rs.on('close', function() {
                targz().extract(tmpGzipLoc, tmpPkgLoc, function(error) {
                    if(error) {
                        console.log(error.stack)
                        callback(false, 'Unable to extract tar contents')
                    }

                    // tar files are always unpacked into a /package directory
                    // moving that from tmp to /packages
                    mv(tmpPkgLoc + '/package', pkgPkgLoc, {mkdirp: true}, function(error) {
                        callback(true, null)
                    })
                })
           })
        })
    })
}

function downloadPackagesSequential(packages, callback) {
    if (packages.length > 0) {
        var pkg = packages.pop()
        downloadPackage(pkg, function(completed, error) {
            if (completed) {
                downloadPackagesSequential(packages, callback)
            }
        })
    } else {
        callback()
    }
}

function downloadTopPackages (count, callback) {
    requestTopPackages(function(list, error) {
        if (error) {
            console.log('ERROR: ' + error)
            return
        }

        var topList = list.slice(0, count)
        downloadPackagesSequential(topList, callback)
    })
}

module.exports = downloadTopPackages
