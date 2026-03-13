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
          const res = await axios.get(url, { headers });
          const result = { status: res.status, body: res.data, headers: res.headers };
          if (cb) cb(result);
          return result;
        } catch (e: any) {
             const result = { status: e.response?.status || 500, body: e.message, headers: {} };
             if (cb) cb(result);
             return result;
        }
      },
      http_post: async (url: string, headers: any, body: any, cb: any) => {
        try {
          const res = await axios.post(url, body, { headers });
          const result = { status: res.status, body: res.data, headers: res.headers };
          if (cb) cb(result);
          return result;
        } catch (e: any) {
            const result = { status: e.response?.status || 500, body: e.message, headers: {} };
            if (cb) cb(result);
            return result;
        }
      },
      btoa: (s: string) => Buffer.from(s).toString('base64'),
      atob: (s: string) => Buffer.from(s, 'base64').toString('utf8'),
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      MultimediaItem: class MultimediaItem {
        constructor(data: any) { Object.assign(this, data); if (!(this as any).type) (this as any).type = 'movie'; }
      },
      Episode: class Episode {
        constructor(data: any) { Object.assign(this, data); }
      },
      StreamResult: class StreamResult {
        constructor(data: any) { Object.assign(this, data); }
      },
      globalThis: {} as any,
    });
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
