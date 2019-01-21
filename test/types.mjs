/*eslint-env node */
import path from "path"
import { TypeTester } from "type-tester"
import ts from "typescript"

const tester = new TypeTester(ts)

describe("TypeScript type definitions", () => {
    describe("'index.d.ts' should have no error even if it was compiled without 'lib.dom.d.ts'.", () => {
        tester.verify([path.resolve(__dirname, "../index.d.ts")], {
            lib: ["lib.es5.d.ts"],
            strict: true,
        })
    })

    tester.verify([path.resolve(__dirname, "fixtures/types.ts")], {
        lib: ["lib.es5.d.ts", "lib.dom.d.ts"],
        strict: true,
    })
})
