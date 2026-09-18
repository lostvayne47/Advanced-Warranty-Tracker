import { spawn } from "node:child_process";
import { readFile, open } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../Backend");
export default async function setup() {
  const dependencies = (await readFile(path.join(backend, "target/release-classpath.txt"), "utf8")).trim();
  const classpath = [
    path.join(backend, "target/test-classes"),
    path.join(backend, "target/classes"),
    dependencies,
  ].join(path.delimiter);
  const log = await open(path.join(backend, "target/release-server.log"), "w");
  const child = spawn("java", ["-cp", classpath, "com.warrantytracker.ReleaseTestServer"], {
    cwd: backend, stdio: ["pipe", log.fd, log.fd], windowsHide: true,
  });
  const stopped = new Promise((resolve) => child.once("exit", resolve));
  let launchError;
  child.once("error", (error) => { launchError = error; });
  async function stop() {
    child.stdin.end();
    await Promise.race([stopped, new Promise((resolve) => setTimeout(resolve, 20000))]);
    if (child.exitCode === null) child.kill();
    await log.close();
  }
  try {
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (launchError) throw launchError;
      if (child.exitCode !== null) throw new Error("Release server exited. See Backend/target/release-server.log.");
      try {
        const result = await fetch("http://127.0.0.1:5002/actuator/health/readiness", { signal: AbortSignal.timeout(1000) });
        if (result.ok && (await result.json()).status === "UP") { ready = true; break; }
      } catch { /* wait for application startup */ }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error("Release server startup timed out. See Backend/target/release-server.log.");
    return stop;
  } catch (error) { await stop(); throw error; }
}
