import React from "react";
import { FormContainer, IdentityInfo, StepBuilder, initFormState } from "@episerver/forms-sdk";
import { FormProvider } from "../context/FormProvider";
import { FormBody } from "./FormBody";

export interface FormContainerProps {
    /**
     * The form data to render form
     */
    form: FormContainer;

    /**
     * Access token for form submit
     */
    identityInfo?: IdentityInfo;

    /**
     * The base url of Headless Form API
     */
    baseUrl: string;

    /**
     * The instance of useHistory() received from react-router-dom
     */
    history?: any;

    /**
     * The public url of current page
     */
    currentPageUrl?: string;
}

export function FormContainerBlock(props: FormContainerProps){
    const stepBuilder = new StepBuilder(props.form);
    const form = stepBuilder.buildForm();
    const state = initFormState(form, props.currentPageUrl, props.history);
    {/* finally return the form */}
    return (
        <FormProvider initialState={state}>
            <FormBody identityInfo={props.identityInfo} baseUrl={props.baseUrl} history={props.history} currentPageUrl={props.currentPageUrl}/>
        </FormProvider>
    )
}