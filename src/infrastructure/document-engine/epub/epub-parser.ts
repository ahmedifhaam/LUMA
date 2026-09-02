export interface EpubManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties: string;
}

export interface EpubSpineItem {
  idref: string;
  href: string;
}

export interface EpubNavItem {
  title: string;
  href: string;
  children: EpubNavItem[];
}

export interface ParsedEpub {
  title: string | null;
  author: string | null;
  opfDir: string;
  spine: EpubSpineItem[];
  manifest: Map<string, EpubManifestItem>;
  nav: EpubNavItem[];
  coverHref: string | null;
  readFile: (path: string) => Promise<string | null>;
  readBlob: (path: string) => Promise<Blob | null>;
}

function resolvePath(baseDir: string, href: string): string {
  const withoutFragment = href.split('#')[0] ?? href;
  if (!withoutFragment || withoutFragment.startsWith('/')) {
    return withoutFragment.replace(/^\//, '');
  }
  const parts = [...baseDir.split('/'), ...withoutFragment.split('/')];
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }
  return resolved.join('/');
}

function textContent(el: Element | null): string {
  return el?.textContent?.trim() ?? '';
}

function parseOpfMetadata(opf: Document): { title: string | null; author: string | null } {
  const title = textContent(opf.querySelector('metadata > dc\\:title, metadata > title'));
  const author = textContent(
    opf.querySelector('metadata > dc\\:creator, metadata > creator'),
  );
  return { title: title || null, author: author || null };
}

function parseManifest(opf: Document): Map<string, EpubManifestItem> {
  const map = new Map<string, EpubManifestItem>();
  for (const item of opf.querySelectorAll('manifest > item')) {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (!id || !href) continue;
    map.set(id, {
      id,
      href,
      mediaType: item.getAttribute('media-type') ?? '',
      properties: item.getAttribute('properties') ?? '',
    });
  }
  return map;
}

function parseSpine(opf: Document, manifest: Map<string, EpubManifestItem>): EpubSpineItem[] {
  const spine: EpubSpineItem[] = [];
  for (const ref of opf.querySelectorAll('spine > itemref')) {
    const idref = ref.getAttribute('idref');
    if (!idref) continue;
    const item = manifest.get(idref);
    if (!item) continue;
    spine.push({ idref, href: item.href });
  }
  return spine;
}

function findCoverHref(
  opf: Document,
  manifest: Map<string, EpubManifestItem>,
): string | null {
  for (const item of manifest.values()) {
    if (item.properties.split(/\s+/).includes('cover-image')) {
      return item.href;
    }
  }
  const coverMeta = opf.querySelector('metadata > meta[name="cover"]');
  const coverId = coverMeta?.getAttribute('content');
  if (coverId) {
    const item = manifest.get(coverId);
    if (item) return item.href;
  }
  return null;
}

function parseNavList(root: Element, opfDir: string): EpubNavItem[] {
  const items: EpubNavItem[] = [];
  for (const li of root.children) {
    if (li.tagName.toLowerCase() !== 'li') continue;
    const anchor = li.querySelector(':scope > a, :scope > span > a');
    const nested = li.querySelector(':scope > ol, :scope > ul');
    const href = anchor?.getAttribute('href') ?? '';
    items.push({
      title: anchor?.textContent?.trim() ?? 'Untitled',
      href: href ? resolvePath(opfDir, href) : '',
      children: nested ? parseNavList(nested, opfDir) : [],
    });
  }
  return items;
}

function parseNavDocument(html: string, opfDir: string): EpubNavItem[] {
  const doc = new DOMParser().parseFromString(html, 'application/xhtml+xml');
  const nav = doc.querySelector('nav[epub\\:type="toc"], nav#toc, nav');
  if (!nav) return [];
  const list = nav.querySelector(':scope > ol, :scope > ul');
  if (!list) return [];
  return parseNavList(list, opfDir);
}

