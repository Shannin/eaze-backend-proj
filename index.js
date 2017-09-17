'use strict'

var request = require('request')
var htmlparser = require('htmlparser')
var select = require('soupselect').select

var webpage = 'https://www.npmjs.com/browse/depended'


// I found an API that kind of lets you query the npm package registry
// but I've built a couple web scrapers in the last couple months so
// I've gotten pretty proficient at making them

function requestTopPackages(callback) {
    request({
        uri: webpage,
    }, function(error, response, body) {
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





function downloadPackages (count, callback) {
    requestTopPackages(function(list, error) {
        console.log(list)
    })
}

module.exports = downloadPackages