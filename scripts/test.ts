import chalk from "chalk"
import crypto from "crypto"
import fs from "fs"
import { CoverageMap, createCoverageMap } from "istanbul-lib-coverage"
import { createContext as createCoverageContext } from "istanbul-lib-report"
import { createSourceMapStore } from "istanbul-lib-source-maps"
import { create as createCoverageReporter } from "istanbul-reports"
import os from "os"
import path from "path"
import playwright from "playwright"
import rimraf from "rimraf"
import url from "url"
import util from "util"
import webpackCallback, { Configuration, ProvidePlugin, Stats } from "webpack"

const writeFile = util.promisify(fs.writeFile)
const mkdir = util.promisify(fs.mkdir)
const rmdir = util.promisify(rimraf)
const webpack = util.promisify<Configuration, Stats | undefined>(
    webpackCallback,
)

main(process.argv.slice(2)).catch(error => {
    process.exitCode = 1
    console.error(error)
})

async function main(argv: readonly string[]) {
    const testOnNode = !argv.includes("--only-browsers")
    const testOnBrowsers = !argv.includes("--only-node")
    const workspacePath = path.join(
        os.tmpdir(),
        `event-target-shim-${crypto.randomBytes(4).toString("hex")}`,
    )
    const coverageMap = createCoverageMap()

    await mkdir(workspacePath)
    try {
        await buildTests(workspacePath, testOnNode, testOnBrowsers)
        await runTests(workspacePath, coverageMap, testOnNode, testOnBrowsers)
        reportCoverage(coverageMap)
    } finally {
        await rmdir(workspacePath)
    }
}

async function buildTests(
    workspacePath: string,
    testOnNode: boolean,
    testOnBrowsers: boolean,
): Promise<void> {
    console.log("======== Build Tests ".padEnd(80, "="))

    if (testOnNode) {
        await build(workspacePath, false)
    }
    if (testOnBrowsers) {
        await writeFile(
            path.join(workspacePath, "playwright.html"),
            '<!DOCTYPE html>\n<html><head><meta charset="UTF-8"></head><body><script src="playwright.js"></script></body></html>',
        )
        await build(workspacePath, true)
    }

    console.log("Done!")
}

async function runTests(
    workspacePath: string,
    coverageMap: CoverageMap,
    testOnNode: boolean,
    testOnBrowsers: boolean,
): Promise<void> {
    console.log("======== Run Tests ".padEnd(80, "="))

    let failures = 0

    if (testOnNode) {
        failures += await runTestsOnNode(workspacePath, coverageMap)
    }
    if (testOnBrowsers) {
        failures += await runTestsOnBrowsers(workspacePath, coverageMap)
    }

    console.log("-------- Result ".padEnd(80, "-"))
    if (failures) {
        console.log(chalk.bold.redBright("%d test cases failed."), failures)
        process.exitCode = 1
    } else {
        console.log(chalk.greenBright("All test cases succeeded ❤️"))
    }
}

async function runTestsOnNode(
    workspacePath: string,
    coverageMap: CoverageMap,
): Promise<number> {
    console.log(chalk.magentaBright("-------- node ".padEnd(80, "-")))

    await import(path.join(workspacePath, "node.js"))
    const { coverage, failures } = await (global as any).result

    await mergeCoverageMap(coverageMap, coverage)

    console.log()
    return failures
}

async function runTestsOnBrowsers(
    workspacePath: string,
    coverageMap: CoverageMap,
): Promise<number> {
    let failures = 0
    for (const browserType of ["chromium", "firefox", "webkit"] as const) {
        console.log(
            chalk.magentaBright(`-------- ${browserType} `.padEnd(80, "-")),
        )

        const browser = await playwright[browserType].launch()
        try {
            const context = await browser.newContext()
            const page = await context.newPage()

            // Redirect console logs.
            let consolePromise = Promise.resolve()
            page.on("console", msg => {
                consolePromise = consolePromise
                    .then(() => Promise.all(msg.args().map(h => h.jsonValue())))
                    .then(args => console.log(...args))
            })

            // Run tests.
            await page.goto(
                url
                    .pathToFileURL(path.join(workspacePath, "playwright.html"))
                    .toString(),
            )

            // Get result.
            const result = await page.evaluate<any>("result")
            failures += result.failures
            await consolePromise

            // Merge coverage data.
            await mergeCoverageMap(coverageMap, result.coverage)
        } finally {
            await browser.close()
        }
        console.log()
    }

    return failures
}

async function build(
    workspacePath: string,
    forBrowsers: boolean,
): Promise<void> {
    const conf: Configuration = {
        devtool: "inline-source-map",
        entry: path.resolve("test/fixtures/entrypoint.ts"),
        mode: "development",
        module: {
            rules: [
                {
                    test: /\.ts$/u,
                    include: [path.resolve(__dirname, "../src")],
                    loader: "babel-loader",
                    options: {
                        babelrc: false,
                        plugins: ["istanbul"],
                        sourceMaps: "inline",
                    },
                },
                {
                    test: /\.ts$/u,
                    loader: "ts-loader",
                    options: {
                        configFile: path.resolve("tsconfig/test.json"),
                        transpileOnly: true,
                    },
                },
            ],
        },
        output: {
            devtoolModuleFilenameTemplate: path.resolve("[resource-path]"),
            path: workspacePath,
            filename: "node.js",
        },
        resolve: {
            extensions: [".ts", ".mjs", ".cjs", ".js", ".json"],
        },
        target: "node",
    }

    if (forBrowsers) {
        conf.output!.filename = "playwright.js"
        conf.plugins = [
            new ProvidePlugin({
                Buffer: ["buffer/", "Buffer"],
                process: "process/browser",
            }),
        ]
        conf.resolve!.fallback = {
            assert: require.resolve("assert/"),
            buffer: require.resolve("buffer/"),
            fs: require.resolve("./empty.js"),
            path: require.resolve("path-browserify"),
            stream: require.resolve("stream-browserify"),
            url: require.resolve("url/"),
            util: require.resolve("util/"),
        }
        conf.target = "web"
    }

    const stats = await webpack(conf)
    if (stats?.hasErrors()) {
        throw new Error(stats.toString())
    }
}

async function mergeCoverageMap(
    coverageMap: CoverageMap,
    rawData: any,
): Promise<void> {
    const sourceMapStore = createSourceMapStore()
    const mappedData = toJSON(
        await sourceMapStore.transformCoverage(createCoverageMap(rawData)),
    )

    const normalizedData = Object.entries(mappedData)
        .map(([k, v]) => [
            path.normalize(k),
            { ...toJSON(v), path: path.normalize(k) },
        ])
        // eslint-disable-next-line no-sequences
        .reduce<any>((obj, [k, v]) => ((obj[k] = v), obj), {})

    try {
        coverageMap.merge(normalizedData)
    } catch (err) {
        console.log(normalizedData)
        throw err
    }
}

function reportCoverage(coverageMap: CoverageMap): void {
    const context = createCoverageContext({ coverageMap, dir: "coverage" })

    // 出力する
    ;(createCoverageReporter("text-summary") as any).execute(context)
    ;(createCoverageReporter("lcov") as any).execute(context)
    console.log('See "coverage/lcov-report/index.html" for details.')
    console.log()
}

function toJSON(x: any): any {
    return typeof x.toJSON === "function" ? toJSON(x.toJSON()) : x
}
