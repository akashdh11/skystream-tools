/**
 * SkyStream Plugin v2 Type Definitions
 */

export interface Manifest {
  id: string;
  name: string;
  version: number;
  author: string;
  description?: string;
  iconUrl?: string;
  languages: string[];
  categories: string[];
}

export type Result<T> = 
  | { success: true; data: T }
  | { success: false; errorCode: string; message: string };

/**
 * Valid content types for MultimediaItem
 */
export type MultimediaType = 'movie' | 'series' | 'anime' | 'livestream';

/**
 * Standard Multimedia Item
 */
export interface IMultimediaItem {
  title: string;
  url: string;
  posterUrl: string;
  type: MultimediaType;
  bannerUrl?: string;
  description?: string;
  episodes?: IEpisode[];
  headers?: Record<string, string>;
  provider?: string;
}

/**
 * Standard Episode for multi-part content
 */
export interface IEpisode {
  name: string;
  url: string;
  season?: number;
  episode?: number;
  description?: string;
  posterUrl?: string;
  headers?: Record<string, string>;
}

/**
 * Standard Stream Result
 */
export interface IStreamResult {
  url: string;
  quality?: string;
  headers?: Record<string, string>;
  subtitles?: { url: string; label: string; lang: string }[];
  drmKid?: string;
  drmKey?: string;
  licenseUrl?: string;
}

// Global Bridge Environment
declare global {
  /** The pre-injected manifest for the current plugin */
  const manifest: Manifest;

  /** Helper Class: MultimediaItem */
  class MultimediaItem implements IMultimediaItem {
    constructor(data: IMultimediaItem);
    title: string;
    url: string;
    posterUrl: string;
    type: MultimediaType;
    bannerUrl?: string;
    description?: string;
    episodes?: IEpisode[];
    headers?: Record<string, string>;
    provider?: string;
  }

  /** Helper Class: Episode */
  class Episode implements IEpisode {
    constructor(data: IEpisode);
    name: string;
    url: string;
    season?: number;
    episode?: number;
    description?: string;
    posterUrl?: string;
    headers?: Record<string, string>;
  }

  /** Helper Class: StreamResult */
  class StreamResult implements IStreamResult {
    constructor(data: IStreamResult);
    url: string;
    quality?: string;
    headers?: Record<string, string>;
    subtitles?: { url: string; label: string; lang: string }[];
    drmKid?: string;
    drmKey?: string;
    licenseUrl?: string;
  }

  /** Native Bridge: HTTP GET */
  function http_get(
    url: string,
    headers?: Record<string, string>,
    callback?: (res: HttpResponse) => void
  ): Promise<HttpResponse>;

  /** Native Bridge: HTTP POST */
  function http_post(
    url: string,
    headers?: Record<string, string>,
    body?: string,
    callback?: (res: HttpResponse) => void
  ): Promise<HttpResponse>;

  interface HttpResponse {
    status: number;
    body: string;
    headers: Record<string, string>;
  }

  /* Polyfills */
  function btoa(data: string): string;
  function atob(data: string): string;
}
