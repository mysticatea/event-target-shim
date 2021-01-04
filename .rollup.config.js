import babel from "@rollup/plugin-babel"
import typescript from "@rollup/plugin-typescript"

export default [
    {
        external: ["domexception"],
        input: "src/index.ts",
        output: {
            file: "dist/index.mjs",
            sourcemap: true,
            format: "es",
        },
        plugins: [typescript({ tsconfig: "tsconfig/build.json" })],
    },
    {
        external: ["domexception"],
        input: "src/index.ts",
        output: {
            exports: "named",
            file: "dist/index.js",
            sourcemap: true,
            format: "cjs",
        },
        plugins: [typescript({ tsconfig: "tsconfig/build.json" })],
    },
    {
        external: id =>
            id === "domexception" || id.startsWith("@babel/runtime/"),
        input: "src/index.ts",
        output: {
            exports: "named",
            file: "dist/es5.js",
            sourcemap: true,
            format: "cjs",
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
]
