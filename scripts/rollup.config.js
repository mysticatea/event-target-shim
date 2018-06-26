import babel from "rollup-plugin-babel"
import minify from "rollup-plugin-babel-minify"

const banner = `/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */`
const cjsOutro = `module.exports = EventTarget
module.exports.EventTarget = module.exports["default"] = EventTarget
module.exports.defineEventAttribute = defineEventAttribute
`
const umdOutro = `if (typeof module === "undefined" && typeof define === "undefined") {
    const global = Function("return this")()
    global.EventTargetShim = EventTarget
    global.EventTargetShim.defineEventAttribute = defineEventAttribute
}
`

export default [
    {
        input: "src/event-target.mjs",
        output: {
            file: "dist/event-target-shim.mjs",
            sourcemapFile: "dist/event-target-shim.mjs.map",
            sourcemap: true,
            format: "es",
            banner,
        },
    },
    {
        input: "src/event-target.mjs",
        output: {
            file: "dist/event-target-shim.js",
            sourcemapFile: "dist/event-target-shim.js.map",
            sourcemap: true,
            format: "cjs",
            banner,
            outro: cjsOutro,
        },
    },
    {
        input: "src/event-target.mjs",
        output: {
            file: "dist/event-target-shim.umd.js",
            sourcemapFile: "dist/event-target-shim.umd.js.map",
            sourcemap: true,
            format: "umd",
            name: "EventTargetShim",
            outro: umdOutro,
        },
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
    },
]
