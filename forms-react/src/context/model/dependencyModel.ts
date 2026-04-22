export class DependencyElementData {
    elementId: string
    condition: boolean
    constructor(elementId: string, condition: boolean) {
        this.elementId = elementId
        this.condition = condition
    }
}