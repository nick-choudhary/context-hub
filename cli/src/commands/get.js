import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import chalk from 'chalk';
import { getEntry, resolveDocPath, resolveEntryFile } from '../lib/registry.js';
import { fetchDoc, fetchDocFull } from '../lib/cache.js';
import { output, error, info } from '../lib/output.js';
import { trackEvent } from '../lib/analytics.js';

/**
 * Fetch one or more entries by ID. Auto-detects doc vs skill per entry.
 */
async function fetchEntries(ids, opts, globalOpts) {
  const results = [];

  for (const id of ids) {
    // Search both docs and skills — auto-detect type
    const result = getEntry(id);

    if (result.ambiguous) {
      error(
        `Multiple entries with id "${id}". Be specific:\n  ${result.alternatives.join('\n  ')}`,
        globalOpts
      );
    }

    if (!result.entry) {
      error(`Entry "${id}" not found.`, globalOpts);
    }

    const entry = result.entry;
    const type = entry.languages ? 'doc' : 'skill';
    const resolved = resolveDocPath(entry, opts.lang, opts.version);

    if (!resolved) {
      error(`Could not resolve path for "${id}" ${opts.lang || ''} ${opts.version || ''}`.trim(), globalOpts);
    }

    if (resolved.needsLanguage) {
      error(
        `Multiple languages available for "${id}": ${resolved.available.join(', ')}. Specify --lang.`,
        globalOpts
      );
    }

    const entryFile = resolveEntryFile(resolved, type);
    if (entryFile.error) {
      error(`"${id}" ${entryFile.error}`, globalOpts);
    }

    try {
      if (opts.full && resolved.files.length > 0) {
        const allFiles = await fetchDocFull(resolved.source, resolved.path, resolved.files);
        results.push({ id: entry.id, type, files: allFiles, path: resolved.path });
      } else {
        const content = await fetchDoc(resolved.source, entryFile.filePath);
        results.push({ id: entry.id, type, content, path: entryFile.filePath });
      }
    } catch (err) {
      error(err.message, globalOpts);
    }
  }

  // Track fetches
  for (const r of results) {
    trackEvent(r.type === 'doc' ? 'doc_fetched' : 'skill_fetched', {
      entry_id: r.id,
      full: !!opts.full,
      lang: opts.lang || undefined,
    }).catch(() => {});
  }

  // Output
  if (opts.output) {
    if (opts.full) {
      for (const r of results) {
        if (r.files) {
          const baseDir = ids.length > 1 ? join(opts.output, r.id) : opts.output;
          mkdirSync(baseDir, { recursive: true });
          for (const f of r.files) {
            const outPath = join(baseDir, f.name);
            mkdirSync(dirname(outPath), { recursive: true });
            writeFileSync(outPath, f.content);
          }
          info(`Written ${r.files.length} files to ${baseDir}`);
        } else {
          const outPath = join(opts.output, `${r.id}.md`);
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, r.content);
          info(`Written to ${outPath}`);
        }
      }
    } else {
      const isDir = opts.output.endsWith('/');
      if (isDir && results.length > 1) {
        mkdirSync(opts.output, { recursive: true });
        for (const r of results) {
          const outPath = join(opts.output, `${r.id}.md`);
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, r.content);
          info(`Written to ${outPath}`);
        }
      } else {
        const outPath = isDir ? join(opts.output, `${results[0].id}.md`) : opts.output;
        mkdirSync(dirname(outPath), { recursive: true });
        const combined = results.map((r) => r.content).join('\n\n---\n\n');
        writeFileSync(outPath, combined);
        info(`Written to ${outPath}`);
      }
    }
    if (globalOpts.json) {
      console.log(JSON.stringify(results.map((r) => ({ id: r.id, type: r.type, path: opts.output }))));
    }
  } else {
    if (results.length === 1 && !results[0].files) {
      output(
        { id: results[0].id, type: results[0].type, content: results[0].content, path: results[0].path },
        (data) => process.stdout.write(data.content),
        globalOpts
      );
    } else {
      const parts = results.flatMap((r) => {
        if (r.files) {
          return r.files.map((f) => `# FILE: ${f.name}\n\n${f.content}`);
        }
        return [r.content];
      });
      const combined = parts.join('\n\n---\n\n');
      output(
        results.map((r) => ({ id: r.id, type: r.type, path: r.path })),
        () => process.stdout.write(combined),
        globalOpts
      );
    }
  }
}

export function registerGetCommand(program) {
  program
    .command('get <ids...>')
    .description('Fetch docs or skills by ID (auto-detects type)')
    .option('--lang <language>', 'Language variant (for docs)')
    .option('--version <version>', 'Specific version (for docs)')
    .option('-o, --output <path>', 'Write to file or directory')
    .option('--full', 'Fetch all files (not just entry point)')
    .action(async (ids, opts) => {
      const globalOpts = program.optsWithGlobals();
      await fetchEntries(ids, opts, globalOpts);
    });
}
