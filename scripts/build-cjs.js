"use strict"

const rollup = require("rollup")
const banner = `/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */`
const outro = `module.exports = EventTarget
module.exports.EventTarget = module.exports["default"] = EventTarget
module.exports.defineEventAttribute = defineEventAttribute
`

;(async () => {
    const bundle = await rollup.rollup({
        input: "src/event-target.mjs",
        plugins: [],
    })
    await bundle.write({
        file: "dist/event-target-shim.js",
        sourcemapFile: "dist/event-target-shim.js.map",
        sourcemap: true,
        format: "cjs",
        banner,
        outro,
    })
})().catch(error => {
    console.error(error) //eslint-disable-line no-console
    process.exitCode = 1
})
