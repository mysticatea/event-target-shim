"use strict"

const rollup = require("rollup")
const babel = require("rollup-plugin-babel")
const minify = require("rollup-plugin-babel-minify")
const banner = `/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */`
const outro = `if (typeof module === "undefined" && typeof define === "undefined") {
    const global = Function("return this")
    global.EventTargetShim = EventTarget
    global.EventTargetShim.defineEventAttribute = defineEventAttribute
}
`

;(async () => {
    const bundle = await rollup.rollup({
        input: "src/event-target.mjs",
        plugins: [
            babel({
                babelrc: false,
                presets: [
                    ["env", { modules: false, targets: { browsers: ["ie 11"] } }],
                ],
            }),
            minify({
                comments: false,
                banner,
                sourceMap: true,
            }),
        ],
    })
    await bundle.write({
        file: "dist/event-target-shim.umd.js",
        sourcemapFile: "dist/event-target-shim.umd.js.map",
        sourcemap: true,
        format: "umd",
        name: "EventTargetShim",
        outro,
    })
})().catch(error => {
    console.error(error) //eslint-disable-line no-console
    process.exitCode = 1
})
