/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AzureAccountWrapper } from './azureAccountWrapper';
import { AppServicePlanStep, AppKind, ResourceGroupStep, SubscriptionStep, WebsiteCreator, WebsiteOS, WebsiteNameStep, WebsiteStep } from "./WebsiteCreator";
import { WizardBase } from './wizard';
import { SubscriptionModels, ResourceManagementClient, ResourceModels } from 'azure-arm-resource';
import { UserCancelledError } from './errors';
import WebSiteManagementClient = require('azure-arm-website');
import { WizardStep } from "./wizard";
import * as WebSiteModels from '../node_modules/azure-arm-website/lib/models';

export class WebAppCreator extends WebsiteCreator {
    constructor(output: vscode.OutputChannel, readonly azureAccount: AzureAccountWrapper, subscription: SubscriptionModels.Subscription, persistence?: vscode.Memento) {
        super(output, azureAccount, subscription, persistence);
    }

    protected appKind: AppKind = "app";
    protected websiteOS: WebsiteOS = "linux";

    protected prepareSteps(): void {
        this.steps.push(new SubscriptionStep(this, this.azureAccount,
            {
                prompt: "Select the subscription to create the new Web App in."
            },
            this.subscription, this.persistence));
        this.steps.push(new WebsiteNameStep(this, this.azureAccount,
            {
                prompt: "Enter a globally unique name for the new Web App."
            },
            this.persistence));
        this.steps.push(new ResourceGroupStep(this, this.azureAccount, this.persistence));
        this.steps.push(new AppServicePlanStep(this, this.azureAccount, this.appKind, this.websiteOS, this.persistence));
        this.steps.push(new WebsiteStep(this, this.azureAccount, this.appKind, this.websiteOS, {
            title: "Create Web App",
            creating: "Creating new Web App:",
            created: "Created new Web App:"
        },
            this.persistence));
    }

    protected beforeExecute(_step: WizardStep, stepIndex: number) {
        if (stepIndex == 0) {
            this.writeline('Creating new Web App...');
        }
    }

    protected onExecuteError(error: Error) {
        if (error instanceof UserCancelledError) {
            return;
        }
        this.writeline(`Failed to create new Web App: ${error.message}`);
        this.writeline('');
    }
}
