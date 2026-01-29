import { run, bench } from "mitata";
import path from "node:path";
import { fileURLToPath } from "node:url";
import findConfig from "../../src/find-config.js";
import findupSync from "findup-sync";
import lookup from "look-up";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cwd = path.join(__dirname, "../fixtures/a/b");

const files = [
	".waldo",
	"foo.txt",
	"baz.txt",
	"find-config-3da35411-9d24-4dec-a7cb-3cb9416db670",
];

const workload = [];
for (let i = 0; i < 10; i++) {
	workload.push(...files);
}

bench("find-config", () => {
	for (let i = 0; i < workload.length; i++) {
		findConfig(workload[i], { cwd });
	}
});

bench("findup-sync", () => {
	for (let i = 0; i < workload.length; i++) {
		findupSync(workload[i], { cwd });
	}
});

bench("look-up", () => {
	for (let i = 0; i < workload.length; i++) {
		lookup(workload[i], { cwd });
	}
});

await run();
