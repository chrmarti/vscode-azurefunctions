/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AzureAccountWrapper } from './azureAccountWrapper';
import { AppServicePlanStep, AppKind, ResourceGroupStep, SubscriptionStep, WebsiteCreator, WebsiteOS, WebsiteNameStep, WebsiteStep } from "./WebsiteCreator";
import { SubscriptionModels, ResourceManagementClient, ResourceModels } from 'azure-arm-resource';
import { UserCancelledError } from './errors';
import WebSiteManagementClient = require('azure-arm-website');
import { WizardStep } from "./wizard";
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
        this.steps.push(new SubscriptionStep(this, this.azureAccount,
            {
                prompt: "Select the subscription to create the new Function App in."
            },
            this.subscription, this.persistence));
        this.steps.push(new WebsiteNameStep(this, this.azureAccount,
            {
                prompt: "Enter a globally unique name for the new Function App."
            },
            this.persistence));
        this.steps.push(new ResourceGroupStep(this, this.azureAccount, this.persistence));
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
