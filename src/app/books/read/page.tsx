'use client';

import { BookOpen, List, Moon, Settings2, Sun } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  buildBookCacheKey,
  enforceBookCacheLimit,
  getCachedBookFile,
  putCachedBookFile,
  touchCachedBookFile,
} from '@/lib/book-cache.client';
import { cacheBookDetail, getBookRouteCache } from '@/lib/book-route-cache.client';
import { saveBookReadRecord } from '@/lib/book.db.client';
import { BookReadManifest, BookReadRecord } from '@/lib/book.types';

declare global {
  interface Window {
    ePub?: (input: string | ArrayBuffer) => EpubBookInstance;
    JSZip?: unknown;
  }
}

interface EpubLocation {
  start?: { cfi?: string; href?: string; displayed?: { chapter?: string } };
  end?: { cfi?: string };
}

interface TocItem {
  id?: string;
  label: string;
  href: string;
  subitems?: TocItem[];
}

interface EpubNavigation {
  toc?: TocItem[];
}

interface EpubThemes {
  fontSize?: (value: string) => void;
  default?: (styles: Record<string, Record<string, string>>) => void;
  override?: (name: string, value: string) => void;
}

interface EpubBookInstance {
  renderTo: (element: HTMLElement, options: Record<string, string | boolean>) => EpubRendition;
  locations?: {
    percentageFromCfi?: (cfi: string) => number;
    generate?: (chars?: number) => Promise<void>;
  };
  loaded?: {
    navigation?: Promise<EpubNavigation>;
  };
  navigation?: EpubNavigation;
  ready?: Promise<unknown>;
  destroy?: () => void;
}

interface EpubRendition {
  display: (target?: string) => Promise<void>;
  on: (event: 'relocated', callback: (location: EpubLocation) => void) => void;
  prev?: () => void;
  next?: () => void;
  destroy?: () => void;
  themes?: EpubThemes;
}

type ReaderTheme = 'light' | 'sepia' | 'dark';
type FileLoadState = 'preparing' | 'checking-cache' | 'downloading' | 'opening' | 'ready';

interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: ReaderTheme;
}

const SETTINGS_STORAGE_KEY = 'books_epub_reader_settings';
const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 100,
  lineHeight: 1.7,
  theme: 'light',
};
const SAVE_INTERVAL_MS = 10000;

const THEME_STYLES: Record<ReaderTheme, { bodyBg: string; bodyColor: string; panelBg: string }> = {
  light: { bodyBg: '#ffffff', bodyColor: '#111827', panelBg: '#ffffff' },
  sepia: { bodyBg: '#f6efe3', bodyColor: '#5b4636', panelBg: '#f7f1e7' },
  dark: { bodyBg: '#111827', bodyColor: '#e5e7eb', panelBg: '#030712' },
};

function loadScriptOnce(selector: string, src: string, errorMessage: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(selector) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(errorMessage)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    if (selector.includes('jszip')) script.dataset.jszip = 'true';
    if (selector.includes('epubjs')) script.dataset.epubjs = 'true';
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(errorMessage));
    document.body.appendChild(script);
  });
}

