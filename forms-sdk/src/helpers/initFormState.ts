import { FormCache } from "../form-cache";
import { StepHelper } from "./stepHelper";
import { FormStorage } from "../form-storage";
import { ElementDependencies, FormConstants, FormContainer, FormState, FormSubmission, FormValidationResult, StepDependencies } from "../models";
import { getDefaultValue } from "./elementHelper";
import { equals, isNullOrEmpty } from "./utils";

/**
 * Function to initialize FormState object
 * @param formContainer A form container
 * @returns An object of FormState
 */
export function initFormState(formContainer: FormContainer, currentPageUrl?: string, history? : any): FormState {
    const formStorage = new FormStorage(formContainer);
    const formData = formStorage.loadFormDataFromStorage();
    const formCache = new FormCache();
    const stepHelper = new StepHelper(formContainer);

    let formSubmissions = [] as FormSubmission[];
    let formValidationResults = [] as FormValidationResult[];
    let stepDependencies = [] as StepDependencies[];
    let elementDependencies = [] as ElementDependencies[]

    formContainer.steps?.forEach(s => {
        s.elements.forEach(e => {
            if (e.key != s.formStep.key) {
                //init form validation
                formValidationResults = formValidationResults.concat({ elementKey: e.key, result: {valid: true, message: ""} });
                //init form submission
                formSubmissions = formSubmissions.concat({ elementKey: e.key, value: getDefaultValue(e) } as FormSubmission);
                //init form elements dependencies
                elementDependencies = elementDependencies.concat({ elementKey: e.key, isSatisfied: true, sastisfiedAction : (e.properties as any).satisfiedAction });
            }
        });
        stepDependencies = stepDependencies.concat({ elementKey: s.formStep.key, isSatisfied: false });
    });

    //binding the elements with saved data between Next/Prev navigation
    if(formData.length > 0){
        formSubmissions = formSubmissions.map(s => {
            let savedData = formData.find(d => equals(d.elementKey, s.elementKey));
            return savedData ? savedData : s;
        });
    }

    let stepIndexCached = formCache.get(FormConstants.FormCurrentStep + formContainer.key) as string;
    let currentStepIndex = isNullOrEmpty(stepIndexCached) 
        ? stepHelper.getCurrentStepIndex(currentPageUrl)
        : parseInt(stepIndexCached);

    return {
        isReset: false,
        focusOn: "",
        dependencyInactiveElements: [],
        currentStepIndex,
        formSubmissions,
        formValidationResults,
        stepDependencies,
        formContainer,
        history,
        elementDependencies
    } as FormState;
}