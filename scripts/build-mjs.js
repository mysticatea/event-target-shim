"use strict"

const rollup = require("rollup")
const banner = `/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */`

;(async () => {
    const bundle = await rollup.rollup({
        input: "src/event-target.mjs",
        plugins: [],
    })
    await bundle.write({
        file: "dist/event-target-shim.mjs",
        sourcemapFile: "dist/event-target-shim.mjs.map",
        sourcemap: true,
        format: "es",
        banner,
    })
})().catch(error => {
    console.error(error) //eslint-disable-line no-console
    process.exitCode = 1
})
