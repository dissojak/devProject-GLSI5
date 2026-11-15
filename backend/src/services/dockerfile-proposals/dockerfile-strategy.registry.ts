
import { ConflictError } from '../../domain/errors/index.js';

import type {
  DockerStrategy,
  DockerStrategyContext,
} from './dockerfile-strategy.types.js';

import {
  viteStrategy,
} from './strategies/vite.strategy.js';

import {
  angularStrategy,
} from './strategies/angular.strategy.js';

import {
  springBootStrategy,
} from './strategies/spring-boot.strategy.js';

import {
  dotnetStrategy,
} from './strategies/dotnet.strategy.js';

import { flaskStrategy } from './strategies/flask.strategy.js';
import { symfonyStrategy } from './strategies/symfony.strategy.js';
import { craStrategy } from './strategies/cra.strategy.js';

export function createDockerStrategyRegistry() {
  const strategies: DockerStrategy[] = [];

  function register(strategy: DockerStrategy): void {
    if (
      strategies.some((item) => item.id === strategy.id)
    ) {
      throw new ConflictError(
        `Duplicate Dockerfile strategy: ${strategy.id}`,
      );
    }

    strategy.verify();
    strategies.push(strategy);
  }

  function resolve(
    context: DockerStrategyContext,
  ): DockerStrategy | undefined {
    const c = context as unknown as Record<string, unknown>;
    // eslint-disable-next-line no-console
    console.log(
      '[strategy-debug]',
      'keys=', Object.keys(c),
      'root=', c.root,
      'files=', JSON.stringify(c.files)?.slice(0, 600),
      'technologies=', JSON.stringify(c.technologies)?.slice(0, 600),
    );
    const matches = strategies.filter((strategy) =>
      strategy.matches(context),
    );

    if (matches.length > 1) {
      throw new ConflictError(
        'Ambiguous Dockerfile strategy: multiple technologies match',
      );
    }

    return matches[0];
  }

  return {
    register,
    resolve,
  };
}

export function createDefaultDockerStrategyRegistry() {
  const registry = createDockerStrategyRegistry();

  registry.register(angularStrategy);
  registry.register(viteStrategy);
  registry.register(craStrategy);
  registry.register(springBootStrategy);
  registry.register(dotnetStrategy);
  registry.register(flaskStrategy);
  registry.register(symfonyStrategy);

  return registry;
}
