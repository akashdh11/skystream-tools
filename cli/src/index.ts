#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'path';
import * as vm from 'vm';
import * as crypto from 'crypto';
import fs from 'fs-extra';
import { z } from 'zod';
import archiver from 'archiver';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { JSDOM } from 'jsdom';

const program = new Command();

program
  .name('skystream')
  .description('SkyStream Plugin Development Kit CLI (Sky Gen 2)')
  .version('1.5.5');

// Schemas
const pluginSchema = z.object({
  packageName: z.string().min(5).regex(/^[a-z0-9._-]+$/),
  name: z.string().min(1),
  version: z.number().int().positive(),
  description: z.string().min(1),
  baseUrl: z.string().url(),
  authors: z.array(z.string()).min(1),
  languages: z.array(z.string()).min(1),
  categories: z.array(z.string()).min(1),
});

const repoSchema = z.object({
  name: z.string().min(1),
  packageName: z.string().min(3).regex(/^[a-z0-9._-]+$/),
  description: z.string().min(1),
  manifestVersion: z.number().int().positive(),
  pluginLists: z.array(z.string().url()),
});

const JS_TEMPLATE = `(function() {
    /**
     * @typedef {Object} Response
     * @property {boolean} success
     * @property {any} [data]
     * @property {string} [errorCode]
     * @property {string} [message]
     */

    /**
     * @type {import('@skystream/sdk').Manifest}
     */
    // var manifest is injected at runtime

    // 1. (Optional) Register your plugin settings
    //     registerSettings([
    //         { id: "quality", name: "Default Quality", type: "select", options: ["1080p", "720p"], default: "1080p" },
    //         { id: "prefer_dub", name: "Prefer Dubbed", type: "toggle", default: false }
    //     ]);

    /**
     * Loads the home screen categories.
     * @param {(res: Response) => void} cb 
     */
    async function getHome(cb) {
        // Example: Using solveCaptcha if needed (await solveCaptcha(siteKey, url))
        try {
            // Dashboard Layout:
            // - "Trending" is a reserved category promoted to the Hero Carousel.
            // - Other categories appear as horizontal thumbnail rows.
            // - If "Trending" is missing, the first category is used for the carousel.
            cb({ 
                success: true, 
                data: { 
                    "Trending": [
                        new MultimediaItem({ 
                            title: "Example Movie (Carousel)", 
                            url: \`\${manifest.baseUrl}/movie\`, 
                            posterUrl: \`https://placehold.co/400x600.png?text=Trending+Movie\`, 
                            type: "movie", // Valid types: movie, series, anime, livestream, other
                            bannerUrl: \`https://placehold.co/1280x720.png?text=Trending+Banner\`, // (optional)
                            description: "Plot summary here...", // (optional)
                            headers: { "Referer": \`\${manifest.baseUrl}\` } // (optional)
                        })
                    ],
                    "Latest Series": [
                        new MultimediaItem({ 
                            title: "Example Series (Thumb)", 
                            url: \`\${manifest.baseUrl}/series\`, 
                            posterUrl: \`https://placehold.co/400x600.png?text=Series+Poster\`, 
                            type: "series",
                            description: "This category appears as a thumbnail row."
                        })
                    ]
                } 
            });
        } catch (e) {
            cb({ success: false, errorCode: "PARSE_ERROR", message: e.stack });
        }
    }

    /**
     * Searches for media items.
     * @param {string} query
     * @param {(res: Response) => void} cb 
     */
    async function search(query, cb) {
        try {
            // Standard: Return a List of items
            // Samples show both a movie and a series
            cb({ 
                success: true, 
                data: [
                        new MultimediaItem({ 
                            title: "Example Movie (Search Result)", 
                            url: \`\${manifest.baseUrl}/movie\`, 
                            posterUrl: \`https://placehold.co/400x600.png?text=Search+Movie\`, 
                            type: "movie", 
                            bannerUrl: \`https://placehold.co/1280x720.png?text=Search+Banner\`,
                            description: "Plot summary here...", 
                            headers: { "Referer": \`\${manifest.baseUrl}\` } 
                        }),
                        new MultimediaItem({ 
                            title: "Example Series (Search Result)", 
                            url: \`\${manifest.baseUrl}/series\`, 
                            posterUrl: \`https://placehold.co/400x600.png?text=Search+Series\`, 
                            type: "series", 
                            description: "A series found in search.", 
                            headers: { "Referer": \`\${manifest.baseUrl}\` } 
                        })
                ] 
            });
        } catch (e) {
            cb({ success: false, errorCode: "SEARCH_ERROR", message: e.stack });
        }
    }

    /**
     * Loads details for a specific media item.
     * @param {string} url
     * @param {(res: Response) => void} cb 
     */
    async function load(url, cb) {
        try {
            // Standard: Return a single item with full metadata
            // Sample shows a series with episodes
            cb({ 
                success: true, 
                data: new MultimediaItem({
                    title: "Example Series Full Details",
                    url: url,
                    posterUrl: \`https://placehold.co/400x600.png?text=Series+Details\`,
                    type: "series", 
                    bannerUrl: \`https://placehold.co/1280x720.png?text=Series+Banner\`,
                    description: "This is a detailed description of the media.", 
                    year: 2024,
                    score: 8.5,
                    duration: 120, // (optional, in minutes)
                    status: "ongoing", // ongoing, completed, upcoming
                    contentRating: "PG-13",
                    logoUrl: \`https://placehold.co/200x100.png?text=Logo\`,
                    isAdult: false,
                    tags: ["Action", "Adventure"],
                    cast: [
                        new Actor({ name: "John Doe", role: "Protagonist", image: "https://placehold.co/200x300.png" })
                    ],
                    trailers: [
                        new Trailer({ name: "Official Trailer", url: "https://www.youtube.com/watch?v=..." })
                    ],
                    nextAiring: new NextAiring({ episode: 5, season: 1, airDate: "2024-04-01" }),
                    recommendations: [
                        new MultimediaItem({ title: "Similar Show", url: \`\${manifest.baseUrl}/similar\`, posterUrl: "https://placehold.co/400x600", type: "series" })
                    ],
                    playbackPolicy: "none", // 'none' | 'VPN Recommended' | 'torrent' | 'externalPlayerOnly' | 'internalPlayerOnly'
                    syncData: { "my_service_id": "12345" }, // Optional: external metadata sync
                    streams: [
                        // Optional: "Instant Load" - bypass loadStreams by providing links here
                        new StreamResult({ url: "https://example.com/movie.mp4", source: "Instant High" })
                    ],
                    headers: { "Referer": \`\${manifest.baseUrl}\` }, 
                    episodes: [
                        new Episode({ 
                            name: "Episode 1", 
                            url: \`\${manifest.baseUrl}/watch/1\`, 
                            season: 1, 
                            episode: 1, 
                            description: "Episode summary...", 
                            posterUrl: \`https://placehold.co/400x600.png?text=Episode+Poster\`,
                            headers: { "Referer": \`\${manifest.baseUrl}\` },
                            dubStatus: "sub",
                            streams: [] // Optional: "Instant Load" for episodes
                        }),
                        new Episode({ 
                            name: "Episode 2", 
                            url: \`\${manifest.baseUrl}/watch/2\`, 
                            season: 1, 
                            episode: 2, 
                            description: "Next episode summary...", 
                            posterUrl: \`https://placehold.co/400x600.png?text=Episode+Poster\`,
                            headers: { "Referer": \`\${manifest.baseUrl}\` },
                            dubStatus: "sub"
                        })
                    ]
                })
            });
        } catch (e) {
            cb({ success: false, errorCode: "LOAD_ERROR", message: e.stack });
        }
    }

    /**
     * Resolves streams for a specific media item or episode.
     * @param {string} url
     * @param {(res: Response) => void} cb 
     */
    async function loadStreams(url, cb) {
        try {
            // Standard: Return a List of stream objects
            cb({ 
                success: true, 
                data: [
                    new StreamResult({ 
                        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", 
                        source: "Direct Quality", 
                        headers: { "Referer": \`\${manifest.baseUrl}\` }
                    })
                ] 
            });
        } catch (e) {
            cb({ success: false, errorCode: "STREAM_ERROR", message: String(e) });
        }
    }

    // Export to global scope for namespaced IIFE capture
    globalThis.getHome = getHome;
    globalThis.search = search;
    globalThis.load = load;
    globalThis.loadStreams = loadStreams;
})();
`;

