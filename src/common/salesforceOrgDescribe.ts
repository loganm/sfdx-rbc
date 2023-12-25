import { Connection, DescribeSObjectResult } from 'jsforce';
import { RbcConfig } from './config';

export type SalesforceOrgDescribe = {
  objectDescribes: DescribeSObjectResult[];
};

export async function describeOrg(config: RbcConfig, conn: Connection): Promise<SalesforceOrgDescribe> {
  const objectDescribes = await Promise.all(
    config.objects.map((objectConfig) => conn.describeSObject(objectConfig.apiName))
  );
  return { objectDescribes };
}
