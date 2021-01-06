import Mocha0 from "mocha"
import { Global } from "../../src/lib/global"

const Mocha = Global.Mocha ?? Mocha0

export const result = main().then(failures => ({
    failures,
    coverage: Global.__coverage__ ?? {},
}))
Global.result = result

async function main(): Promise<number> {
    const tester = new Mocha({
        allowUncaught: false,
        color: true,
        fullTrace: true,
        reporter: "spec",
    })

    //--------------------------------------------------------------------------
    // Test cases
    //--------------------------------------------------------------------------

    tester.suite.emit("pre-require", Global, "event.ts", tester)
    tester.suite.emit("require", await import("../event"), "event.ts", tester)
    tester.suite.emit("post-require", Global, "event.ts", tester)

    tester.suite.emit("pre-require", Global, "event-target.ts", tester)
    tester.suite.emit(
        "require",
        await import("../event-target"),
        "event-target.ts",
        tester,
    )
    tester.suite.emit("post-require", Global, "event-target.ts", tester)

    tester.suite.emit("pre-require", Global, "event-attribute.ts", tester)
    tester.suite.emit(
        "require",
        await import("../event-attribute"),
        "event-attribute.ts",
        tester,
    )
    tester.suite.emit("post-require", Global, "event-attribute.ts", tester)

    tester.suite.emit(
        "pre-require",
        Global,
        "define-custom-event-target.ts",
        tester,
    )
    tester.suite.emit(
        "require",
        await import("../define-custom-event-target"),
        "define-custom-event-target.ts",
        tester,
    )
    tester.suite.emit(
        "post-require",
        Global,
        "define-custom-event-target.ts",
        tester,
    )

    tester.suite.emit("pre-require", Global, "default-error-handler.ts", tester)
    tester.suite.emit(
        "require",
        await import("../default-error-handler"),
        "default-error-handler.ts",
        tester,
    )
    tester.suite.emit(
        "post-require",
        Global,
        "default-error-handler.ts",
        tester,
    )

    tester.suite.emit(
        "pre-require",
        Global,
        "default-warning-handler.ts",
        tester,
    )
    tester.suite.emit(
        "require",
        await import("../default-warning-handler"),
        "default-warning-handler.ts",
        tester,
    )
    tester.suite.emit(
        "post-require",
        Global,
        "default-warning-handler.ts",
        tester,
    )

    //--------------------------------------------------------------------------
    // Run
    //--------------------------------------------------------------------------

    return new Promise<number>(resolve => {
        tester.run(resolve)
    })
}
