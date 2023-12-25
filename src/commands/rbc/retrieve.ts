import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages, Org } from '@salesforce/core';
import * as fs from 'fs-extra';
import { loadConfig, RbcConfig } from '../../common/config';
import { retrieve } from '../../common/salesforceOrg';

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

    const salesforceOrg = await retrieve(config, conn);

    const rbcRootDirectory = 'rbc';
    await fs.remove(rbcRootDirectory); // Remove the 'rbc' directory if it exists
    await fs.mkdirp(rbcRootDirectory); // Create the 'rbc' directory

    await Promise.all(
      salesforceOrg.objects.map(async (object) => {
        const rbcObjectDirectory = `${rbcRootDirectory}/${object.apiName}`;
        await fs.mkdirp(rbcObjectDirectory); // Create the 'rbc/object' directory

        await Promise.all(
          object.records.map(async (record) => {
            const filePath = `${rbcObjectDirectory}/${record[object.externalIdField] as string}.json`;
            const jsonContent = JSON.stringify(record, null, 2); // Convert the record to pretty JSON
            await fs.writeFile(filePath, jsonContent); // Write the record to a file
          })
        );
      })
    );

    // Return something because I have to. Will deal with JSON return value later.
    return {
      path: '/Users/logan/Source/sfdx-rbc/src/commands/rbc/retrieve.ts',
    };
  }
}
