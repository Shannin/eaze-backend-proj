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
                callback(null, 'There was a problem parsing the webpage')
            }

            parseTopPackages(dom)
        });

        var parser = new htmlparser.Parser(handler)
        parser.parseComplete(body)
    });
}

function parseTopPackages(dom) {
    var items = []

    var listElements = select(dom, '.package-details h3 a')

    listElements.forEach(function (element) {
        var name = element.children[0]

        console.log(name.raw)
    })
}





function downloadPackages (count, callback) {

}

module.exports = downloadPackages