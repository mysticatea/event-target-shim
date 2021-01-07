import babel from "@rollup/plugin-babel"
import typescript from "@rollup/plugin-typescript"
import { terser } from "rollup-plugin-terser"

const babelBaseConfig = {
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
}

function sourcemapPathTransform(path) {
    return path.startsWith("../") ? path.slice("../".length) : path
}

export default [
    {
        input: "src/index.ts",
        output: {
            file: "dist/index.mjs",
            format: "es",
            sourcemap: true,
            sourcemapPathTransform,
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
            sourcemapPathTransform,
        },
        plugins: [typescript({ tsconfig: "tsconfig/build.json" })],
    },
    {
        external: id => id.startsWith("@babel/runtime/"),
        input: "dist/index.mjs",
        output: {
            file: "dist/es5.mjs",
            format: "es",
        },
        plugins: [
            babel({
                ...babelBaseConfig,
                babelHelpers: "runtime",
                plugins: [["@babel/transform-runtime", { useESModules: true }]],
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
        },
        plugins: [
            babel({
                ...babelBaseConfig,
                babelHelpers: "runtime",
                plugins: ["@babel/transform-runtime"],
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
        },
        plugins: [
            terser(),
            babel({
                ...babelBaseConfig,
                babelHelpers: "bundled",
            }),
        ],
    },
]