const README_TEMPLATE = (name: string, slug: string) => `# 🌌 ${name}
${name} is an extension repo for [SkyStream](https://github.com/akashdh11/skystream). Follow the guide below to get started and set up your providers.

## 🚀 Getting Started

### 1. Installation
To install SkyStream on your device, follow these steps:

*   **Download:** Navigate to the [SkyStream releases page](https://github.com/akashdh11/skystream/releases/) and download the latest release for your platform.
*   **Install:** Open the downloaded file and follow your system's installation prompts.
*   **Launch:** Once installed, open the **SkyStream** app.

---

## 🛠 Setting Up Extensions
SkyStream uses a repository system to fetch plugins. Follow these steps to activate the app's content:

1.  Open the app and navigate to **Settings**.
2.  Select the **Manage Extensions** menu.
3.  Click on the **Add Repository** button.
4.  Enter the following Repository URL:
    > **Repository URL:** \`https://raw.githubusercontent.com/USER_NAME/REPO_NAME/main/repo.json\`
5.  Tap **Add**.
6.  Wait for the list to populate, then **download** the desired plugins.

---

## 📺 Using the App
After you have installed your plugins, you need to toggle the providers to see content on your dashboard:

1.  Return to the **Home Screen**.
2.  Change **Provider** (bottom right floating action button).
3.  Switch to your newly installed providers to begin browsing.
`;

