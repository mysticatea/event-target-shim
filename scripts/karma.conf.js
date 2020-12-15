"use strict"

function interop(x) {
    return x.default || x
}

const babel = interop(require("@rollup/plugin-babel"))
const commonjs = interop(require("@rollup/plugin-commonjs"))
const json = interop(require("@rollup/plugin-json"))
const resolve = interop(require("@rollup/plugin-node-resolve"))

module.exports = function(config) {
    config.set({
        basePath: "..",
        frameworks: ["mocha"],
        files: ["test/index.mjs"],
        browsers: ["Chrome", "Firefox", "IE"],
        reporters: ["progress"],
        preprocessors: { "test/index.mjs": ["rollup"] },
        rollupPreprocessor: {
            plugins: [
                resolve({ browser: true, preferBuiltins: false }),
                commonjs(),
                json(),
                babel({
                    babelrc: false,
                    presets: [
                        [
                            "@babel/preset-env",
                            {
                                modules: false,
                                targets: { browsers: ["ie 11"] },
                            },
                        ],
                    ],
                    babelHelpers: "bundled",
                }),
            ],
            output: {
                format: "iife",
                name: "EventTargetShim",
                sourcemap: "inline",
            },
        },
    })
}
