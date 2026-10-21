// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import TSRecommended from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

/**
 * Dependency direction:
 *   routes -> controllers -> services -> repositories -> models -> domain/shared
 * Enforced with `no-restricted-imports` per source directory. Files matching a
 * glob may only import from strictly LOWER layers (or external packages).
 *
 * Patterns are segment-aware so that internal file names never collide with
 * layer-folder names (e.g. domain/errors/app-error.ts is NOT "app").
 */
const FORBIDDEN = {
  domain: [
    '*/models/*',
    '*/repositories/*',
    '*/services/*',
    '*/controllers/*',
    '*/routes/*',
    '*/middleware/*',
    '*/config/*',
    '*/app.js',
    '*/app.ts',
    '*/server.js',
    '*/server.ts',
  ],
  shared: [
    '*/models/*',
    '*/repositories/*',
    '*/services/*',
    '*/controllers/*',
    '*/routes/*',
    '*/middleware/*',
    '*/config/*',
    '*/app.js',
    '*/app.ts',
    '*/server.js',
    '*/server.ts',
  ],
  models: [
    '*/repositories/*',
    '*/services/*',
    '*/controllers/*',
    '*/routes/*',
    '*/middleware/*',
    '*/config/*',
    '*/app.js',
    '*/app.ts',
    '*/server.js',
    '*/server.ts',
  ],
  repositories: [
    '*/services/*',
    '*/controllers/*',
    '*/routes/*',
    '*/middleware/*',
    '*/config/*',
    '*/app.js',
    '*/app.ts',
    '*/server.js',
    '*/server.ts',
  ],
  services: [
    '*/controllers/*',
    '*/routes/*',
    '*/middleware/*',
    '*/app.js',
    '*/app.ts',
    '*/server.js',
    '*/server.ts',
  ],
  controllers: [
    '*/repositories/*',
    '*/models/*',
    '*/routes/*',
    '*/middleware/*',
    '*/app.js',
    '*/app.ts',
    '*/server.js',
    '*/server.ts',
    '*/config/*',
  ],
  routes: [
    '*/repositories/*',
    '*/models/*',
    '*/services/*',
    '*/app.js',
    '*/app.ts',
    '*/server.js',
    '*/server.ts',
  ],
  middleware: [
    '*/controllers/*',
    '*/routes/*',
    '*/services/*',
    '*/repositories/*',
    '*/models/*',
    '*/app.js',
    '*/app.ts',
    '*/server.js',
    '*/server.ts',
  ],
  config: [
    '*/repositories/*',
    '*/services/*',
    '*/controllers/*',
    '*/routes/*',
    '*/middleware/*',
    '*/app.js',
    '*/app.ts',
    '*/server.js',
    '*/server.ts',
  ],
};

const layer = (dir, forbidden) => ({
  files: [`src/${dir}/**/*.ts`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        // hard block: pure business logic must never see Mongoose
        ...(dir === 'domain' ? { paths: ['mongoose'] } : {}),
        patterns: forbidden.map((g) => ({
          group: [g],
          message: `violates dependency direction: ${dir} cannot depend on ${g}`,
        })),
      },
    ],
  },
});

export default defineConfig(
  globalIgnores(['node_modules/**', 'dist/**', 'coverage/**', 'eslint.config.js']),
  TSRecommended.configs.recommended,
  {
    languageOptions: {
      // Type-aware linting is intentionally NOT enabled; types are validated by
      // `npm run build` via tsc. See docs/conventions.md (Phase 5).
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  [Object.entries(FORBIDDEN).map(([dir, forbidden]) => layer(dir, forbidden))][0],
  {
    files: ['tests/**/*.ts'],
    rules: {
      // Value objects / invariants are constructed with valid data; assertions
      // on possibly-undefined props are expected after noUncheckedIndexedAccess.
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  },
  {
    // Document#validateSync() is deprecated (removed in Mongoose 10) and
    // SKIPS sub-document pre('validate') hooks, which hides behavior diffs.
    // All rule checks must go through `await doc.validate()` (src AND tests).
    rules: {
      'no-restricted-properties': [
        'error',
        {
          property: 'validateSync',
          message:
            'validateSync is deprecated and skips subdoc pre-validate hooks - use `await doc.validate()`',
        },
      ],
    },
  },
  prettierConfig,
);
