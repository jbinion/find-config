import fs from 'node:fs';
import path from 'node:path';
import {homedir} from 'node:os';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

const DEFAULT_DIR = '.config';
const DEFAULT_ENC = 'utf8';

/**
 * Check if a normal file exists and return its path.
 */
function resolveFile(dir, filename) {
	const filepath = path.join(dir, filename);
	const stat = fs.statSync(filepath);
	if (stat.isFile()) {
		return filepath;
	}

	return null;
}

/**
 * Resolve using Node module resolution.
 * This will handle file.js, file/index.js, etc.
 */
function resolveModule(dir, filename) {
	return require.resolve(path.join(dir, filename));
}

/**
 * Core function to find a config file.
 */
function findConfigObject(filename, options = {}) {
	if (!filename) {
		return null;
	}

	const dirName = options.dir ?? DEFAULT_DIR;
	const dotless = options.dot ? filename : filename.replace(/^\./, '');
	const resolver = options.module ? resolveModule : resolveFile;

	// Start at cwd or default to process.cwd()
	let current = path.resolve(options.cwd ?? '.');

	const test = (dir) => {
		// 1️⃣ Direct file
		try {
			const file = resolver(dir, filename);
			if (file) return {cwd: current, dir, path: file};
		} catch {}

		// 2️⃣ Inside dot-directory
		try {
			const file = resolver(path.join(dir, dirName), dotless);
			if (file) {
				return {
					cwd: current,
					dir: path.join(dir, dirName),
					path: file,
				};
			}
		} catch {}

		return null;
	};

	// Walk up directories until root
	while (true) {
		const fileObject = test(current);
		if (fileObject) {
			return fileObject;
		}

		const parent = path.dirname(current);
		if (parent === current) {
			break;
		}

		current = parent;
	}

	// Check home directory if enabled (default true)
	if (options.home !== false) {
		const fileObject = test(homedir());
		if (fileObject) {
			return fileObject;
		}
	}

	return null;
}

/**
 * Return the full path of the found config
 */
function findConfig(filename, options) {
	const configObject = findConfigObject(filename, options);
	return configObject?.path ?? null;
}

/**
 * Read the contents of a found config
 */
function findConfigRead(filename, options = {}) {
	const filepath = findConfig(filename, options);
	if (!filepath) {
		return null;
	}

	return fs.readFileSync(filepath, {
		encoding: options.encoding ?? DEFAULT_ENC,
		flag: options.flag,
	});
}

/**
 * Require a JS module as config
 */
function findConfigRequire(filename, options = {}) {
	options = {...options, module: true};
	const filepath = findConfig(filename, options);
	if (!filepath) {
		return null;
	}

	return require(filepath);
}

export default findConfig;
export {findConfigObject, findConfigRead, findConfigRequire};