const GITHUB_ACTION_TEMPLATE = `name: Build and Deploy Repository

on:
  push:
    branches: [ main ]
    paths-ignore:
      - 'dist/**'
      - 'README.md'

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Deploy Repository
        run: |
          npm install -g skystream-cli
          skystream deploy -u https://raw.githubusercontent.com/\${{ github.repository }}/main

      - name: Commit and Push changes
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add .
          git commit -m "chore: automated deploy [skip ci]" || echo "No changes to commit"
          git push
`;

async function updatePluginsJson(rootDir: string) {
  // Logic removed: deploy command now handles dynamic generation in dist/
}

program.command('init')
  .description('Initialize a Sky Gen 2 Repository project')
  .argument('<project-name>', 'Display name of the project')
  .requiredOption('-p, --package-name <id>', 'Unique Repository ID (e.g. dev.akash.stars)')
  .requiredOption('-n, --plugin-name <name>', 'First plugin name (e.g. "AYNA 2")')
  .option('-d, --description <desc>', 'Repository description', 'SkyStream plugins repository')
  .option('-a, --author <author>', 'Author name', 'Developer')
  .action(async (projectName, options) => {
    const rootDir = path.resolve(projectName.toLowerCase().replace(/\s+/g, '-'));
    if (await fs.pathExists(rootDir)) {
      console.error(`Error: Directory ${rootDir} already exists`);
      process.exit(1);
    }

    await fs.ensureDir(rootDir);
    console.log(`Initializing Repository: ${projectName} (${options.packageName})`);

    const projectSlug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const repo = {
      name: projectName,
      packageName: options.packageName,
      description: options.description,
      manifestVersion: 1,
      pluginLists: [
          `https://raw.githubusercontent.com/USER_NAME/REPO_NAME/main/dist/plugins.json`
      ]
    };
    await fs.writeJson(path.join(rootDir, 'repo.json'), repo, { spaces: 2 });
    await fs.writeFile(path.join(rootDir, 'README.md'), README_TEMPLATE(projectName, projectSlug));

    // GitHub Action
    const githubWorkflowsDir = path.join(rootDir, '.github', 'workflows');
    await fs.ensureDir(githubWorkflowsDir);
    await fs.writeFile(path.join(githubWorkflowsDir, 'build.yml'), GITHUB_ACTION_TEMPLATE);

    // First Plugin
    const pluginName = options.pluginName;
    const packageName = options.packageName;
    const pluginSlug = pluginName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const pluginDir = path.join(rootDir, pluginSlug);
    await fs.ensureDir(pluginDir);

    const pluginManifest = {
      packageName: `${packageName}.${pluginSlug}`,
      name: pluginName,
      version: 1,
      baseUrl: "https://example.com",
      description: `${pluginName} plugin (Sky Gen 2)`,
      authors: [options.author],
      languages: ["en"],
      categories: ["Others"]
    };

    await fs.writeJson(path.join(pluginDir, 'plugin.json'), pluginManifest, { spaces: 2 });
    await fs.writeFile(path.join(pluginDir, 'plugin.js'), JS_TEMPLATE);

    console.log('\nSky Gen 2 Repository successfully initialized!');
    console.log(`Project Directory: ${rootDir}`);
    console.log(`First Plugin Package Name: ${pluginManifest.packageName}`);
  });

