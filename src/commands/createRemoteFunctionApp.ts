/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// tslint:disable-next-line:no-require-imports
import WebSiteManagementClient = require('azure-arm-website');
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { AzureFunctionsExplorer } from '../AzureFunctionsExplorer';
import * as FunctionsCli from '../functions-cli';
import { SubscriptionNode } from '../nodes/SubscriptionNode';
import { FunctionAppCreator } from "../FunctionAppCreator";
import { AzureAccountWrapper } from "../AzureAccountWrapper";
import * as TemplateFiles from '../template-files';
import * as util from '../util';
import { localize } from '../util';

export async function createRemoteFunctionApp(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, azureAccount: AzureAccountWrapper, explorer: AzureFunctionsExplorer, node?: SubscriptionNode): Promise<void> {
    if (!node) {
        node = <SubscriptionNode>(await explorer.showNodePicker(SubscriptionNode.contextValue));
    }

    const client: WebSiteManagementClient = node.getWebSiteClient();
    // await client.webApps.stop(node.resourceGroup, node.name);
    // await util.waitForFunctionAppState(client, node.resourceGroup, node.name, util.FunctionAppState.Stopped);
    // explorer.refresh(node.parent);

    var subscription = azureAccount.getFilteredSubscriptions().find(value => value.subscriptionId === client.subscriptionId); // asdf
    const wizard = new FunctionAppCreator(outputChannel, azureAccount, subscription, context.globalState);
    const result = await wizard.run();

    if (result.status === 'Completed') {
        vscode.commands.executeCommand('appService.Refresh', node);
    }

    throw "hi";
    // if (!node) {
    //     node = <FunctionAppNode>(await explorer.showNodePicker(FunctionAppNode.contextValue));
    // }

    // const client: WebSiteManagementClient = node.getWebSiteClient();

    // await client.webApps.start(node.resourceGroup, node.name);
    // await util.waitForFunctionAppState(client, node.resourceGroup, node.name, util.FunctionAppState.Running);
    // explorer.refresh(node.parent);


    // const newFolderId: string = 'newFolder';
    // let folderPicks: util.PickWithData<string>[] = [new util.PickWithData(newFolderId, localize('azFunc.newFolder', '$(plus) New Folder'))];
    // const folders: vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;
    // if (folders) {
    //     folderPicks = folderPicks.concat(folders.map((f: vscode.WorkspaceFolder) => new util.PickWithData('', f.uri.fsPath)));
    // }
    // const folder: util.PickWithData<string> = await util.showQuickPick<string>(folderPicks, localize('azFunc.newFuncAppSelectFolder', 'Select a workspace folder for your new function app'));
    // const createNewFolder: boolean = folder.data === newFolderId;

    // const functionAppPath: string = createNewFolder ? await util.showFolderDialog() : folder.label;

    // const tasksJsonPath: string = path.join(functionAppPath, '.vscode', 'tasks.json');
    // const tasksJsonExists: boolean = fs.existsSync(tasksJsonPath);
    // const launchJsonPath: string = path.join(functionAppPath, '.vscode', 'launch.json');
    // const launchJsonExists: boolean = fs.existsSync(launchJsonPath);

    // await FunctionsCli.createFunctionApp(outputChannel, functionAppPath);

    // if (!tasksJsonExists && !launchJsonExists) {
    //     await util.writeToFile(tasksJsonPath, TemplateFiles.getTasksJson());
    //     await util.writeToFile(launchJsonPath, TemplateFiles.getLaunchJson());
    // }

    // if (createNewFolder) {
    //     // If we created a new folder, open it now. NOTE: This will restart the extension host
    //     await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(functionAppPath), false);
    // }
}
