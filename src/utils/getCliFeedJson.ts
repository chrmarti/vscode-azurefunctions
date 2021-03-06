/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// tslint:disable-next-line:no-require-imports
import request = require('request-promise');

const funcCliFeedUrl: string = 'https://functionscdn.azureedge.net/public/cli-feed-v3.json';

export type cliFeedJsonResponse = {
    tags: {
        [tag: string]: {
            release: string,
            displayName: string,
            hidden: boolean
        }
    },
    releases: {
        [release: string]: {
            templateApiZip: string
        }
    }
};

export async function getCliFeedJson(): Promise<cliFeedJsonResponse> {
    const funcJsonOptions: request.OptionsWithUri = {
        method: 'GET',
        uri: funcCliFeedUrl
    };
    return <cliFeedJsonResponse>JSON.parse(await <Thenable<string>>request(funcJsonOptions).promise());
}
