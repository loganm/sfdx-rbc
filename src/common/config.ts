import { promises as fs } from 'graceful-fs';

export interface RbcConfig {
  objects: ObjectConfig[];
}

export interface ObjectConfig {
  apiName: string;
  conditions: string;
  externalId: string;
}

export async function loadConfig(path: string): Promise<RbcConfig> {
  const configFile = await fs.readFile(path, 'utf-8');
  const config = JSON.parse(configFile) as RbcConfig;
  return config;
}
