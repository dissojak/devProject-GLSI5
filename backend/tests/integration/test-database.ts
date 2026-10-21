import { MongoMemoryServer } from 'mongodb-memory-server';

import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';

/**
 * Boots a throwaway MongoDB (mongodb-memory-server) and reuses one instance
 * per worker for speed. Tests call connectTestingModule() beforeAll and
 * disconnectTestingModule() afterAll.
 */

let memoryServer: MongoMemoryServer | undefined;

export async function startMemoryServer(): Promise<string> {
  memoryServer ??= await MongoMemoryServer.create();
  return memoryServer.getUri();
}

export async function stopMemoryServer(): Promise<void> {
  await memoryServer?.stop();
  memoryServer = undefined;
}

export async function connectTestingModule(dbName = 'deployment_planner_test'): Promise<void> {
  const uri = await startMemoryServer();
  await connectDatabase(`${uri}${dbName}`);
}

export async function disconnectTestingModule(): Promise<void> {
  await disconnectDatabase();
}
