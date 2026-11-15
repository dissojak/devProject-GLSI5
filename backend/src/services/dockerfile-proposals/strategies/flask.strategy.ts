import type { DockerStrategy } from '../dockerfile-strategy.types.js';

import { hasFile } from '../dockerfile-strategy.shared.js';

export const flaskStrategy: DockerStrategy = {
  id: 'FLASK',

  verify() {
    if (!this.id || !this.generate || !this.matches) {
      throw new Error('Invalid Flask strategy');
    }
  },

  matches(context) {
    return (
      context.componentType.toUpperCase() === 'BACKEND' &&
      hasFile(context.files, context.root, 'requirements.txt') &&
      (hasFile(context.files, context.root, 'api.py') ||
        hasFile(context.files, context.root, 'app.py')) &&
      !hasFile(context.files, context.root, 'manage.py')
    );
  },

  generate(context) {
    const moduleName = hasFile(context.files, context.root, 'api.py')
      ? 'api'
      : 'app';

    const content = [
      'FROM python:3.11-slim',
      'ENV PYTHONUNBUFFERED=1',
      'RUN apt-get update && apt-get install -y --no-install-recommends ' +
        'libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*',
      'WORKDIR /app',
      'COPY requirements.txt .',
      'RUN pip install --no-cache-dir -r requirements.txt gunicorn',
      'COPY . .',
      'EXPOSE 5000',
      `CMD ["gunicorn", "${moduleName}:app", "--bind", "0.0.0.0:5000", ` +
        '"--workers", "1", "--timeout", "180"]',
      '',
    ].join('\n');

    return {
      content,
      files: [],
      warnings: [
        `Selected from the file layout (requirements.txt + ${moduleName}.py); assumes a Flask object named "app".`,
        'Assumes port 5000. A FastAPI project would need uvicorn instead of gunicorn.',
        'Python 3.11 is used because tensorflow 2.15 does not support 3.12.',
        'libgl1 is installed for opencv-python; give the pod at least 3Gi of memory.',
        'Docker build has not been executed.',
      ],
    };
  },
};