program.command('add')
  .description('Add a new Sky Gen 2 plugin to the repository')
  .argument('<plugin-name>', 'Name of the plugin (e.g. "Yflix")')
  .option('-d, --description <desc>', 'Plugin description')
  .option('-a, --author <author>', 'Author name')
  .action(async (pluginName, options) => {
    const rootDir = process.cwd();
    const repoPath = path.join(rootDir, 'repo.json');

    if (!await fs.pathExists(repoPath)) {
      console.error('Error: Not in a SkyStream repository (repo.json missing)');
      process.exit(1);
    }

    const repo = await fs.readJson(repoPath);
    const pluginSlug = pluginName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const pluginDir = path.join(rootDir, pluginSlug);

    if (await fs.pathExists(pluginDir)) {
      console.error(`Error: Plugin ${pluginName} already exists at ${pluginSlug}`);
      process.exit(1);
    }

    // Guess package-name from repo id
    const packageName = repo.packageName;

    const pluginManifest = {
      packageName: `${packageName}.${pluginSlug}`,
      name: pluginName,
      version: 1,
      baseUrl: "https://example.com",
      description: options.description || `${pluginName} plugin for ${repo.name}`,
      authors: [options.author || repo.author || "Developer"],
      languages: ["en"],
      categories: ["Others"]
    };

    await fs.ensureDir(pluginDir);
    await fs.writeJson(path.join(pluginDir, 'plugin.json'), pluginManifest, { spaces: 2 });
    await fs.writeFile(path.join(pluginDir, 'plugin.js'), JS_TEMPLATE);

    console.log(`✓ Added Plugin: ${pluginName} (Package: ${pluginManifest.packageName})`);
  });

program.command('validate')
  .description('Validate all plugins in the repo')
  .action(async () => {
    const rootDir = process.cwd();
    const items = await fs.readdir(rootDir);
    let count = 0;
    for (const item of items) {
        const itemPath = path.join(rootDir, item);
        const manifestPath = path.join(itemPath, 'plugin.json');
        if (await fs.pathExists(manifestPath) && (await fs.stat(itemPath)).isDirectory()) {
            try {
                const manifest = await fs.readJson(manifestPath);
                pluginSchema.parse(manifest);
                console.log(`✓ ${manifest.packageName}: Manifest OK`);
                const js = await fs.readFile(path.join(itemPath, 'plugin.js'), 'utf8');
                if (js.includes('globalThis.getHome = getHome')) {
                    console.log(`✓ ${manifest.packageName}: Logic OK`);
                } else {
                    console.warn(`! ${manifest.packageName}: Missing exports`);
                }
                count++;
            } catch (e: any) {
                console.error(`\u2717 ${item} invalid: ${e.message}`);
                if (e instanceof z.ZodError) {
                    console.error(JSON.stringify(e.format(), null, 2));
                }
            }
        }
    }
    console.log(`\nValidation complete. Validated ${count} plugins.`);
  });

