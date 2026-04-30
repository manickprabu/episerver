export interface ExtractedUrlParams {
  relativePath: string;
  locales?: string;
  language?: string;
  contentId?: number;
  workId?: number;
}

export function extractParams(urlPath: string): ExtractedUrlParams {
  let relativePath = urlPath.length > 1 && urlPath !== '/search' ? urlPath : '/en';
  let contentId: number | undefined;
  let workId: number | undefined;

  const epiContentPrefix = '/EPiServer/CMS/Content/';
  if (relativePath.startsWith(epiContentPrefix)) {
    relativePath = relativePath.substring(epiContentPrefix.length - 1);
  }

  if (relativePath.endsWith('/')) {
    relativePath = relativePath.slice(0, -1);
  }

  if (relativePath.includes(',')) {
    const [, , idString] = relativePath.split(',');
    if (idString.includes('_')) {
      [contentId, workId] = idString.split('_').map((value) => parseInt(value, 10));
    } else {
      contentId = parseInt(idString, 10);
    }
    relativePath = relativePath.substring(0, relativePath.indexOf(','));
  }

  if (relativePath.endsWith('/')) {
    relativePath = relativePath.slice(0, -1);
  }

  const urlSegments = relativePath.split('/');
  const language = urlSegments.length
    ? urlSegments.find(
        (segment) =>
          segment.length === 2 || (segment.indexOf('-') === 2 && segment.length === 5)
      )
    : 'en';

  return { relativePath, locales: language, language, contentId, workId };
}
