import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { mockupPreviewPlugin } from '../mockupPreviewPlugin.ts';

test('native discovery includes nested TSX and excludes private, hidden and non-TSX files', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'mockup-discovery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixtures = [
    'Card.tsx', 'nested/Page.tsx', '_Hidden.tsx', '_private/Page.tsx',
    'nested/_Helper.tsx', '.hidden/Page.tsx', '.Secret.tsx', 'notes.ts',
  ];
  for (const file of fixtures) {
    const absolute = path.join(root, 'src/components/mockups', file);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, 'export default () => null;');
  }
  const plugin = mockupPreviewPlugin();
  plugin.configResolved({ root });
  await plugin.buildStart();
  const generated = await readFile(path.join(root, 'src/.generated/mockup-components.ts'), 'utf8');
  assert.match(generated, /"\.\/components\/mockups\/Card\.tsx"/);
  assert.match(generated, /"\.\/components\/mockups\/nested\/Page\.tsx"/);
  assert.match(generated, /import\("\.\.\/components\/mockups\/Card\.tsx"\)/);
  assert.equal((generated.match(/\(\) => import/g) || []).length, 2);
  assert.doesNotMatch(generated, /_Hidden|_private|_Helper|\.hidden|\.Secret|notes/);
});

test('discovery generates an empty module when the mockups directory does not exist', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'mockup-empty-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const plugin = mockupPreviewPlugin();
  plugin.configResolved({ root });
  await plugin.buildStart();
  const generated = await readFile(path.join(root, 'src/.generated/mockup-components.ts'), 'utf8');
  assert.equal((generated.match(/\(\) => import/g) || []).length, 0);
  assert.match(generated, /export const modules: ModuleMap/);
});
