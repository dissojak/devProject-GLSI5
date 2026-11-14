import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  extractLogExcerpt,
} from '../../src/services/cicd-monitor/log-excerpt.js';

const ESC = String.fromCharCode(27);

describe('GitHub Actions log excerpt', () => {
  it('ends at the last error and strips timestamps, colours and group markers', () => {
    const log = [
      '2026-11-14T10:00:00.1Z ##[group]Run build',
      `2026-11-14T10:00:01.1Z ${ESC}[31mstep output${ESC}[0m`,
      '2026-11-14T10:00:02.1Z ##[error]first failure',
      '2026-11-14T10:00:03.1Z ##[endgroup]',
      '2026-11-14T10:00:04.1Z ##[error]Process completed with exit code 1.',
      '2026-11-14T10:00:05.1Z Cleaning up orphan processes',
    ].join('\r\n');

    expect(extractLogExcerpt(log)).toEqual([
      { text: 'step output', error: false },
      { text: 'first failure', error: true },
      { text: 'Process completed with exit code 1.', error: true },
    ]);
  });

  it('keeps only the last lines before the error', () => {
    const lines = Array.from({ length: 100 }, (_, index) => `line ${index}`);
    const log = [...lines, '##[error]boom'].join('\n');

    const excerpt = extractLogExcerpt(log, 5);

    expect(excerpt.map((line) => line.text)).toEqual([
      'line 96',
      'line 97',
      'line 98',
      'line 99',
      'boom',
    ]);
  });

  it('falls back to the tail of the log when no error marker exists', () => {
    expect(extractLogExcerpt('a\nb\nc', 2)).toEqual([
      { text: 'b', error: false },
      { text: 'c', error: false },
    ]);
  });
});
