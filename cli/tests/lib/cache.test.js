import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BUNDLED_DIR = join(import.meta.dirname, '..', '..', 'dist');

let tempChubDir = null;
let backupDir = null;

function restoreBundledDir() {
  if (existsSync(BUNDLED_DIR)) {
    rmSync(BUNDLED_DIR, { recursive: true, force: true });
  }
  if (backupDir) {
    renameSync(backupDir, BUNDLED_DIR);
    backupDir = null;
  }
}

afterEach(() => {
  vi.resetModules();
  delete process.env.CHUB_DIR;
  if (tempChubDir) {
    rmSync(tempChubDir, { recursive: true, force: true });
    tempChubDir = null;
  }
  restoreBundledDir();
});

describe('ensureRegistry', () => {
  it('seeds bundled search-index.json alongside registry.json', async () => {
    tempChubDir = mkdtempSync(join(tmpdir(), 'chub-cache-test-'));
    process.env.CHUB_DIR = tempChubDir;

    if (existsSync(BUNDLED_DIR)) {
      backupDir = mkdtempSync(join(tmpdir(), 'chub-dist-backup-'));
      rmSync(backupDir, { recursive: true, force: true });
      renameSync(BUNDLED_DIR, backupDir);
    }

    mkdirSync(BUNDLED_DIR, { recursive: true });
    writeFileSync(join(BUNDLED_DIR, 'registry.json'), JSON.stringify({
      version: '1.0.0',
      docs: [],
      skills: [],
    }));
    writeFileSync(join(BUNDLED_DIR, 'search-index.json'), JSON.stringify({
      version: '1.0.0',
      algorithm: 'bm25',
      params: { k1: 1.5, b: 0.75 },
      totalDocs: 1,
      avgFieldLengths: { name: 1, description: 1, tags: 1 },
      idf: { alpha: 1 },
      documents: [{ id: 'test/doc', tokens: { name: ['alpha'], description: [], tags: [] } }],
      invertedIndex: { alpha: [0] },
    }));

    const { ensureRegistry } = await import('../../src/lib/cache.js');
    await ensureRegistry();

    const seededRegistry = join(tempChubDir, 'sources', 'default', 'registry.json');
    const seededSearchIndex = join(tempChubDir, 'sources', 'default', 'search-index.json');
    expect(existsSync(seededRegistry)).toBe(true);
    expect(existsSync(seededSearchIndex)).toBe(true);

    const seededIndex = JSON.parse(readFileSync(seededSearchIndex, 'utf8'));
    expect(seededIndex.invertedIndex.alpha).toEqual([0]);
  });
});
