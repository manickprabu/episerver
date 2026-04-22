export const DefaultAllowedContentTypes = [
    "TextboxElementBlock",
    "TextareaElementBlock",
    "NumberElementBlock",
    "RangeElementBlock",
    "UrlElementBlock",
    "ImageChoiceElementBlock",
    "SelectionElementBlock",
    "ChoiceElementBlock",
]

export function getAllowedContentTypesInRichtext(allowedContentType? : string[], notAllowedContentType?: string[] ) {
    let returnContentTypes = DefaultAllowedContentTypes

    if (allowedContentType) {
        returnContentTypes = [...allowedContentType, ...DefaultAllowedContentTypes];
    }
    
    if (notAllowedContentType) {
        returnContentTypes.filter(item => !notAllowedContentType.includes(item));
    }   
    
    return returnContentTypes
}