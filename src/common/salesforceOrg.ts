import { Record } from 'jsforce';
import { SalesforceObject } from './salesforceObject';

export type SalesforceOrg = {
  objects: SalesforceObject[];
  records: Record[];
};
