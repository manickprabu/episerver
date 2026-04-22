export const extractParams = (urlPath: string) => {
    let relativePath = (urlPath.length > 1 && urlPath !== "/search") ? urlPath : '/en'
    let contentId
    let workId = undefined

    const epiContentPrefix = "/EPiServer/CMS/Content/";
    if (relativePath.startsWith(epiContentPrefix)) {
        relativePath = relativePath.substring(epiContentPrefix.length - 1);
    }

    if (relativePath.endsWith('/')) {
        relativePath = relativePath.slice(0, -1)
    }

    if (relativePath.includes(",")) {
        const [, , idString] = relativePath.split(",")
        if (idString.includes("_")) {
            [contentId, workId] = idString.split("_").map(x => parseInt(x));

        } else {
            contentId = parseInt(idString)
        }
        relativePath = relativePath.substring(0, relativePath.indexOf(','));
    }

    if (relativePath.endsWith('/')) {
        relativePath = relativePath.slice(0, -1)
    }

    const urlSegments = relativePath.split('/')
    let language = urlSegments.length ? 
        urlSegments.find(s => 
            s.length === 2 || //2 letter language code, ex: en, sv,...
            (s.indexOf("-") === 2 && s.length === 5) //##-## format language code, ex: nl-BE, vi-VN,...
        ) 
        : "en"

    return { relativePath, locales: language, language, contentId, workId }
}