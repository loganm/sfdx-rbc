import { Connection } from '@salesforce/core';
import { DescribeSObjectResult } from 'jsforce';
import { ObjectConfig } from './config';

export class SalesforceObject {
  public config: ObjectConfig;
  public conn: Connection;
  private describePromise!: Promise<DescribeSObjectResult>;

  public constructor(config: ObjectConfig, conn: Connection) {
    this.config = config;
    this.conn = conn;
  }

  public async describe(): Promise<DescribeSObjectResult> {
    if (this.describePromise === undefined) {
      this.describePromise = this.conn.describeSObject(this.config.apiName);
    }
    return this.describePromise;
  }

  // public async loadRecords(): Promise<void> {
  //   const describe = await this.describe();
  //   this.recordsPromise = this.conn.sobject(describe.name)
  //     .select('*')
  //     .where(this.config.conditions)
  //     .execute();
  //   // return this.recordsPromise;
  // }
}
