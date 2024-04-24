import { writeFileSync } from "fs";
import { resolve } from "path";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

describe('Lambda handler', () => {
    let logs: string[] = []
    let startedContainer: StartedTestContainer;
    let container = new GenericContainer("public.ecr.aws/lambda/nodejs:20.2024.04.22.19")
        .withCopyFilesToContainer([{
            source: resolve(__dirname, "../lib", "index.js"),
            target: "/var/task/index.js"
        }])
        .withCopyFilesToContainer([{
            source: resolve(__dirname, "../lib", "wrapper_script"),
            target: "/var/task/wrapper_script"
        }])
        .withResourcesQuota({ memory: 0.5, cpu: 0.25 })
        .withExposedPorts(8080)
        .withCommand(["index.handler"])
        // .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
        .withLogConsumer(stream => {
            stream.on("data", line => {
                if (line.includes("INIT REPORT")) {
                    logs.push(line.toString());
                }
                // console.log(line)
            });
            stream.on("err", line => console.error(line));
            // stream.on("end", () => console.log("Stream closed"));
        })

    afterEach(async () => {
        if (startedContainer) {
            await startedContainer.stop();
        }
    });


    const array = Array(5).fill(undefined).map((_, i) => i);
    describe.skip("without otel", () => {

        it.each(array)('without otel run %s', async (index) => {

            startedContainer = await container.start();

            const port = startedContainer.getMappedPort(8080);
            const lambdaUrl = `http://localhost:${port}/2015-03-31/functions/function/invocations`;

            const result = await fetch(lambdaUrl, {
                method: 'POST',
                body: JSON.stringify({}),
                headers: { 'Content-Type': 'application/json' }
            })

            const body = await result.json();
            expect(result.status).toBe(200);
        }, 60_000);

        afterAll(async () => {

            const durations = logs.map(log => {
                const duration = log.match(/durationMs: (\d+\.\d+)/);
                if (duration) {
                    return parseFloat(duration[1]);
                }
                return null;
            })
            // calculate the average, median, p95 and p99 duration
            const sum = durations.reduce((acc, curr) => acc! + curr!, 0);
            const avg = sum! / durations.length;
            const sorted = durations.sort((a, b) => a! - b!);
            const median = sorted[Math.floor(durations.length / 2)];
            const p95 = sorted[Math.floor(durations.length * 0.95)];
            const p99 = sorted[Math.floor(durations.length * 0.99)];
            console.log("Duration: ", durations);
            console.log("Average: ", avg);
            console.log("Median: ", median);
            console.log("P95: ", p95);
            console.log("P99: ", p99);
            logs = []

        });
    });
    describe.skip("with raw otel", () => {

        it.each(array)('with raw otel run %s', async (index) => {

            startedContainer = await container.withEnvironment({
                "AWS_LAMBDA_EXEC_WRAPPER": "/var/task/wrapper_script",
            }).withCopyDirectoriesToContainer([{
                source: resolve(__dirname, "../lib/otel-layer"),
                target: "/var/task/otel-layer"
            }]).start();

            const port = startedContainer.getMappedPort(8080);
            const lambdaUrl = `http://localhost:${port}/2015-03-31/functions/function/invocations`;

            const result = await fetch(lambdaUrl, {
                method: 'POST',
                body: JSON.stringify({}),
                headers: { 'Content-Type': 'application/json' }
            })

            const body = await result.json();
            expect(result.status).toBe(200);
        }, 60_000);

        afterAll(async () => {

            const durations = logs.map(log => {
                const duration = log.match(/durationMs: (\d+\.\d+)/);
                if (duration) {
                    return parseFloat(duration[1]);
                }
                return null;
            })
            // calculate the average, median, p95 and p99 duration
            const sum = durations.reduce((acc, curr) => acc! + curr!, 0);
            const avg = sum! / durations.length;
            const sorted = durations.sort((a, b) => a! - b!);
            const median = sorted[Math.floor(durations.length / 2)];
            const p95 = sorted[Math.floor(durations.length * 0.95)];
            const p99 = sorted[Math.floor(durations.length * 0.99)];
            console.log("Duration: ", durations);
            console.log("Average: ", avg);
            console.log("Median: ", median);
            console.log("P95: ", p95);
            console.log("P99: ", p99);
            logs = []

        });

    });
    describe.skip("with bundled otel", () => {
        it.each(array)('wit bundled otel run %s', async (index) => {

            startedContainer = await container.withEnvironment({
                "AWS_LAMBDA_EXEC_WRAPPER": "/var/task/wrapper_script",
            }).withCopyDirectoriesToContainer([{
                source: resolve(__dirname, "../lib/otel-layer/dist"),
                target: "/var/task/otel-layer"
            }]).start();

            const port = startedContainer.getMappedPort(8080);
            const lambdaUrl = `http://localhost:${port}/2015-03-31/functions/function/invocations`;

            const result = await fetch(lambdaUrl, {
                method: 'POST',
                body: JSON.stringify({}),
                headers: { 'Content-Type': 'application/json' }
            })

            const body = await result.json();
            expect(result.status).toBe(200);
        }, 60_000);

        afterAll(async () => {

            const durations = logs.map(log => {
                const duration = log.match(/durationMs: (\d+\.\d+)/);
                if (duration) {
                    return parseFloat(duration[1]);
                }
                return null;
            })
            // calculate the average, median, p95 and p99 duration
            const sum = durations.reduce((acc, curr) => acc! + curr!, 0);
            const avg = sum! / durations.length;
            const sorted = durations.sort((a, b) => a! - b!);
            const median = sorted[Math.floor(durations.length / 2)];
            const p95 = sorted[Math.floor(durations.length * 0.95)];
            const p99 = sorted[Math.floor(durations.length * 0.99)];
            console.log("Duration: ", durations);
            console.log("Average: ", avg);
            console.log("Median: ", median);
            console.log("P95: ", p95);
            console.log("P99: ", p99);
            logs = []

        });
    })
    describe("with prebuild image", () => {
        describe("with prebuild image without otel", () => {
            it.each(Array(50).fill(undefined))("prebuild", async () => {
                container = new GenericContainer("otel-lambda")
                    // .withResourcesQuota({ memory: 0.5, cpu: 0.25 })
                    .withExposedPorts(8080)
                    .withCommand(["index.handler"])
                    .withEnvironment({
                        // "NODE_OPTIONS": "--require /var/task/otel-layer/instrumentation.js",
                        // "NODE_OPTIONS": "--require /var/task/otel-layer/dist/instrumentation.js",
                    })
                    .withLogConsumer(stream => {
                        stream.on("data", line => {
                            if (line.includes("INIT REPORT")) {
                                logs.push(line.toString());
                            }
                            // console.log(line)
                        });
                        stream.on("err", line => console.error(line));
                        // stream.on("end", () => console.log("Stream closed"));
                    })
                startedContainer = await container.start();

                const port = startedContainer.getMappedPort(8080);
                const lambdaUrl = `http://localhost:${port}/2015-03-31/functions/function/invocations`;

                const result = await fetch(lambdaUrl, {
                    method: 'POST',
                    body: JSON.stringify({}),
                    headers: { 'Content-Type': 'application/json' }
                })

                const body = await result.json();
                expect(result.status).toBe(200);

            })
            afterAll(async () => {
                // console.log(logs)
                const durations = logs.map(log => {
                    const duration = log.match(/durationMs: (\d+\.\d+)/);
                    if (duration) {
                        return parseFloat(duration[1]);
                    }
                    return null;
                })
                // calculate the average, median, p95 and p99 duration
                const sum = durations.reduce((acc, curr) => acc! + curr!, 0);
                const avg = sum! / durations.length;
                const sorted = durations.sort((a, b) => a! - b!);
                const median = sorted[Math.floor(durations.length / 2)];
                const p25 = sorted[Math.floor(durations.length * 0.25)];
                const p95 = sorted[Math.floor(durations.length * 0.95)];
                const p99 = sorted[Math.floor(durations.length * 0.99)];
                console.log("Duration: ", durations);
                console.log("Average: ", avg);
                console.log("Median: ", median);
                console.log("P25: ", p25);
                console.log("P95: ", p95);
                console.log("P99: ", p99);
                logs = []

            });
        });
        describe("with prebuild image without bundled otel", () => {
            it.each(Array(50).fill(undefined))("prebuild", async () => {
                container = new GenericContainer("otel-lambda")
                    // .withResourcesQuota({ memory: 0.5, cpu: 0.25 })
                    .withExposedPorts(8080)
                    .withCommand(["index.handler"])
                    .withEnvironment({
                        "NODE_OPTIONS": "--require /var/task/otel-layer/instrumentation.js",
                        // "NODE_OPTIONS": "--require /var/task/otel-layer/dist/instrumentation.js",
                    })
                    .withLogConsumer(stream => {
                        stream.on("data", line => {
                            if (line.includes("INIT REPORT")) {
                                logs.push(line.toString());
                            }
                            // console.log(line)
                        });
                        stream.on("err", line => console.error(line));
                        // stream.on("end", () => console.log("Stream closed"));
                    })
                startedContainer = await container.start();

                const port = startedContainer.getMappedPort(8080);
                const lambdaUrl = `http://localhost:${port}/2015-03-31/functions/function/invocations`;

                const result = await fetch(lambdaUrl, {
                    method: 'POST',
                    body: JSON.stringify({}),
                    headers: { 'Content-Type': 'application/json' }
                })

                const body = await result.json();
                expect(result.status).toBe(200);

            })
            afterAll(async () => {
                // console.log(logs)
                const durations = logs.map(log => {
                    const duration = log.match(/durationMs: (\d+\.\d+)/);
                    if (duration) {
                        return parseFloat(duration[1]);
                    }
                    return null;
                })
                // calculate the average, median, p95 and p99 duration
                const sum = durations.reduce((acc, curr) => acc! + curr!, 0);
                const avg = sum! / durations.length;
                const sorted = durations.sort((a, b) => a! - b!);
                const median = sorted[Math.floor(durations.length / 2)];
                const p25 = sorted[Math.floor(durations.length * 0.25)];
                const p95 = sorted[Math.floor(durations.length * 0.95)];
                const p99 = sorted[Math.floor(durations.length * 0.99)];
                console.log("Duration: ", durations);
                console.log("Average: ", avg);
                console.log("Median: ", median);
                console.log("P25: ", p25);
                console.log("P95: ", p95);
                console.log("P99: ", p99);
                logs = []

            });
        });

        describe("with prebuild image bundled otel", () => {
            it.each(Array(50).fill(undefined))("prebuild", async () => {
                container = new GenericContainer("otel-lambda")
                    // .withResourcesQuota({ memory: 0.5, cpu: 0.25 })
                    .withExposedPorts(8080)
                    .withCommand(["index.handler"])
                    .withEnvironment({
                        // "NODE_OPTIONS": "--require /var/task/otel-layer/instrumentation.js",
                        "NODE_OPTIONS": "--require /var/task/otel-layer/dist/instrumentation.js",
                    })
                    .withLogConsumer(stream => {
                        stream.on("data", line => {
                            if (line.includes("INIT REPORT")) {
                                logs.push(line.toString());
                            }
                            // console.log(line)
                        });
                        stream.on("err", line => console.error(line));
                        // stream.on("end", () => console.log("Stream closed"));
                    })
                startedContainer = await container.start();

                const port = startedContainer.getMappedPort(8080);
                const lambdaUrl = `http://localhost:${port}/2015-03-31/functions/function/invocations`;

                const result = await fetch(lambdaUrl, {
                    method: 'POST',
                    body: JSON.stringify({}),
                    headers: { 'Content-Type': 'application/json' }
                })

                const body = await result.json();
                expect(result.status).toBe(200);

            })
            afterAll(async () => {
                // console.log(logs)
                const durations = logs.map(log => {
                    const duration = log.match(/durationMs: (\d+\.\d+)/);
                    if (duration) {
                        return parseFloat(duration[1]);
                    }
                    return null;
                })
                // calculate the average, median, p95 and p99 duration
                const sum = durations.reduce((acc, curr) => acc! + curr!, 0);
                const avg = sum! / durations.length;
                const sorted = durations.sort((a, b) => a! - b!);
                const median = sorted[Math.floor(durations.length / 2)];
                const p25 = sorted[Math.floor(durations.length * 0.25)];
                const p95 = sorted[Math.floor(durations.length * 0.95)];
                const p99 = sorted[Math.floor(durations.length * 0.99)];
                console.log("Duration: ", durations);
                console.log("Average: ", avg);
                console.log("Median: ", median);
                console.log("P25: ", p25);
                console.log("P95: ", p95);
                console.log("P99: ", p99);
                logs = []

            });
        });
    });
});
