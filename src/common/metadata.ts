import { Connection } from '@salesforce/core';

export class Metadata {
  private conn: Connection;

  public constructor(conn: Connection) {
    this.conn = conn;
  }

  public async loadObjectDescribe(apiName: string): Promise<void> {
    await this.conn.describeSObject(apiName);
  }
}