async function loadEpubScript() {
  if (window.ePub && window.JSZip) return;
  if (!window.JSZip) {
    await loadScriptOnce('script[data-jszip]', 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', 'JSZip 加载失败');
  }
  if (!window.ePub) {
    await loadScriptOnce('script[data-epubjs]', 'https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js', 'epub.js 加载失败');
  }
}

function loadReaderSettings(): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ReaderSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function flattenToc(items: TocItem[]): TocItem[] {
  return items.flatMap((item) => [item, ...flattenToc(item.subitems || [])]);
}

function tocItemIsActive(item: TocItem, currentHref: string): boolean {
  return isSameTocTarget(currentHref, item.href) || (item.subitems || []).some((subitem) => tocItemIsActive(subitem, currentHref));
}

function findTocLabelByHref(items: TocItem[], currentHref: string): string {
  for (const item of items) {
    if (isSameTocTarget(currentHref, item.href)) return item.label;
    const nested = findTocLabelByHref(item.subitems || [], currentHref);
    if (nested) return nested;
  }
  return '';
}

async function downloadBookWithProgress(
  manifest: Pick<BookReadManifest, 'book' | 'format' | 'acquisitionHref'>,
  onProgress: (received: number, total: number | null) => void
): Promise<Blob> {
  const response = await fetch('/api/books/file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceId: manifest.book.sourceId,
      bookId: manifest.book.id,
      format: manifest.format,
      href: manifest.acquisitionHref || undefined,
    }),
    cache: 'force-cache',
  });
  if (!response.ok) throw new Error(`下载电子书失败: ${response.status}`);
  const total = Number(response.headers.get('content-length') || '') || null;
  if (!response.body) {
    const blob = await response.blob();
    onProgress(blob.size, total);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  let done = false;
  while (!done) {
    const result = await reader.read();
    done = result.done;
    const value = result.value;
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      onProgress(received, total);
    }
  }

  return new Blob(chunks, { type: response.headers.get('content-type') || 'application/epub+zip' });
}


