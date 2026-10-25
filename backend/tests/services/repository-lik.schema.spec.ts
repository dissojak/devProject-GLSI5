import { describe, expect, it } from 'vitest';

import { connectRepositorySchema } from '../../src/services/repository-link/repository-link.schema.js';

const URL = 'https://github.com/octocat/Hello-World';

function parse(branch: string) {
  return connectRepositorySchema.safeParse({ url: URL, branch });
}

describe('connectRepositorySchema', () => {
  it.each(['main', 'master', 'feature/login', 'release-1.2.0', 'user_name/fix.typo'])(
    'accepts the branch "%s"',
    (branch) => {
      expect(parse(branch).success).toBe(true);
    },
  );

  it.each([
    'a b',
    'x?y',
    'x#y',
    '../../user',
    'a/../b',
    'a//b',
    '/main',
    'main/',
    '.hidden',
    'a/.b',
    '',
  ])('rejects the branch "%s"', (branch) => {
    expect(parse(branch).success).toBe(false);
  });

  it('trims the branch name', () => {
    const result = parse('  main  ');

    expect(result.success && result.data.branch).toBe('main');
  });

  it('rejects an invalid url', () => {
    const result = connectRepositorySchema.safeParse({ url: 'not-a-url', branch: 'main' });

    expect(result.success).toBe(false);
  });

  it('rejects unknown keys', () => {
    const result = connectRepositorySchema.safeParse({ url: URL, branch: 'main', extra: 1 });

    expect(result.success).toBe(false);
  });
});