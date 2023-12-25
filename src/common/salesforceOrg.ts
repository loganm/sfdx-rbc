import { Connection } from '@salesforce/core';
import { RbcConfig } from './config';
import { SalesforceObject, retrieveObject } from './salesforceObject';
import { SalesforceOrgDescribe, describeOrg } from './salesforceOrgDescribe';

// Instead of a class, we define a type for our SalesforceOrg
type SalesforceOrg = {
  objects: SalesforceObject[];
  describe: SalesforceOrgDescribe;
};

// We use a function to create a SalesforceOrg
export async function retrieve(config: RbcConfig, connection: Connection): Promise<SalesforceOrg> {
  const describe = await describeOrg(config, connection);
  const objects = await Promise.all(
    config.objects.map((objectConfig) => retrieveObject(config, connection, describe, objectConfig.apiName))
  );
  return { objects, describe };
}