program.command('test')
  .description('Test a specific plugin')
  .option('-p, --path <path>', 'Path to plugin folder', '.')
  .option('-f, --function <function>', 'Function to test', 'getHome')
  .option('-q, --query <query>', 'Query for function', '')
  .action(async (options) => {
    const pluginDir = path.resolve(options.path);
    const manifestPath = path.join(pluginDir, 'plugin.json');
    const jsPath = path.join(pluginDir, 'plugin.js');

    if (!await fs.pathExists(manifestPath)) {
      console.error(`Error: plugin.json not found at ${manifestPath}`);
      console.log('Hint: Run this command from your plugin directory or specify --path');
      process.exit(1);
    }
    if (!await fs.pathExists(jsPath)) {
      console.error(`Error: plugin.js not found at ${jsPath}`);
      process.exit(1);
    }

    const manifest = await fs.readJson(manifestPath);
    const jsContent = await fs.readFile(jsPath, 'utf8');

    console.log(`\n--- Testing ${manifest.packageName} -> ${options.function} ---`);
    const preferences: Record<string, any> = {};
    const context: any = {
      manifest,
      console: { 
        log: (...args: any[]) => console.log('  [JS]:', ...args), 
        error: (...args: any[]) => console.error('  [JS ERR]:', ...args) 
      },
      http_get: async (url: string, headers_or_options: any, cb: any) => {
        try {
          let headers = headers_or_options;
          if (typeof headers_or_options === 'object' && headers_or_options !== null && (headers_or_options.headers || headers_or_options.body)) {
             headers = headers_or_options.headers;
          }
          const finalHeaders = { ...(headers || {}) };
          if (!Object.keys(finalHeaders).some(k => k.toLowerCase() === 'user-agent')) {
            finalHeaders['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
          }
          const res = await axios.get(url, { headers: finalHeaders, method: 'GET' });
          const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          const response = { status: res.status, statusCode: res.status, body, headers: res.headers };
          if (cb) cb(response);
          return response;
        } catch (e: any) {
          const response = { status: e.response?.status || 500, statusCode: e.response?.status || 500, body: e.response?.data || e.message, headers: e.response?.headers || {} };
          if (cb) cb(response);
          return response;
        }
      },
      http_post: async (url: string, headers: any, body: any, cb: any) => {
        try {
          const finalHeaders = { ...(headers || {}) };
          if (!Object.keys(finalHeaders).some(k => k.toLowerCase() === 'user-agent')) {
            finalHeaders['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
          }
          const res = await axios.post(url, body, { headers: finalHeaders, method: 'POST' });
          const resBody = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          const response = { status: res.status, statusCode: res.status, body: resBody, headers: res.headers };
          if (cb) cb(response);
          return response;
        } catch (e: any) {
          const response = { status: e.response?.status || 500, statusCode: e.response?.status || 500, body: e.response?.data || e.message, headers: e.response?.headers || {} };
          if (cb) cb(response);
          return response;
        }
      },
      registerSettings: (schema: any) => {
        console.log('  [Mock SDK]: Plugin registered settings:', JSON.stringify(schema, null, 2));
      },
      getPreference: (key: string) => {
          return preferences[key] || null;
      },
      setPreference: (key: string, value: any) => {
          preferences[key] = value;
          return true;
      },
      solveCaptcha: async (siteKey: string, url: string) => {
        console.log('  [Mock SDK]: solveCaptcha requested for ' + url + ' with key ' + siteKey);
        return "mock_captcha_token";
      },
      btoa: (s: string) => Buffer.from(s).toString('base64'),
      atob: (s: string) => Buffer.from(s, 'base64').toString('utf8'),
      sendMessage: async (id: string, arg: string) => {
        if (id === 'get_preference') {
            const { key } = JSON.parse(arg);
            return preferences[key] || null;
        }
        if (id === 'set_preference') {
            const { key, value } = JSON.parse(arg);
            preferences[key] = value;
            return true;
        }
        if (id === 'crypto_decrypt_aes') {
          const { data, key, iv } = JSON.parse(arg);
          try {
            const decodeBuffer = (s: string) => {
              return s.length % 4 === 0 && /^[A-Za-z0-9+/=]+$/.test(s) ? Buffer.from(s, 'base64') : Buffer.from(s, 'utf8');
            };

            const k = decodeBuffer(key);
            const ivBuf = Buffer.alloc(16, 0);
            decodeBuffer(iv).copy(ivBuf);
            
            let algo = 'aes-256-cbc';
            let finalKey = Buffer.alloc(32, 0);
            if (k.length <= 16) {
                algo = 'aes-128-cbc';
                finalKey = Buffer.alloc(16, 0);
            } else if (k.length <= 24) {
                algo = 'aes-192-cbc';
                finalKey = Buffer.alloc(24, 0);
            }
            k.copy(finalKey);

            const decipher = crypto.createDecipheriv(algo, finalKey, ivBuf);
            let decrypted = decipher.update(data, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
          } catch (e: any) {
            console.error('  [Mock ERR]: AES Decryption failed:', e.message);
            return data;
          }
        }
        return '';
      },
      crypto: {
        decryptAES: async (data: string, key: string, iv: string) => {
          return context.sendMessage('crypto_decrypt_aes', JSON.stringify({ data, key, iv }));
        }
      },
      globalThis: {} as any,
    };
    context.globalThis = context;

    const entityDefs = `
      class Actor {
        constructor(params) {
          Object.assign(this, params);
        }
      }

      class Trailer {
        constructor(params) {
          Object.assign(this, params);
        }
      }

      class NextAiring {
        constructor(params) {
          Object.assign(this, params);
        }
      }

      class MultimediaItem {
        constructor(params) {
          Object.assign(this, {
            type: 'movie',
            status: 'ongoing',
            playbackPolicy: 'none',
            isAdult: false,
            streams: [],
            syncData: {},
            ...params
          });
        }
      }

      class Episode {
        constructor(params) {
          Object.assign(this, {
            season: 0,
            episode: 0,
            dubStatus: 'none',
            playbackPolicy: 'none',
            streams: [],
            ...params
          });
        }
      }

      class StreamResult {
        constructor(params) {
          Object.assign(this, params);
        }
      }

      globalThis.parseHtml = async function(html) {
          return new Promise((resolve, reject) => {
              try {
                  const dom = new JSDOM(html);
                  resolve(dom.window.document);
              } catch (e) {
                  reject(e);
              }
          });
      };

      globalThis.clearInterval = clearInterval;
    `;

    const sandbox = Object.create(null);
    Object.assign(sandbox, context);
    
    // Ensure Node globals are present
    sandbox.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
    sandbox.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
    sandbox.URL = URL;
    sandbox.console = {
      log: (...args: any[]) => console.log('[JS LOG]', ...args),
      error: (...args: any[]) => console.error('[JS ERROR]', ...args),
      warn: (...args: any[]) => console.warn('[JS WARN]', ...args),
    };
    sandbox.axios = axios;
    sandbox.Buffer = Buffer;
    sandbox.setTimeout = setTimeout;
    sandbox.clearTimeout = clearTimeout;
    sandbox.setInterval = setInterval;
    sandbox.clearInterval = clearInterval;
    sandbox.JSDOM = JSDOM;
    sandbox.URL = URL;
    sandbox.globalThis = sandbox;
    
    // Inject the classes from entityDefs into the sandbox
    const vmContext = vm.createContext(sandbox);
    vm.runInContext(entityDefs, vmContext);

    const combinedScript = `
      try {
        ${jsContent}
      } catch (e) {
        console.error("Critical Runtime Error: " + e.stack);
      }
    `;

    try {
      vm.runInContext(combinedScript, vmContext, { timeout: 5000, breakOnSigint: true });
    } catch (e: any) {
      console.error("VM Execution Error: " + e.message);
    }

    const fn = (vmContext as any).globalThis[options.function];
    if (typeof fn !== 'function') { console.error('Error: exported function not found'); process.exit(1); }

    const callback = (res: any) => {
      console.log('\n--- Result ---');
      if (res && res.success === false) {
        console.log('\x1b[31mStatus: FAILED\x1b[0m');
        console.log('\x1b[31mError Code: ' + (res.errorCode || 'UNKNOWN') + '\x1b[0m');
        if (res.message) console.log('\x1b[31mMessage: ' + res.message + '\x1b[0m');
      } else {
        console.log('\x1b[32mStatus: SUCCESS\x1b[0m');
      }
      console.log(JSON.stringify(res, null, 2));
    };

    try {
        if (options.function === 'getHome') await fn(callback);
        else if (options.function === 'search') await fn(options.query, callback);
        else if (!options.query || options.query.trim() === "") {
            console.warn('\x1b[33mWarning: Function \'' + options.function + '\' usually requires a query/URL (-q), but none was provided.\x1b[0m');
            await fn(options.query, callback);
        } else {
            await fn(options.query, callback);
        }
    } catch (e: any) {
        console.error('\n\x1b[31m--- CRITICAL ERROR DURING EXECUTION ---\x1b[0m');
        console.error('\x1b[31m' + (e.stack || e.message) + '\x1b[0m\n');
        process.exit(2);
    }
  });

program.command('deploy')
  .description('Deploy all plugins and repository index')
  .requiredOption('-u, --url <url>', 'Base hosting URL for .sky files')
  .action(async (options) => {
    const rootDir = process.cwd();
    const repoPath = path.join(rootDir, 'repo.json');
    if (!await fs.pathExists(repoPath)) { process.exit(1); }

    const distDir = path.join(rootDir, 'dist');
    await fs.ensureDir(distDir);

    const repo = await fs.readJson(repoPath);
    const items = await fs.readdir(rootDir);
    const catalog = [];

    // Standardize URL: Append /dist automatically
    const baseRaw = options.url.endsWith('/') ? options.url.slice(0, -1) : options.url;
    const distUrl = baseRaw + "/dist";

    for (const item of items) {
        const itemPath = path.join(rootDir, item);
        const mPath = path.join(itemPath, 'plugin.json');
        if (await fs.pathExists(mPath) && (await fs.stat(itemPath)).isDirectory()) {
            const manifest = await fs.readJson(mPath);
            const packageName = manifest.packageName || manifest.id || item;
            const bundleName = packageName + ".sky";
            const outPath = path.join(distDir, bundleName);
            
            const arch = archiver('zip', { zlib: { level: 9 } });
            arch.pipe(fs.createWriteStream(outPath));
            arch.file(mPath, { name: 'plugin.json' });
            arch.file(path.join(itemPath, 'plugin.js'), { name: 'plugin.js' });
            await arch.finalize();

            catalog.push({ ...manifest, url: distUrl + "/" + bundleName });
            console.log("✓ Bundled " + manifest.packageName);
        }
    }

    const finalRepo = {
        ...repo,
        pluginLists: [ distUrl + "/plugins.json" ]
    };

    await fs.writeJson(repoPath, finalRepo, { spaces: 2 });
    await fs.writeJson(path.join(distDir, 'plugins.json'), catalog, { spaces: 2 });
    
    // Update README.md with the live URL
    const readmePath = path.join(rootDir, 'README.md');
    if (await fs.pathExists(readmePath)) {
        let readme = await fs.readFile(readmePath, 'utf8');
        const placeholder = 'https://raw.githubusercontent.com/USER_NAME/REPO_NAME/main/repo.json';
        const liveUrl = baseRaw + "/repo.json";
        if (readme.includes(placeholder)) {
            readme = readme.replace(placeholder, liveUrl);
            await fs.writeFile(readmePath, readme);
            console.log("✓ Updated README.md with live URL");
        }
    }

    console.log("\nDeployment Complete. Assets generated in dist/");
    console.log("\nYour Repo Link for the app:");
    console.log("> " + baseRaw + "/repo.json");
  });

program.parse();
