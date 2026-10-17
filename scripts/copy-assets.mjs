import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';

/**
 * `tsc` only emits JavaScript, so the icons and the node codex files have to be
 * copied into `dist` by hand. The published package only ships `dist`.
 */
const SOURCE = 'nodes';
const TARGET = join('dist', 'nodes');

const ASSET = /(\.svg|\.node\.json)$/;

async function collect(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const full = join(directory, entry.name);

		if (entry.isDirectory()) {
			files.push(...(await collect(full)));
		} else if (ASSET.test(entry.name)) {
			files.push(full);
		}
	}

	return files;
}

const assets = await collect(SOURCE);

for (const asset of assets) {
	const destination = join(TARGET, relative(SOURCE, asset));

	await mkdir(dirname(destination), { recursive: true });
	await copyFile(asset, destination);
}

console.log(`Copied ${assets.length} asset(s) to ${TARGET}`);
