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
    var global = Function("return this")()
    global.EventTargetShim = EventTarget
    global.EventTargetShim.defineEventAttribute = defineEventAttribute
}
`

export default [
    {
        input: "src/event-target.mjs",
        output: {
            file: "dist/event-target-shim.mjs",
            sourcemap: true,
            format: "es",
            banner,
        },
    },
    {
        input: "src/event-target.mjs",
        output: {
            file: "dist/event-target-shim.js",
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
            sourcemap: true,
            format: "umd",
            name: "EventTargetShim",
            outro: umdOutro,
        },
        plugins: [
            babel({
                babelrc: false,
                presets: [
                    [
                        "@babel/preset-env",
                        { modules: false, targets: { browsers: ["ie 11"] } },
                    ],
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
