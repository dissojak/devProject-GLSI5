import type { DockerStrategy } from '../dockerfile-strategy.types.js';

import {
  hasFile,
  nginxArtifacts,
  npmInstall,
} from '../dockerfile-strategy.shared.js';

const OTHER_FRONTEND_MARKERS = [
  'angular.json',
  'vite.config.js',
  'vite.config.ts',
  'vite.config.mjs',
  'vite.config.mts',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'nuxt.config.js',
  'nuxt.config.ts',
];

export const craStrategy: DockerStrategy = {
  id: 'CRA',

  verify() {
    if (!this.id || !this.generate || !this.matches) {
      throw new Error('Invalid Create React App strategy');
    }
  },

  matches(context) {
    return (
      context.componentType.toUpperCase() === 'FRONTEND' &&
      hasFile(context.files, context.root, 'package.json') &&
      (hasFile(context.files, context.root, 'src/index.js') ||
        hasFile(context.files, context.root, 'src/index.ts')) &&
      !OTHER_FRONTEND_MARKERS.some((name) =>
        hasFile(context.files, context.root, name),
      )
    );
  },

  generate(context) {
    const content = [
      'FROM node:22-bookworm-slim AS build',
      'WORKDIR /app',
      'COPY package*.json ./',
      'ENV npm_config_legacy_peer_deps=true',
      npmInstall(context.files, context.root),
      'COPY . .',
      'ENV CI=false',
      'ENV PUBLIC_URL=/',
      'RUN npm run build',
      '',
      'FROM nginx:1.27-alpine',
      'COPY --from=build /app/build /usr/share/nginx/html',
      'COPY nginx.conf /etc/nginx/conf.d/default.conf',
      'EXPOSE 80',
      'CMD ["nginx", "-g", "daemon off;"]',
      '',
    ].join('\n');

    return {
      content,
      files: nginxArtifacts(context.root),
      warnings: [
        'Selected from the file layout (src/index.js, no Vite/Angular/Next config); assumes Create React App.',
        'Create React App writes its output to build/, not dist/.',
        'PUBLIC_URL=/ overrides the "homepage" field in package.json.',
        'legacy-peer-deps is enabled to avoid ERESOLVE conflicts.',
        'REACT_APP_* variables are baked in at build time.',
        'Docker build has not been executed.',
      ],
    };
  },
};