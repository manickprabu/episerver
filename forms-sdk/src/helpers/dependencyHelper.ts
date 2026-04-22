import { Condition, ElementDependencies, FormSubmission } from "../models";
import { equals } from "./utils";

export function getConcatString(srcObject: any, seperator: string): string {
    return (srcObject instanceof Array) ? srcObject.join(seperator) : srcObject as string;
}

export function getValueOfDependeeElement(condition: Condition ,formSubmissions: FormSubmission[], elementDependencies: ElementDependencies[]) : any  {
    var dependeeFieldValue = formSubmissions.filter(s => equals(s.elementKey, condition.field))[0]?.value;
    const dependeeElement = elementDependencies.find(e => e.elementKey === condition.field)
    if (dependeeElement && !dependeeElement.isSatisfied ) {
        // if element is in the inactive list, consider its value as undefined
        dependeeFieldValue = undefined;
    }
    return dependeeFieldValue;
}