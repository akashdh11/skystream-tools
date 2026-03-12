#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'path';
import fs from 'fs-extra';
import { z } from 'zod';
import archiver from 'archiver';
import axios from 'axios';
import AdmZip from 'adm-zip';

const program = new Command();

program
  .name('skystream')
  .description('SkyStream Plugin Development Kit CLI (Sky Gen 2)')
  .version('1.2.4');

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


    /**
     * Loads the home screen categories.
     * @param {(res: Response) => void} cb 
     */
    async function getHome(cb) {
        try {
            // Standard: Return a Map of Category -> List of items
            cb({ 
                success: true, 
                data: { 
                    "Trending": [
                        new MultimediaItem({ 
                            title: "Example Movie", 
                            url: \`\${manifest.baseUrl}/movie\`, 
                            posterUrl: \`\${manifest.baseUrl}/poster.jpg\`, 
                            type: "movie", // Valid types: movie, series, anime, livestream
                            bannerUrl: \`\${manifest.baseUrl}/banner.jpg\`, // (optional)
                            description: "Plot summary here...", // (optional)
                            headers: { "Referer": \`\${manifest.baseUrl}\` } // (optional)
                        })
                    ] 
                } 
            });
        } catch (e) {
            cb({ success: false, errorCode: "PARSE_ERROR", message: (e instanceof Error) ? e.message : String(e) });
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
            cb({ 
                success: true, 
                data: [
                        new MultimediaItem({ 
                            title: "Example Movie", 
                            url: \`\${manifest.baseUrl}/movie\`, 
                            posterUrl: \`\${manifest.baseUrl}/poster.jpg\`, 
                            type: "movie", // Valid types: movie, series, anime, livestream
                            bannerUrl: \`\${manifest.baseUrl}/banner.jpg\`, // (optional)
                            description: "Plot summary here...", // (optional)
                            headers: { "Referer": \`\${manifest.baseUrl}\` } // (optional)
                        })
                ] 
            });
        } catch (e) {
            cb({ success: false, errorCode: "SEARCH_ERROR", message: (e instanceof Error) ? e.message : String(e) });
        }
    }

    /**
     * Loads details for a specific media item.
     * @param {string} url
     * @param {(res: Response) => void} cb 
     */
    function load(url, cb) {
        try {
            // Standard: Return a single item with full metadata
            cb({ 
                success: true, 
                data: new MultimediaItem({
                    title: "Example Movie Full Details",
                    url: url,
                    posterUrl: \`\${manifest.baseUrl}/poster.jpg\`,
                    type: "movie", // Valid types: movie, series, anime, livestream
                    bannerUrl: \`\${manifest.baseUrl}/banner.jpg\`, // (optional)
                    description: "This is a detailed description of the movie.", // (optional)
                    headers: { "Referer": \`\${manifest.baseUrl}\` }, // (optional)
                    episodes: [
                        new Episode({ 
                            name: "Episode 1", 
                            url: \`\${manifest.baseUrl}/watch/1\`, 
                            season: 1, // (optional)
                            episode: 1, // (optional)
                            description: "Episode summary...", // (optional)
                            posterUrl: \`\${manifest.baseUrl}/ep-poster.jpg\`, // (optional)
                            headers: { "Referer": \`\${manifest.baseUrl}\` } // (optional)
                        })
                    ]
                })
            });
        } catch (e) {
            cb({ success: false, errorCode: "LOAD_ERROR", message: (e instanceof Error) ? e.message : String(e) });
        }
    }

    /**
     * Resolves streams for a specific media item or episode.
     * @param {string} url
     * @param {(res: Response) => void} cb 
     */
    async function loadStreams(url, cb) {
        try {
            // Standard: Return a List of stream urls
            cb({ 
                success: true, 
                data: [
                    new StreamResult({ 
                        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", 
                        quality: "1080p", // (optional)
                        headers: { "Referer": \`\${manifest.baseUrl}\` }, // (optional)
                        subtitles: [
                            { url: \`\${manifest.baseUrl}/sub.vtt\`, label: "English", lang: "en" } // (optional)
                        ],
                        drmKid: "kid_value", // (optional)
                        drmKey: "key_value", // (optional)
                        licenseUrl: "https://license-server.com" // (optional)
                    })
                ] 
            });
        } catch (e) {
            cb({ success: false, errorCode: "STREAM_ERROR", message: (e instanceof Error) ? e.message : String(e) });
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
                console.error(`✗ ${item} invalid: ${e.message}`);
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

    const manifest = await fs.readJson(manifestPath);
    const jsContent = await fs.readFile(jsPath, 'utf8');

    console.log(`\n--- Testing ${manifest.packageName} -> ${options.function} ---`);
    const context: any = {
      manifest,
      console: { log: (...args: any[]) => console.log('  [JS]:', ...args), error: (...args: any[]) => console.error('  [JS ERR]:', ...args) },
      http_get: async (url: string, headers: any, cb: any) => {
        try {
          const res = await axios.get(url, { headers });
          const result = { status: res.status, body: res.data, headers: res.headers };
          if (cb) cb(result); return result;
        } catch (e: any) {
          const res = { status: 500, body: e.message, headers: {} };
          if (cb) cb(res); return res;
        }
      },
      btoa: (s: string) => Buffer.from(s).toString('base64'),
      atob: (s: string) => Buffer.from(s, 'base64').toString('utf8'),
      globalThis: {} as any,
    };

    const runtime = new Function('manifest', 'console', 'http_get', 'btoa', 'atob', 'globalThis', jsContent);
    runtime(context.manifest, context.console, context.http_get, context.btoa, context.atob, context.globalThis);

    const fn = context.globalThis[options.function];
    if (typeof fn !== 'function') { console.error('Error: exported function not found'); process.exit(1); }

    const callback = (res: any) => {
      console.log('\n--- Result ---');
      console.log(JSON.stringify(res, null, 2));
    };

    if (options.function === 'getHome') await fn(callback);
    else await fn(options.query, callback);
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
    const distUrl = `${baseRaw}/dist`;

    for (const item of items) {
        const itemPath = path.join(rootDir, item);
        const mPath = path.join(itemPath, 'plugin.json');
        if (await fs.pathExists(mPath) && (await fs.stat(itemPath)).isDirectory()) {
            const manifest = await fs.readJson(mPath);
            const packageName = manifest.packageName || manifest.id || item;
            const bundleName = `${packageName}.sky`;
            const outPath = path.join(distDir, bundleName);
            
            const arch = archiver('zip', { zlib: { level: 9 } });
            arch.pipe(fs.createWriteStream(outPath));
            arch.file(mPath, { name: 'plugin.json' });
            arch.file(path.join(itemPath, 'plugin.js'), { name: 'plugin.js' });
            await arch.finalize();

            catalog.push({ ...manifest, url: `${distUrl}/${bundleName}` });
            console.log(`✓ Bundled ${manifest.packageName}`);
        }
    }

    const finalRepo = {
        ...repo,
        pluginLists: [ `${distUrl}/plugins.json` ]
    };

    await fs.writeJson(repoPath, finalRepo, { spaces: 2 });
    await fs.writeJson(path.join(distDir, 'plugins.json'), catalog, { spaces: 2 });
    
    // Update README.md with the live URL
    const readmePath = path.join(rootDir, 'README.md');
    if (await fs.pathExists(readmePath)) {
        let readme = await fs.readFile(readmePath, 'utf8');
        const placeholder = 'https://raw.githubusercontent.com/USER_NAME/REPO_NAME/main/repo.json';
        const liveUrl = `${baseRaw}/repo.json`;
        if (readme.includes(placeholder)) {
            readme = readme.replace(placeholder, liveUrl);
            await fs.writeFile(readmePath, readme);
            console.log(`✓ Updated README.md with live URL`);
        }
    }

    console.log(`\nDeployment Complete. Assets generated in dist/`);
    console.log(`\nYour Repo Link for the app:`);
    console.log(`> ${baseRaw}/repo.json`);
  });

program.parse();
