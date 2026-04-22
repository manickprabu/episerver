'use strict';

import { parseKeyToGuid } from "../helpers";
import { FormContainer } from "../models";
import { ApiClient } from "./apiClient";
import { ApiClientConfig, defaultConfig } from "./apiClientConfig";
import { ApiConstant } from "./apiConstant";

/**
 * Class for load Form
 */
export class FormLoader<T extends FormContainer> {
    readonly client: ApiClient<T>;

    /**
     *  Constructor an instance of FormLoader
     * 
     * @param config Optional config to use. This config will combined with the defaultConfig.
     */
    constructor(config?: Partial<ApiClientConfig>) {
        this.client = new ApiClient<T>({ ...defaultConfig, ...config });
    }

    /**
     * Get a form with a GUID
     * 
     * @param key GUID of form
     * @param language Localization for form
     * @returns A promise with a form 
     */
    getForm(key: string, language: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.client.get(`${ApiConstant.apiEndpoint}/${key}`, { locale: language })
                .then((response: T) => {
                    resolve(response);
                })
                .catch((error: any) => {
                    reject(error);
                });
        })
    }

    /**
     * Query a form with a GUID
     * 
     * @param optiGraphUrl The endpoint url of Optimizely Graph
     * @param key GUID of form
     * @param language Localization for form
     * @returns A promise with a form 
     */
    queryForm(optiGraphUrl: string, key: string, language: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let query: string = `
            query FormQuery($key: String, $language: String) {
                FormContainer(where: { Key: { eq: $key }, Locale: { eq: $language } }) {
                    items {
                        Key
                        Locale
                        Properties
                        Localizations
                        FormElements {
                            Key
                            ContentType
                            DisplayName
                            Locale
                            Localizations
                            Properties
                            Locale
                        }
                    }
                }
            }
            `;
            let variables: any = { key: key, language };
            fetch(optiGraphUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    query,
                    variables,
                }),
            })
                .then(async (response: Response) => {
                    if (response.ok) {
                        let json = await response.json();
                        let formStr = json.data.FormContainer.items[0];
                        let convertedFormStr = this.convertFirstLetterToLowerCase(formStr) as T
                        resolve(convertedFormStr)
                    }
                    else {
                        reject(response);
                    }
                })
                .catch((error: any) => {
                    reject(error);
                });
        });
    }

    /**
     * Function to convert the first letter of object keys to lowercase
     * @param data Data in json format
     * **/
    private convertFirstLetterToLowerCase(data: any): any {
        const isObject = typeof data === 'object'
        if (data && isObject && !Array.isArray(data)) {
            return Object.keys(data).reduce((accumulator, key) => {
                const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
                accumulator[normalizedKey] = isObject ? this.convertFirstLetterToLowerCase(data[key]) : data[key];
                return accumulator;
            }, {} as any);
        } else if (Array.isArray(data)) {
            return data.map(item => this.convertFirstLetterToLowerCase(item));
        }
        return data;
    }
}