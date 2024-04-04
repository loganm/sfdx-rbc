import { Record } from 'jsforce';
import { Connection } from '@salesforce/core';
import { RbcConfig } from './config';
import { SalesforceOrgDescribe } from './salesforceOrgDescribe';

export type SalesforceObject = {
  apiName: string;
  externalIdField: string;
  records: SalesforceRecord[];
};

export type SalesforceRecord = {
  [field: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export async function retrieveObject(
  config: RbcConfig,
  connection: Connection,
  describe: SalesforceOrgDescribe,
  apiName: string
): Promise<SalesforceObject> {
  const recordsQuery = buildQuery(config, describe, apiName);
  const recordsQueryResult = await connection.autoFetchQuery(recordsQuery);
  const externalIdField = config.objects.find((object) => object.apiName === apiName)?.externalId as string;
  return {
    apiName,
    externalIdField,
    records: recordsQueryResult.records.map((record) => convertToSalesforceRecord(record, config)),
  };
}

function convertToSalesforceRecord(record: Record, config: RbcConfig): SalesforceRecord {
  const salesforceRecord: SalesforceRecord = {};
  for (const field in record) {
    if (field === 'Id' || field === 'attributes') {
      // do nothing
    } else if (record[field] instanceof Object) {
      const reference = record[field]; // eslint-disable-line
      const referencedObjectConfig = config.objects.find((object) => object.apiName === reference.attributes?.type); // eslint-disable-line
      if (referencedObjectConfig) {
        const fieldName = `${field}.${referencedObjectConfig.externalId}`;
        salesforceRecord[fieldName] = reference[referencedObjectConfig.externalId]; // eslint-disable-line
      }
    } else {
      salesforceRecord[field] = record[field]; // eslint-disable-line
    }
  }
  return salesforceRecord;
}

function buildQuery(config: RbcConfig, describe: SalesforceOrgDescribe, apiName: string): string {
  const objectConfig = config.objects.find((object) => object.apiName === apiName);
  if (!objectConfig) {
    throw new Error(`Object ${apiName} not found in config file`);
  }
  const objectDescribe = describe.objectDescribes.find((object) => object.name === apiName);
  if (!objectDescribe) {
    throw new Error(`Object ${apiName} not found in describe`);
  }
  const fields: string[] = [];
  objectDescribe.fields.map((field) => {
    if (field.createable) {
      if (field.type === 'reference') {
        if (config.objects.find((object) => field.referenceTo && object.apiName === field.referenceTo[0])) {
          fields.push(`${field.relationshipName}.${objectConfig.externalId}`);
        }
      } else {
        fields.push(field.name);
      }
    }
  });
  let queryString = `SELECT ${fields.join(', ')} FROM ${objectDescribe.name}`;
  if (objectConfig?.conditions) {
    queryString += ` WHERE ${objectConfig.conditions}`;
  }
  queryString += ` ORDER BY ${objectConfig.externalId} ASC`;
  return queryString;
}
