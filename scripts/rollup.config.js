import babel from "@rollup/plugin-babel"
import typescript from "@rollup/plugin-typescript"
import { terser } from "rollup-plugin-terser"

export default [
    {
        input: "src/index.ts",
        output: {
            file: "dist/index.mjs",
            format: "es",
            sourcemap: true,
        },
        plugins: [typescript({ tsconfig: "tsconfig/build.json" })],
    },
    {
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
        external: id => id.startsWith("@babel/runtime/"),
        input: "dist/index.mjs",
        output: {
            file: "dist/es5.mjs",
            format: "es",
            sourcemap: true,
        },
        plugins: [
            babel({
                babelHelpers: "runtime",
                babelrc: false,
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
        ],
    },
    {
        external: id => id.startsWith("@babel/runtime/"),
        input: "dist/index.mjs",
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
        ],
    },
    {
        input: "dist/index.mjs",
        output: {
            exports: "named",
            file: "dist/umd.js",
            format: "umd",
            name: "EventTargetShim",
            sourcemap: true,
        },
        plugins: [
            terser(),
            babel({
                babelHelpers: "bundled",
                babelrc: false,
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
        ],
    },
]
