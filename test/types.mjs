/*eslint-env node */
import assert from "assert"
import path from "path"
import ts from "typescript"

const TARGET_FILE = path.resolve(__dirname, "../index.d.ts")
const FIXTURE_FILE = path.resolve(__dirname, "fixtures/types.ts")

describe("TypeScript type definitions", () => {
    describe("'index.d.ts'", () => {
        it("should have no error when it was compiled without 'lib.dom.d.ts'.", () => {
            const program = ts.createProgram([TARGET_FILE], {
                lib: ["lib.es5.d.ts"],
                strict: true,
            })
            const [diagnostic] = [
                ...program.getSyntacticDiagnostics(),
                ...program.getSemanticDiagnostics(),
            ]
            const source = program.getSourceFile(TARGET_FILE)

            if (diagnostic != null) {
                const { line } = source.getLineAndCharacterOfPosition(
                    diagnostic.start
                )
                assert.fail(
                    `${ts.flattenDiagnosticMessageText(
                        diagnostic.messageText,
                        "\n"
                    )} at L${line + 1}`
                )
            }
        })
    })

    describe("'fixtures/types.ts'", () => {
        const program = ts.createProgram([TARGET_FILE, FIXTURE_FILE], {
            lib: ["lib.es5.d.ts", "lib.dom.d.ts"],
            strict: true,
        })
        const diagnostics = new Set([
            ...program.getSyntacticDiagnostics(),
            ...program.getSemanticDiagnostics(),
        ])
        const source = program.getSourceFile(FIXTURE_FILE)
        const scanner = ts.createScanner(
            source.languageVersion,
            false,
            source.languageVariant,
            source.getFullText()
        )
        const expectedDiagnostics = new Map()

        // Find @expected comments
        let kind = 0
        while ((kind = scanner.scan()) !== ts.SyntaxKind.EndOfFileToken) {
            if (kind === ts.SyntaxKind.SingleLineCommentTrivia) {
                const comment = scanner.getTokenText()
                const m = /^\/\/\s*@expected\s+(\d+)$/u.exec(comment)
                if (m != null) {
                    const code = Number(m[1])
                    const { line } = source.getLineAndCharacterOfPosition(
                        scanner.getTokenPos()
                    )

                    // Find diagnostic
                    let foundDiagnostic = null
                    for (const d of diagnostics) {
                        const {
                            line: dLine,
                        } = source.getLineAndCharacterOfPosition(d.start)

                        if (d.code === code && dLine === line) {
                            foundDiagnostic = d
                            diagnostics.delete(d)
                            break
                        }
                    }

                    expectedDiagnostics.set(
                        `TS${code} at L${line + 1}`,
                        foundDiagnostic
                    )
                }
            }
        }

        // Expected errors
        for (const [key, d] of expectedDiagnostics) {
            it(`should have an error ${key}.`, () => {
                assert(d != null)
            })
        }

        // Unexpected errors
        for (const d of diagnostics) {
            const { line } = source.getLineAndCharacterOfPosition(d.start)
            it(`should NOT have an error TS${d.code} at L${line + 1}.`, () => {
                assert.fail(
                    ts.flattenDiagnosticMessageText(d.messageText, "\n")
                )
            })
        }
    })
})