function parseNcx(ncx: string, opfDir: string): EpubNavItem[] {
  const doc = new DOMParser().parseFromString(ncx, 'application/xml');
  const mapNavPoint = (node: Element): EpubNavItem => {
    const label = textContent(node.querySelector(':scope > navLabel > text'));
    const content = node.querySelector(':scope > content');
    const src = content?.getAttribute('src') ?? '';
    const children: EpubNavItem[] = [];
    for (const child of node.querySelectorAll(':scope > navPoint')) {
      children.push(mapNavPoint(child));
    }
    return {
      title: label || 'Untitled',
      href: src ? resolvePath(opfDir, src) : '',
      children,
    };
  };

  const items: EpubNavItem[] = [];
  const root = doc.querySelector('navMap');
  if (!root) return items;
  for (const point of root.querySelectorAll(':scope > navPoint')) {
    items.push(mapNavPoint(point));
  }
  return items;
}

function hrefToPageNumber(spine: EpubSpineItem[], opfDir: string, href: string): number | null {
  const target = resolvePath(opfDir, href.split('#')[0] ?? href);
  const index = spine.findIndex((item) => resolvePath(opfDir, item.href) === target);
  return index >= 0 ? index + 1 : null;
}

export function navToOutline(
  nav: EpubNavItem[],
  spine: EpubSpineItem[],
  opfDir: string,
): import('@/domain/document/types').DocumentOutlineItem[] {
  return nav.map((item) => ({
    title: item.title,
    pageNumber: item.href ? hrefToPageNumber(spine, opfDir, item.href) : null,
    children: navToOutline(item.children, spine, opfDir),
  }));
}

export async function parseEpub(bytes: ArrayBuffer): Promise<ParsedEpub> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(bytes);

  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) throw new Error('Invalid EPUB: missing container.xml');

  const container = new DOMParser().parseFromString(containerXml, 'application/xml');
  const rootfile = container.querySelector('rootfile');
  const opfPath = rootfile?.getAttribute('full-path');
  if (!opfPath) throw new Error('Invalid EPUB: missing package document');

  const opfXml = await zip.file(opfPath)?.async('string');
  if (!opfXml) throw new Error('Invalid EPUB: missing package document');

  const opf = new DOMParser().parseFromString(opfXml, 'application/xml');
  const { title, author } = parseOpfMetadata(opf);
  const manifest = parseManifest(opf);
  const spine = parseSpine(opf, manifest);
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const coverHref = findCoverHref(opf, manifest);

  let nav: EpubNavItem[] = [];
  for (const item of manifest.values()) {
    const props = item.properties.split(/\s+/);
    if (props.includes('nav') || item.mediaType === 'application/x-dtbncx+xml') {
      const content = await zip.file(resolvePath(opfDir, item.href))?.async('string');
      if (!content) continue;
      if (item.mediaType === 'application/x-dtbncx+xml') {
        nav = parseNcx(content, opfDir);
      } else {
        nav = parseNavDocument(content, opfDir);
      }
      if (nav.length > 0) break;
    }
  }

  async function readFile(path: string): Promise<string | null> {
    const resolved = resolvePath(opfDir, path);
    return (await zip.file(resolved)?.async('string')) ?? null;
  }

  async function readBlob(path: string): Promise<Blob | null> {
    const resolved = resolvePath(opfDir, path);
    const data = await zip.file(resolved)?.async('uint8array');
    if (!data) return null;
    const item = [...manifest.values()].find(
      (entry) => resolvePath(opfDir, entry.href) === resolved,
    );
    return new Blob([data], { type: item?.mediaType ?? 'application/octet-stream' });
  }

  return {
    title,
    author,
    opfDir,
    spine,
    manifest,
    nav,
    coverHref,
    readFile,
    readBlob,
  };
}

export function extractChapterBody(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'application/xhtml+xml');
  const body = doc.querySelector('body');
  if (!body) return '';
  return body.innerHTML;
}

export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export const EPUB_PAGE_WIDTH = 600;
export const EPUB_PAGE_HEIGHT = 800;
