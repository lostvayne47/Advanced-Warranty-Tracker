import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const backend = path.resolve(frontend, "../Backend");
function run(command, cwd, env = process.env) {
  const windows = process.platform === "win32";
  const result = spawnSync(windows ? "cmd.exe" : "/bin/sh",
    windows ? ["/d", "/s", "/c", command] : ["-c", command],
    { cwd, env, stdio: "inherit", windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run("npm run build", frontend, { ...process.env, VITE_API_URL: "/api" });
const mvn = process.platform === "win32" ? "mvnw.cmd" : "./mvnw";
// Keep preparation separate from the browser server so clean/verify finish first.
run(`${mvn} -q clean verify -Pbundle-frontend -Ddebug=false dependency:build-classpath -Dmdep.outputFile=target/release-classpath.txt`, backend);
