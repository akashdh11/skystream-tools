import axios from 'axios';
import { JSDOM } from 'jsdom';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vm from 'vm';

export interface RuntimeOptions {
  manifest: any;
  pluginPath: string;
}

export class SkyStreamRuntime {
  private context: any;

  constructor(private options: RuntimeOptions) {
    this.context = this.createMockContext();
  }

  private createMockContext() {
    const sandbox = Object.create(null);
    Object.assign(sandbox, {
      manifest: this.options.manifest,
      console: {
        log: (...args: any[]) => console.log('[Plugin Log]:', ...args),
        error: (...args: any[]) => console.error('[Plugin Error]:', ...args),
        warn: (...args: any[]) => console.warn('[Plugin Warn]:', ...args),
      },
      http_get: async (url: string, headers: any, cb: any) => {
        try {
          const res = await axios.get(url, { headers: headers || {} });
          const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          const result = { status: res.status, statusCode: res.status, body, headers: res.headers };
          if (cb) cb(result);
          return result;
        } catch (e: any) {
          const res = { status: e.response?.status || 500, statusCode: e.response?.status || 500, body: e.response?.data || e.message, headers: e.response?.headers || {} };
          if (cb) cb(res);
          return res;
        }
      },
      http_post: async (url: string, headers: any, body: any, cb: any) => {
        try {
          const res = await axios.post(url, body, { headers: headers || {} });
          const respBody = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          const result = { status: res.status, statusCode: res.status, body: respBody, headers: res.headers };
          if (cb) cb(result);
          return result;
        } catch (e: any) {
          const res = { status: e.response?.status || 500, statusCode: e.response?.status || 500, body: e.response?.data || e.message, headers: e.response?.headers || {} };
          if (cb) cb(res);
          return res;
        }
      },
      btoa: (s: string) => Buffer.from(s).toString('base64'),
      atob: (s: string) => Buffer.from(s, 'base64').toString('utf8'),
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      registerSettings: (schema: any[]) => {
        console.log('[Mock SDK]: Plugin registered settings:', JSON.stringify(schema, null, 2));
      },
      solveCaptcha: async (siteKey: string, url: string) => {
        console.log('[Mock SDK]: solveCaptcha requested for ' + url);
        return "mock_token";
      },
      crypto: {
        decryptAES: (data: string, key: string, iv: string) => {
          return "decrypted(" + data + ")";
        }
      },
      Actor: class Actor {
        constructor(data: any) { Object.assign(this, data); }
      },
      Trailer: class Trailer {
        constructor(data: any) { Object.assign(this, data); }
      },
      NextAiring: class NextAiring {
        constructor(data: any) { Object.assign(this, data); }
      },
      MultimediaItem: class MultimediaItem {
        constructor(data: any) { 
          Object.assign(this, {
            type: 'movie',
            status: 'ongoing',
            playbackPolicy: 'none',
            isAdult: false,
            streams: [],
            syncData: {},
            ...data
          }); 
        }
      },
      Episode: class Episode {
        constructor(data: any) { 
          Object.assign(this, {
            season: 0,
            episode: 0,
            dubStatus: 'none',
            playbackPolicy: 'none',
            streams: [],
            ...data
          }); 
        }
      },
      StreamResult: class StreamResult {
        constructor(data: any) { Object.assign(this, data); }
      },
      JSDOM: JSDOM,
      URL: URL,
    });
    sandbox.globalThis = sandbox;
    return vm.createContext(sandbox);
  }

  public async run(jsContent: string) {
    try {
      vm.runInContext(jsContent, this.context, {
        timeout: 5000,
        breakOnSigint: true,
      });
    } catch (e: any) {
      console.error('[Runtime Error]:', e);
      throw e;
    }
    return this.context.globalThis;
  }
}
