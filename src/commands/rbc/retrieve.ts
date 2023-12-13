import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages, Org } from '@salesforce/core';
import { Record } from 'jsforce';
import { log } from '@oclif/core/lib/cli-ux';
import * as fs from 'fs-extra';
import { loadConfig, RbcConfig } from '../../common/config';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-rbc', 'rbc.retrieve');

export type RbcRetrieveResult = {
  path: string;
};

export default class RbcRetrieve extends SfCommand<RbcRetrieveResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'target-org': Flags.requiredOrg({
      summary: messages.getMessage('flags.target-org.summary'),
      char: 'o',
      required: true,
    }),
    'config-file': Flags.file({
      summary: messages.getMessage('flags.config-file.summary'),
      char: 'f',
      required: true,
      exists: true,
    }),
    'api-version': Flags.orgApiVersion({
      summary: messages.getMessage('flags.api-version.summary'),
      char: 'a',
    }),
  };

  public async run(): Promise<RbcRetrieveResult> {
    const { flags } = await this.parse(RbcRetrieve);

    // Get the flags
    const targetOrg: Org = flags['target-org'];
    const configFileName: string = flags['config-file'];
    const apiVersion = flags['api-version'];

    // Load the configuration file
    const config: RbcConfig = await loadConfig(configFileName);

    // Get connection from the org
    const conn: Connection = targetOrg.getConnection(apiVersion);

    // Get the schema for objects from the target org
    const objectDescribes = await Promise.all(config.objects.map((object) => conn.describeSObject(object.apiName)));

    // Query each object
    const objectRecords = await Promise.all(
      objectDescribes.map((objectDescribe) => conn.query(`SELECT Id, Name FROM ${objectDescribe.name}`))
    );

    // Write records to files
    const promises: Array<Promise<void>> = [];
    objectRecords.forEach((object) =>
      object.records.forEach((record) => {
        promises.push(writeRecordFile(config, record));
      })
    );
    await Promise.all(promises);

    // Return something because I have to. Will deal with JSON return value later.
    return {
      path: '/Users/logan/Source/sfdx-rbc/src/commands/rbc/retrieve.ts',
    };
  }
}

async function writeRecordFile(config: RbcConfig, record: Record): Promise<void> {
  const objectConfig = config.objects.find((object) => object.apiName === record.attributes?.type);
  if (!objectConfig) {
    log('Object configuration not found.');
    return;
  }
  const rbcRootDirectory = 'rbc';
  const rbcObjectDirectory = `${rbcRootDirectory}/${objectConfig.apiName}`;
  const filePath = `${rbcObjectDirectory}/${String(record[objectConfig.externalId])}.json`;

  try {
    await fs.remove(rbcRootDirectory); // Remove the 'rbc' directory if it exists
    await fs.mkdirp(rbcObjectDirectory); // Create the 'rbc/object' directory
    const jsonContent = JSON.stringify(record, null, 2); // Convery the record to pretty JSON
    await fs.writeFile(filePath, jsonContent); // Write the record to a file
  } catch (e) {
    log('Failed to write file');
  }
}
