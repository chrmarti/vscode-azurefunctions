/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AzureAccountWrapper } from './azureAccountWrapper';
import { AppServicePlanStep, AppKind, ResourceGroupStep, SubscriptionStep, WebsiteCreator, WebsiteCreatorStepBase, WebsiteOS, WebsiteNameStep, WebsiteStep } from "./WebsiteCreator";
import { SubscriptionModels, ResourceManagementClient, ResourceModels } from 'azure-arm-resource';
import StorageManagementClient = require('azure-arm-storage');
import StorageAccount from 'azure-arm-storage/lib/models/storageAccount';
import Sku from 'azure-arm-storage/lib/models/sku';
import { UserCancelledError } from './errors';
import { WizardBase, WizardStep, QuickPickItemWithData } from "./wizard";
import * as WebSiteModels from '../node_modules/azure-arm-website/lib/models';
import { localize } from './util';
import * as util from './util';

export class FunctionAppCreator extends WebsiteCreator {
    constructor(output: vscode.OutputChannel, readonly azureAccount: AzureAccountWrapper, subscription: SubscriptionModels.Subscription, persistence?: vscode.Memento) {
        super(output, azureAccount, subscription, persistence);
    }

    protected appKind: AppKind = "functionapp";
    protected websiteOS: WebsiteOS = "windows";

    protected prepareSteps(): void {
        this.steps.push(new SubscriptionStep(this, this.azureAccount, { prompt: "Select the subscription to create the new Function App in." }, this.subscription, this.persistence));
        this.steps.push(new WebsiteNameStep(this, this.azureAccount, { prompt: "Enter a globally unique name for the new Function App." }, this.persistence));
        this.steps.push(new ResourceGroupStep(this, this.azureAccount, this.persistence));
        this.steps.push(new StorageAccountStep(this, this.azureAccount, this.persistence));
        // asdf this.steps.push(new AppServicePlanStep(this, this.azureAccount, this.appKind, this.websiteOS, this.persistence));
        this.steps.push(new WebsiteStep(this, this.azureAccount, this.appKind, this.websiteOS,
            {
                title: "Create Function App",
                creating: "Creating new Function App:",
                created: "Created new Function App:"
            }, this.persistence));
    }

    protected beforeExecute(_step: WizardStep, stepIndex: number) {
        if (stepIndex == 0) {
            this.writeline(localize('azFunc.CreatingFuncApp', 'Creating new Function App in Azure...'));
        }
    }

    protected onExecuteError(error: Error) {
        if (error instanceof UserCancelledError) {
            return;
        }
        this.writeline(localize("azFunc.FailedCreatingFuncApp", "Failed to create new Function App in Azure: {0}", error.message));
        this.writeline('');
    }
}

export class StorageAccountStep extends WebsiteCreatorStepBase {
    private _createNew: boolean;
    private _account: {
        name: string;
        sku: Sku;
        location: string;
    };

    constructor(wizard: WizardBase, azureAccount: AzureAccountWrapper, persistence?: vscode.Memento) {
        super(wizard, 'Select or create a storage account', azureAccount, persistence);
    }

    async prompt(): Promise<void> {
        const createNewItem: QuickPickItemWithData<StorageAccount> = {
            persistenceId: "",
            label: '$(plus) Create New Storage Account',
            description: null,
            data: null
        };
        const quickPickOptions = { placeHolder: `Select a storage account that supports blobs, queues and tables. (${this.stepProgressText})` };
        const subscription = this.getSelectedSubscription();
        const storageClient = new StorageManagementClient(this.azureAccount.getCredentialByTenantId(subscription.tenantId), subscription.subscriptionId);

        var storageTask = storageClient.storageAccounts.list();
        var s = await storageTask;
        var storageAccounts: StorageAccount[];

        var locationsTask = this.azureAccount.getLocationsBySubscription(this.getSelectedSubscription());
        var locations: SubscriptionModels.Location[];
        var suggestedName = this.getsuggestedRelatedName();

        const quickPickItemsTask = Promise.all([storageTask, locationsTask]).then(results => {
            const quickPickItems: QuickPickItemWithData<StorageAccount>[] = [createNewItem];
            storageAccounts = <StorageAccount[]>results[0];
            locations = results[1];

            // asdf must support blobs, queues, tables
            storageAccounts.forEach(sa => {
                quickPickItems.push({
                    persistenceId: sa.id,
                    label: sa.name,
                    description: `(${locations.find(l => l.name.toLowerCase() === sa.location.toLowerCase()).displayName})`,
                    detail: '',
                    data: sa
                });
            });

            return quickPickItems;
        });

        // Cache storage account separately per subscription
        const result = await this.showQuickPick(quickPickItemsTask, quickPickOptions, `"NewWebApp.StorageAccount/${subscription.id}`);

        if (result.data) {
            this._createNew = false;
            this._account = result.data;
            return;
        }

        this._createNew = true;

        var newAccountName: string;
        var nameValid = false;
        while (!nameValid) {
            newAccountName = await this.showInputBox({
                value: suggestedName,
                prompt: 'Enter the name of the new storage account.',
                validateInput: (value: string): string => {
                    value = value ? value.trim() : '';

                    if (!value.match(/^[a-z0-9]{3,24}$/ig)) {
                        return 'Storage account name must contain 3-24 lowercase characters or numbers';
                    }

                    return null;
                }
            });

            // Check if the name has already been taken...
            var nameAvailability = await storageClient.storageAccounts.checkNameAvailability(newAccountName);
            if (!nameAvailability.nameAvailable) {
                await vscode.window.showWarningMessage(nameAvailability.message);
            } else {
                nameValid = true;
            }
        }

        this._account = {
            name: newAccountName.trim(),
            sku: { name: "Standard_LRS" },
            location: this.getSelectedResourceGroup().location
        }
    }

    async execute(): Promise<void> {
        if (!this._createNew) {
            this.wizard.writeline(`Existing storage account "${this._account.name} (${this._account.location})" will be used.`);
            return;
        }

        this.wizard.writeline(`Creating new storage account "${this._account.name} (${this._account.location}, ${this._account.sku.name})"...`);
        const subscription = this.getSelectedSubscription();
        const storageClient = new StorageManagementClient(this.azureAccount.getCredentialByTenantId(subscription.tenantId), subscription.subscriptionId);
        var account = await storageClient.storageAccounts.create(this.getSelectedResourceGroup().name,
            this._account.name,
            {
                sku: this._account.sku,
                kind: "Storage",
                location: this._account.location
            }
        );
        this.wizard.writeline(`Storage account created.`);
    }

    get storageAccount(): StorageAccount {
        return this._account;
    }

    get createNew(): boolean {
        return this._createNew;
    }
}

