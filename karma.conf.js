"use strict"

module.exports = function(config) {
    config.set({
        basePath: "",
        frameworks: ["browserify", "mocha"],
        files: ["test/*.js"],
        browsers: ["Chrome", "Firefox", "IE"],
        reporters: ["progress", "coverage"],
        preprocessors: {"test/*.js": ["browserify"]},

        browserify: {
            debug: false,
            extensions: [".js"],
            transform: ["browserify-istanbul", "espowerify"],
        },
        coverageReporter: {
            type: "html",
            dir: "coverage/",
        },
    })
}