function normalizeHrefForMatch(href?: string) {
  if (!href) return '';
  try {
    const normalized = decodeURIComponent(href).replace(/\\/g, '/').trim();
    return normalized.split('#')[0].split('?')[0].replace(/^\.\//, '').replace(/^\//, '');
  } catch {
    return href.split('#')[0].split('?')[0].replace(/^\.\//, '').replace(/^\//, '').trim();
  }
}

function isSameTocTarget(currentHref?: string, tocHref?: string) {
  const current = normalizeHrefForMatch(currentHref);
  const target = normalizeHrefForMatch(tocHref);
  if (!current || !target) return false;
  return current === target || current.endsWith(target) || target.endsWith(current);
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function BookReadPage() {
  const searchParams = useSearchParams();
  const sourceId = searchParams.get('sourceId') || '';
  const bookId = searchParams.get('bookId') || '';
  const cached = useMemo(() => (sourceId && bookId ? getBookRouteCache(sourceId, bookId) : null), [sourceId, bookId]);
  const [manifest, setManifest] = useState<BookReadManifest | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [fileLoadState, setFileLoadState] = useState<FileLoadState>('preparing');
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState<number | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [currentHref, setCurrentHref] = useState('');
  const [currentChapter, setCurrentChapter] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [restoredMessage, setRestoredMessage] = useState('');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const tocScrollRef = useRef<HTMLDivElement | null>(null);
  const tocItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const bookRef = useRef<EpubBookInstance | null>(null);
  const renditionRef = useRef<EpubRendition | null>(null);
  const pendingRecordRef = useRef<BookReadRecord | null>(null);
  const pendingRecordDirtyRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const lastLocationRef = useRef<EpubLocation | null>(null);
  const lastProgressRef = useRef(0);
  const lastChapterRef = useRef('');
  const locationsReadyRef = useRef(false);
  const tocItemsRef = useRef<TocItem[]>([]);

  useEffect(() => {
    setSettings(loadReaderSettings());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);


  useEffect(() => {
    const handleToggleSettings = () => {
      setSettingsOpen((prev) => !prev);
      setTocOpen(false);
    };

    window.addEventListener('books-read-toggle-settings', handleToggleSettings);
    return () => {
      window.removeEventListener('books-read-toggle-settings', handleToggleSettings);
    };
  }, []);

  useEffect(() => {
    const handleToggleChapters = () => {
      setTocOpen((prev) => !prev);
      setSettingsOpen(false);
    };

    window.addEventListener('books-read-toggle-chapters', handleToggleChapters);
    return () => {
      window.removeEventListener('books-read-toggle-chapters', handleToggleChapters);
    };
  }, []);


  useEffect(() => {
    if (!sourceId || !bookId) return;
    fetch('/api/books/read/manifest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId,
        bookId,
        href: cached?.detailHref,
        acquisitionHref: cached?.acquisitionHref,
        format: cached?.format || null,
        title: cached?.title,
        author: cached?.author,
        cover: cached?.cover,
        summary: cached?.summary,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '获取阅读信息失败');
        setManifest(json);
        cacheBookDetail(json.book);
      })
      .catch((err) => setError(err.message || '获取阅读信息失败'));
  }, [sourceId, bookId, cached]);

  const buildReadRecord = useCallback((location: EpubLocation, nextProgress = 0, chapterTitle?: string): BookReadRecord | null => {
    if (!manifest) return null;
    const locatorValue = location?.start?.cfi || location?.end?.cfi || '';
    if (!locatorValue) return null;
    return {
      sourceId: manifest.book.sourceId,
      sourceName: manifest.book.sourceName,
      bookId: manifest.book.id,
      title: manifest.book.title,
      author: manifest.book.author,
      cover: manifest.book.cover,
      detailHref: manifest.book.detailHref,
      acquisitionHref: manifest.acquisitionHref,
      format: manifest.format,
      locator: {
        type: 'epub-cfi',
        value: locatorValue,
        href: location?.start?.href,
        chapterTitle,
      },
      chapterTitle,
      chapterHref: location?.start?.href,
      progressPercent: nextProgress,
      saveTime: Date.now(),
    };
  }, [manifest]);

  const queueReadRecord = useCallback((location: EpubLocation, nextProgress = 0, chapterTitle?: string) => {
    const record = buildReadRecord(location, nextProgress, chapterTitle);
    if (!record) return;
    pendingRecordRef.current = record;
    pendingRecordDirtyRef.current = true;
  }, [buildReadRecord]);

  const flushPendingReadRecord = useCallback(async () => {
    const record = pendingRecordRef.current;
    if (!record || !pendingRecordDirtyRef.current || saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    try {
      await saveBookReadRecord(record.sourceId, record.bookId, {
        ...record,
        saveTime: Date.now(),
      });
      pendingRecordRef.current = { ...record, saveTime: Date.now() };
      pendingRecordDirtyRef.current = false;
    } catch {
      // ignore
    } finally {
      saveInFlightRef.current = false;
    }
  }, []);

  const persistCurrentProgress = useCallback(() => {
    if (lastLocationRef.current) {
      queueReadRecord(lastLocationRef.current, lastProgressRef.current, lastChapterRef.current);
    }
    void flushPendingReadRecord();
  }, [queueReadRecord, flushPendingReadRecord]);

  const applyReaderTheme = useCallback((nextSettings: ReaderSettings) => {
    const rendition = renditionRef.current;
    if (!rendition?.themes) return;
    const palette = THEME_STYLES[nextSettings.theme];
    rendition.themes.default?.({
      body: {
        'background-color': palette.bodyBg,
        color: palette.bodyColor,
        'font-size': `${nextSettings.fontSize}%`,
        'line-height': String(nextSettings.lineHeight),
        'padding-left': '6px',
        'padding-right': '6px',
      },
      p: { color: palette.bodyColor },
      a: { color: nextSettings.theme === 'dark' ? '#93c5fd' : '#2563eb' },
    });
    rendition.themes.fontSize?.(`${nextSettings.fontSize}%`);
    rendition.themes.override?.('line-height', String(nextSettings.lineHeight));
  }, []);

  useEffect(() => {
    applyReaderTheme(settings);
  }, [settings, applyReaderTheme]);

  const navigateToTarget = useCallback(async (target?: string) => {
    if (!renditionRef.current) return;
    await renditionRef.current.display(target);
  }, []);

  const handleReaderTap = useCallback((zone: 'left' | 'center' | 'right') => {
    if (!ready) return;
    if (zone === 'left') {
      renditionRef.current?.prev?.();
      return;
    }
    if (zone === 'right') {
      renditionRef.current?.next?.();
      return;
    }
    setTocOpen(false);
    setSettingsOpen(false);
  }, [ready]);






  useEffect(() => {
    if (!manifest || manifest.format !== 'epub' || !viewerRef.current) return;
    let destroyed = false;
    setReady(false);
    setRestoredMessage('');
    locationsReadyRef.current = false;
    setProgressPercent(manifest.lastRecord?.progressPercent || 0);
    setCurrentChapter(manifest.lastRecord?.chapterTitle || manifest.lastRecord?.locator?.chapterTitle || '');
    setFileLoadState('checking-cache');
    setDownloadedBytes(0);
    setTotalBytes(null);
    setCacheHit(false);

    loadEpubScript()
      .then(async () => {
        if (!window.ePub || destroyed || !viewerRef.current) return;

        const cacheKey = manifest.cacheKey || buildBookCacheKey(
          manifest.book.sourceId,
          manifest.book.id,
          manifest.acquisitionHref || `${manifest.book.sourceId}:${manifest.book.id}:${manifest.format}`
        );

        let fileBuffer: ArrayBuffer;
        const cached = await getCachedBookFile(cacheKey).catch(() => null);
        if (cached) {
          setCacheHit(true);
          setFileLoadState('opening');
          setDownloadedBytes(cached.size);
          setTotalBytes(cached.size);
          await touchCachedBookFile(cacheKey).catch(() => undefined);
          fileBuffer = await cached.blob.arrayBuffer();
        } else {
          setFileLoadState('downloading');
          const blob = await downloadBookWithProgress(manifest, (received, total) => {
            if (!destroyed) {
              setDownloadedBytes(received);
              setTotalBytes(total);
            }
          });
          fileBuffer = await blob.arrayBuffer();
          await putCachedBookFile({
            key: cacheKey,
            sourceId: manifest.book.sourceId,
            bookId: manifest.book.id,
            title: manifest.book.title,
            format: manifest.format,
            acquisitionHref: manifest.acquisitionHref || `${manifest.book.sourceId}:${manifest.book.id}:${manifest.format}`,
            blob,
            size: blob.size,
            mimeType: blob.type || 'application/epub+zip',
            updatedAt: Date.now(),
            lastOpenTime: Date.now(),
          }).catch(() => undefined);
          await enforceBookCacheLimit().catch(() => undefined);
          if (destroyed) return;
          setFileLoadState('opening');
        }

        if (destroyed) return;
        const book = window.ePub(fileBuffer);
        const readyFallbackTimer = window.setTimeout(() => {
          if (!destroyed) {
            setReady(true);
            setFileLoadState('ready');
          }
        }, 4000);

        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'none',
          manager: 'default',
          flow: 'paginated',
        });
        bookRef.current = book;
        renditionRef.current = rendition;
        applyReaderTheme(settings);

        const restoreTarget = manifest.lastRecord?.locator?.value || undefined;
        let restoreMessageShown = false;

        rendition.on('relocated', (location: EpubLocation) => {
          if (!destroyed) {
            window.clearTimeout(readyFallbackTimer);
            setReady(true);
            setFileLoadState('ready');
          }
          if (restoreTarget && !restoreMessageShown) {
            restoreMessageShown = true;
            setRestoredMessage(`已恢复到上次阅读位置（约 ${Math.round(manifest.lastRecord?.progressPercent || 0)}%）`);
            window.setTimeout(() => setRestoredMessage(''), 3000);
          }
          lastLocationRef.current = location;
          const hrefLabel = location?.start?.href ? findTocLabelByHref(tocItemsRef.current, location.start.href) : '';
          const chapterTitle = hrefLabel || location?.start?.displayed?.chapter || location?.start?.href || manifest.book.title;
          const cfi = location?.start?.cfi || '';
          const computedProgress = locationsReadyRef.current && cfi
            ? Math.max(0, Math.min(100, (book.locations?.percentageFromCfi?.(cfi) || 0) * 100))
            : null;
          const normalizedProgress = computedProgress ?? lastProgressRef.current ?? manifest.lastRecord?.progressPercent ?? 0;
          setProgressPercent(normalizedProgress);
          setCurrentChapter(chapterTitle);
          setCurrentHref(location?.start?.href || '');
          lastProgressRef.current = normalizedProgress;
          lastChapterRef.current = chapterTitle;
          queueReadRecord(location, normalizedProgress, chapterTitle);
        });

        void navigateToTarget(restoreTarget).catch(() => {
          if (!destroyed) {
            setReady(true);
            setFileLoadState('ready');
          }
        });

        void (async () => {
          try {
            const navigation = (await book.loaded?.navigation) || book.navigation;
            if (!destroyed) setTocItems(navigation?.toc || []);
          } catch {
            if (!destroyed) setTocItems(book.navigation?.toc || []);
          }
        })();

        void (async () => {
          try {
            await book.ready;
            await book.locations?.generate?.(480);
            locationsReadyRef.current = true;
            if (lastLocationRef.current?.start?.cfi) {
              const recomputed = book.locations?.percentageFromCfi?.(lastLocationRef.current.start.cfi) || 0;
              const nextProgress = Math.max(0, Math.min(100, recomputed * 100));
              setProgressPercent(nextProgress);
              lastProgressRef.current = nextProgress;
            }
          } catch {
            // ignore
          }
        })();
      })
      .catch((err) => {
        setReady(false);
        setError(err.message || '初始化 EPUB 阅读器失败');
      });

    return () => {
      destroyed = true;
      persistCurrentProgress();
      renditionRef.current?.destroy?.();
      bookRef.current?.destroy?.();
    };
  }, [manifest, settings, applyReaderTheme, persistCurrentProgress, queueReadRecord, navigateToTarget]);

  useEffect(() => {
    const flushPendingReadRecordOnLeave = () => {
      if (!pendingRecordDirtyRef.current || saveInFlightRef.current) return;
      persistCurrentProgress();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingReadRecordOnLeave();
      }
    };

    const intervalId = window.setInterval(() => {
      void flushPendingReadRecord();
    }, SAVE_INTERVAL_MS);
    window.addEventListener('pagehide', flushPendingReadRecordOnLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('pagehide', flushPendingReadRecordOnLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushPendingReadRecord, persistCurrentProgress]);



  useEffect(() => {
    if (!manifest || manifest.format !== 'pdf') return;
    let revokedUrl = '';
    let cancelled = false;
    setFileLoadState('downloading');
    setDownloadedBytes(0);
    setTotalBytes(null);
    setPdfBlobUrl('');

    downloadBookWithProgress(manifest, (received, total) => {
      if (!cancelled) {
        setDownloadedBytes(received);
        setTotalBytes(total);
      }
    })
      .then(async (blob) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        revokedUrl = objectUrl;
        setPdfBlobUrl(objectUrl);
        setFileLoadState('ready');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'PDF 加载失败');
      });

    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [manifest]);


  useEffect(() => {
    tocItemsRef.current = tocItems;
  }, [tocItems]);

  const flatToc = useMemo(() => flattenToc(tocItems), [tocItems]);
  const activeTocHref = useMemo(
    () => flatToc.find((item) => isSameTocTarget(currentHref, item.href))?.href || '',
    [flatToc, currentHref]
  );

  const currentTocLabel = useMemo(() => findTocLabelByHref(tocItems, currentHref), [tocItems, currentHref]);

  useEffect(() => {
    if (!manifest) return;
    window.dispatchEvent(new CustomEvent('books-read-update-header', {
      detail: {
        title: manifest.book.title,
        subtitle: currentTocLabel || currentChapter || manifest.book.author || '分页阅读',
        backHref: `/books/detail?sourceId=${encodeURIComponent(manifest.book.sourceId)}&bookId=${encodeURIComponent(manifest.book.id)}`,
      },
    }));
  }, [manifest, currentChapter, currentTocLabel]);

  useEffect(() => {
    if (!tocOpen || !activeTocHref) return;
    const activeNode = tocItemRefs.current[activeTocHref];
    if (!activeNode) return;
    activeNode.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [tocOpen, activeTocHref]);

  const renderTocItems = useCallback((items: TocItem[], depth = 0) => items.map((item) => {
    const active = tocItemIsActive(item, currentHref);
    const clickable = !!item.href;
    return (
      <div key={`${item.href || item.label}-${depth}`} className='space-y-2'>
        <button
          ref={(node) => {
            if (item.href) tocItemRefs.current[item.href] = node;
          }}
          onClick={() => {
            if (!clickable) return;
            void navigateToTarget(item.href);
            setTocOpen(false);
          }}
          disabled={!clickable}
          className={`group relative block w-full rounded-2xl px-4 py-3 text-left text-sm transition ${active ? 'bg-sky-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900'} ${!clickable ? 'cursor-default opacity-80' : ''}`}
          style={{ paddingLeft: `${16 + depth * 14}px` }}
        >
          <span className='block truncate'>{item.label}</span>
          <div className='pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 rounded-lg bg-gray-800 px-3 py-2 text-sm text-white opacity-0 invisible shadow-xl transition-all duration-200 ease-out group-hover:visible group-hover:opacity-100 dark:bg-gray-900 whitespace-nowrap'>
            <div className='text-sm'>{item.label}</div>
          </div>
        </button>
        {item.subitems?.length ? renderTocItems(item.subitems, depth + 1) : null}
      </div>
    );
  }), [currentHref, navigateToTarget]);

  const progressLabel = totalBytes ? `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}` : formatBytes(downloadedBytes);

  if (error) return <div className='p-4 text-sm text-red-500'>{error}</div>;
  if (!manifest) return <div className='p-4 text-sm text-gray-500'>准备阅读器中...</div>;

  if (manifest.format === 'pdf') {
    if (!pdfBlobUrl) return <div className='p-4 text-sm text-gray-500'>PDF 加载中... {progressLabel}</div>;
    return <iframe src={pdfBlobUrl} className='h-[calc(100vh-4rem)] w-full bg-white' title={manifest.book.title} />;
  }

  return (
    <div className='relative h-[calc(100vh-3.5rem)] overflow-hidden bg-white dark:bg-gray-950'>
      {restoredMessage ? (
        <div className='absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-sky-600 px-4 py-2 text-xs text-white shadow-lg'>
          {restoredMessage}
        </div>
      ) : null}

      {!ready ? (
        <div className='absolute inset-x-0 top-0 z-10 p-4'>
          <div className='mx-auto max-w-3xl space-y-4'>
            <div className='space-y-2 rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/90'>
              <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                {fileLoadState === 'checking-cache'
                  ? '检查本地缓存'
                  : fileLoadState === 'downloading'
                    ? '下载电子书'
                    : fileLoadState === 'opening'
                      ? '正在打开电子书'
                      : '准备阅读器'}
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800'>
                <div
                  className='h-full rounded-full bg-sky-600 transition-all'
                  style={{ width: totalBytes ? `${Math.min(100, (downloadedBytes / totalBytes) * 100)}%` : fileLoadState === 'opening' ? '92%' : fileLoadState === 'checking-cache' ? '20%' : '45%' }}
                />
              </div>
              <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
                <span>{cacheHit ? '已命中本地缓存' : '首次打开将缓存到当前浏览器'}</span>
                <span>{progressLabel}</span>
              </div>
            </div>
            <div className='space-y-3 rounded-3xl bg-gray-50 p-6 dark:bg-gray-900 animate-pulse'>
              <div className='h-4 w-full rounded bg-gray-200 dark:bg-gray-800' />
              <div className='h-4 w-11/12 rounded bg-gray-200 dark:bg-gray-800' />
              <div className='h-4 w-10/12 rounded bg-gray-200 dark:bg-gray-800' />
              <div className='h-4 w-full rounded bg-gray-200 dark:bg-gray-800' />
              <div className='h-4 w-9/12 rounded bg-gray-200 dark:bg-gray-800' />
            </div>
          </div>
        </div>
      ) : null}

      {tocOpen && typeof document !== 'undefined' ? createPortal(
        <div className='fixed inset-0 z-40 bg-black/30' onClick={() => setTocOpen(false)}>
          <div
            className='absolute right-0 top-0 h-screen w-[22rem] max-w-[88vw] overflow-y-auto border-l border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-950'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='p-4'>
              <div className='space-y-2' ref={tocScrollRef}>
                {tocItems.length === 0 ? (
                  <div className='p-3 text-sm text-gray-500'>当前 EPUB 未提供目录</div>
                ) : (
                  renderTocItems(tocItems)
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {settingsOpen && typeof document !== 'undefined' ? createPortal(
        <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4' onClick={() => setSettingsOpen(false)}>
          <div
            className='w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-950'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='mb-4'>
              <div className='text-base font-semibold text-gray-900 dark:text-gray-100'>阅读设置</div>
              <div className='mt-1 text-xs text-gray-500'>分页式 EPUB 阅读设置</div>
            </div>
            <div className='space-y-6 p-1 text-sm'>
              <div>
                <div className='mb-2 font-medium'>主题</div>
                <div className='grid grid-cols-3 gap-2'>
                  {(['light', 'sepia', 'dark'] as ReaderTheme[]).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setSettings((prev) => ({ ...prev, theme }))}
                      className={`rounded-2xl border px-3 py-2 ${settings.theme === theme ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <div className='mb-1 flex justify-center'>{theme === 'dark' ? <Moon className='h-4 w-4' /> : <Sun className='h-4 w-4' />}</div>
                      {theme === 'light' ? '浅色' : theme === 'sepia' ? '护眼' : '深色'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className='mb-2 flex items-center justify-between font-medium'>字号 <span>{settings.fontSize}%</span></div>
                <input type='range' min='85' max='140' step='5' value={settings.fontSize} onChange={(e) => setSettings((prev) => ({ ...prev, fontSize: Number(e.target.value) }))} className='w-full' />
              </div>

              <div>
                <div className='mb-2 flex items-center justify-between font-medium'>行距 <span>{settings.lineHeight.toFixed(1)}</span></div>
                <input type='range' min='1.4' max='2.2' step='0.1' value={settings.lineHeight} onChange={(e) => setSettings((prev) => ({ ...prev, lineHeight: Number(e.target.value) }))} className='w-full' />
              </div>

              <div className='rounded-2xl bg-gray-50 p-4 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400'>
                首次会缓存到当前浏览器，之后再次打开同一本书通常不需要重新整包下载。
当前缓存状态：{cacheHit ? '已命中本地缓存' : '本次为网络加载'}。
              </div>

              <div className='flex justify-end'>
                <button
                  type='button'
                  className='rounded-2xl bg-sky-600 px-4 py-2 text-sm font-medium text-white'
                  onClick={() => setSettingsOpen(false)}
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}


      {ready && !tocOpen && !settingsOpen ? (
        <>
          <button
            aria-label='上一页'
            className='absolute inset-y-0 left-0 z-10 w-[28%] cursor-pointer bg-transparent'
            onClick={() => handleReaderTap('left')}
          />
          <button
            aria-label='下一页'
            className='absolute inset-y-0 right-0 z-10 w-[28%] cursor-pointer bg-transparent'
            onClick={() => handleReaderTap('right')}
          />
        </>
      ) : null}

      <div ref={viewerRef} className='h-full w-full' style={{ backgroundColor: THEME_STYLES[settings.theme].panelBg }} />
    </div>
  );
}
