import babel from "@rollup/plugin-babel"
import typescript from "@rollup/plugin-typescript"
import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import json from "@rollup/plugin-json"
import { terser } from "rollup-plugin-terser"

export default [
    {
        external: ["domexception"],
        input: "src/index.ts",
        output: {
            file: "dist/index.mjs",
            format: "es",
            sourcemap: true,
        },
        plugins: [typescript({ tsconfig: "tsconfig/build.json" })],
    },
    {
        external: ["domexception"],
        input: "src/index.ts",
        output: {
            exports: "named",
            file: "dist/index.js",
            format: "cjs",
            sourcemap: true,
        },
        plugins: [typescript({ tsconfig: "tsconfig/build.json" })],
    },
    {
        external: id =>
            id === "domexception" || id.startsWith("@babel/runtime/"),
        input: "src/index.ts",
        output: {
            file: "dist/es5.mjs",
            format: "es",
            sourcemap: true,
        },
        plugins: [
            babel({
                babelHelpers: "runtime",
                babelrc: false,
                extensions: [".ts", ".mjs", ".cjs", ".js", ".json"],
                plugins: [["@babel/transform-runtime", { useESModules: true }]],
                presets: [
                    [
                        "@babel/env",
                        {
                            modules: false,
                            targets: "IE 11",
                            useBuiltIns: false,
                        },
                    ],
                ],
                sourceMaps: true,
            }),
            typescript({ tsconfig: "tsconfig/build.json" }),
        ],
    },
    {
        external: id =>
            id === "domexception" || id.startsWith("@babel/runtime/"),
        input: "src/index.ts",
        output: {
            exports: "named",
            file: "dist/es5.js",
            format: "cjs",
            sourcemap: true,
        },
        plugins: [
            babel({
                babelHelpers: "runtime",
                babelrc: false,
                extensions: [".ts", ".mjs", ".cjs", ".js", ".json"],
                plugins: ["@babel/transform-runtime"],
                presets: [
                    [
                        "@babel/env",
                        {
                            modules: false,
                            targets: "IE 11",
                            useBuiltIns: false,
                        },
                    ],
                ],
                sourceMaps: true,
            }),
            typescript({ tsconfig: "tsconfig/build.json" }),
        ],
    },
    {
        input: "src/index.ts",
        output: {
            exports: "named",
            file: "dist/umd.js",
            format: "umd",
            name: "EventTargetShim",
            sourcemap: true,
        },
        plugins: [
            resolve(),
            terser(),
            commonjs(),
            json(),
            babel({
                babelHelpers: "bundled",
                babelrc: false,
                extensions: [".ts", ".mjs", ".cjs", ".js", ".json"],
                presets: [
                    [
                        "@babel/env",
                        {
                            modules: false,
                            targets: "IE 11",
                            useBuiltIns: false,
                        },
                    ],
                ],
                sourceMaps: true,
            }),
            typescript({ tsconfig: "tsconfig/build.json" }),
        ],
    },
]
