/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { ResourceModels } from 'azure-arm-resource';
import * as path from 'path';
import * as vscode from 'vscode';
import { AzureAccount, AzureResourceNode, AzureResourceTypeProvider, AzureResourceViewNode } from './azure-account.api';
import { localize } from './localize';

export function functionsResourceType(context: vscode.ExtensionContext): void {
    const azureAccountExtension: vscode.Extension<AzureAccount> | undefined = vscode.extensions.getExtension<AzureAccount>('ms-vscode.azure-account');
    if (!azureAccountExtension) {
        throw new Error(localize('NoAccountExtensionError', 'The Azure Account Extension is required for the App Service tools.'));
    }
    const azureAccount: AzureAccount = azureAccountExtension.exports;
    context.subscriptions.push(azureAccount.registerResourceTypeProvider('azureFunctions.resourceType', new FunctionsTypeProvider()));
}

class FunctionsTypeProvider implements AzureResourceTypeProvider<AzureResourceViewNode> {
    public treeDataProvider: FunctionsTreeDataProvider = new FunctionsTreeDataProvider();
    public async adaptResourceNode(node: AzureResourceNode<ResourceModels.GenericResource>): Promise<AzureResourceViewNode> {
        node.provider = 'azureFunctions.resourceType';
        node.treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        return node;
    }
}

class FunctionsTreeDataProvider implements vscode.TreeDataProvider<AzureResourceViewNode> {
    public getTreeItem(element: AzureResourceViewNode): vscode.TreeItem {
        if (element instanceof vscode.TreeItem) {
            return element;
        }
        return (<AzureResourceNode<ResourceModels.GenericResource>>element).treeItem;
    }
    public async getChildren(element?: AzureResourceViewNode): Promise<AzureResourceViewNode[]> {
        if (element instanceof vscode.TreeItem) {
            return [];
        }
        return [
            new FunctionsNode('Application Settings', path.join(__dirname, '../../resources/dark/AppSettings_color.svg'), vscode.TreeItemCollapsibleState.Collapsed),
            new FunctionsNode('Functions', path.join(__dirname, '../../resources/dark/BulletList.svg'), vscode.TreeItemCollapsibleState.Collapsed),
            new FunctionsNode('Proxies', path.join(__dirname, '../../resources/dark/BulletList.svg'), vscode.TreeItemCollapsibleState.Collapsed)
        ];
    }
}

class FunctionsNode extends vscode.TreeItem implements AzureResourceViewNode {
    public provider: string = 'azureFunctions.resourceType';

    constructor(label: string, iconPath: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.iconPath = iconPath;
    }
}
