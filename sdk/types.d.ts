/**
 * SkyStream Plugin v2 Type Definitions
 */

export interface Manifest {
  packageName: string;
  name: string;
  version: number;
  authors: string[];
  baseUrl: string;
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
export type MultimediaType = 'movie' | 'series' | 'anime' | 'livestream' | 'other';

/**
 * Valid statuses for MultimediaItem
 */
export type ShowStatus = 'completed' | 'ongoing' | 'upcoming';


/**
 * Valid Dub statuses
 */
export type DubStatus = 'none' | 'dubbed' | 'subbed';

/**
 * Actor/Cast member
 */
export interface IActor {
  name: string;
  image?: string;
  role?: string;
  voiceActor?: IActor;
}

/**
 * Trailer info
 */
export interface ITrailer {
  url: string;
  headers?: Record<string, string>;
}

/**
 * Next Airing info
 */
export interface INextAiring {
  episode: number;
  unixTime: number;
  season?: number;
}

/**
 * Standard Multimedia Item
 */
export interface IMultimediaItem {
  title: string;
  url: string;
  posterUrl: string;
  type?: MultimediaType;
  bannerUrl?: string;
  logoUrl?: string;
  description?: string;
  episodes?: IEpisode[];
  headers?: Record<string, string>;
  provider?: string;
  year?: number;
  score?: number;
  duration?: number;
  status?: ShowStatus;
  tags?: string[];
  contentRating?: string;
  cast?: IActor[];
  trailers?: ITrailer[];
  recommendations?: IMultimediaItem[];
  playbackPolicy?: string;
  isAdult?: boolean;
  nextAiring?: INextAiring;
  syncData?: Record<string, string>;
  streams?: IStreamResult[];
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
  rating?: number;
  runtime?: number;
  airDate?: string;
  dubStatus?: DubStatus;
  playbackPolicy?: string;
  streams?: IStreamResult[];
}

/**
 * Standard Stream Result
 */
export interface IStreamResult {
  url: string;
  source?: string;
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

  /** Helper Class: Actor */
  class Actor implements IActor {
    constructor(data: IActor);
    name: string;
    image?: string;
    role?: string;
    voiceActor?: Actor;
  }

  /** Helper Class: Trailer */
  class Trailer implements ITrailer {
    constructor(data: ITrailer);
    url: string;
    headers?: Record<string, string>;
  }

  /** Helper Class: NextAiring */
  class NextAiring implements INextAiring {
    constructor(data: INextAiring);
    episode: number;
    unixTime: number;
    season?: number;
  }

  /** Helper Class: MultimediaItem */
  class MultimediaItem implements IMultimediaItem {
    constructor(data: IMultimediaItem);
    title: string;
    url: string;
    posterUrl: string;
    type?: MultimediaType;
    bannerUrl?: string;
    logoUrl?: string;
    description?: string;
    episodes?: IEpisode[];
    headers?: Record<string, string>;
    provider?: string;
    year?: number;
    score?: number;
    duration?: number;
    status?: ShowStatus;
    tags?: string[];
    contentRating?: string;
    cast?: Actor[];
    trailers?: Trailer[];
    recommendations?: MultimediaItem[];
    playbackPolicy?: string;
    isAdult?: boolean;
    nextAiring?: NextAiring;
    syncData?: Record<string, string>;
    streams?: StreamResult[];
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
    rating?: number;
    runtime?: number;
    airDate?: string;
    dubStatus?: DubStatus;
    playbackPolicy?: string;
    streams?: StreamResult[];
  }

  /** Helper Class: StreamResult */
  class StreamResult implements IStreamResult {
    constructor(data: IStreamResult);
    url: string;
    source?: string;
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

  /** Register Custom Plugin Settings */
  function registerSettings(schema: any[]): void;

  /** Solve Captcha Challenge */
  function solveCaptcha(siteKey: string, url: string): Promise<string>;

  /** Cryptography Helpers */
  interface Crypto {
    /** Decrypt AES-CBC data with PKCS7 padding */
    decryptAES(data: string, key: string, iv: string): string;
  }

  interface HttpResponse {
    status: number;
    body: string;
    headers: Record<string, string>;
  }

  /* Polyfills */
  function btoa(data: string): string;
  function atob(data: string): string;
}
