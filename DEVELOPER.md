# SkyStream Plugin Development Guide

Welcome to the SkyStream plugin ecosystem! This guide will walk you through creating, testing, and distributing plugins using the **Sky Gen 2 (Repository Hub)** architecture.

---

## 1. Prerequisites & Setup

Before you begin, ensure you have the following installed:
- **Node.js**: v18 or higher ([Download](https://nodejs.org/))
- **Git**: For version control and deployment.

### Install the CLI
The SkyStream CLI is your primary tool for managing repositories and plugins.
```bash
npm install -g skystream-cli
```

---

## 2. Core Development Workflow

### Step 1: Initialize a Repository
A repository is a collection of plugins. Use the CLI to scaffold your first one:
```bash
skystream init "my-repo" --package-name com.yourname.repo --plugin-name "my-plugin" --author "YourName"
```

### Step 2: Add More Plugins
You can host multiple plugins in a single repository. To add a second or third plugin:
```bash
# Navigate to your repository root
cd my-repo/

# Add a new plugin folder and template
skystream add "New-Plugin-Name"
```
The CLI will automatically generate a new folder with a safe `packageName` based on your repository ID.

### Step 3: Write Your Scraper Logic
Navigate to your plugin folder (e.g., `my-plugin/`) and open `plugin.js`. This is where you implement the four core functions.

> [!IMPORTANT]
> **Dynamic Base URL Architecture**: Always use `manifest.baseUrl` instead of hardcoded domain strings. This allows users to override the domain (e.g., for mirrors or proxies) directly from the app.

<details>
<summary><b>View the Core Function Templates</b></summary>

```javascript
(function() {

    // 1. getHome: Returns categories for the dashboard
    async function getHome(cb) {
        // Use dynamic baseUrl
        const homeUrl = `${manifest.baseUrl}/trending`;
        cb({ success: true, data: { "Trending": [ /* MultimediaItems */ ] } });
    }

    // 2. search: Handles user queries
    async function search(query, cb) {
        const searchUrl = `${manifest.baseUrl}/search?q=${query}`;
        cb({ success: true, data: [ /* MultimediaItems */ ] });
    }

    // 3. load: Fetches full details for a specific item
    function load(url, cb) {
        const loadUrl = `${manifest.baseUrl}/load?url=${url}`;
        cb({ success: true, data: { /* MultimediaItem with Episodes */ } });
    }

    // 4. loadStreams: Provides playable video links
    async function loadStreams(url, cb) {
        const streamUrl = `${manifest.baseUrl}/streams?url=${url}`;
        cb({ success: true, data: [ /* StreamResult objects */ ] });
    }

    // Export to SkyStream
    globalThis.getHome = getHome;
    globalThis.search = search;
    globalThis.load = load;
    globalThis.loadStreams = loadStreams;
})();
```
</details>

### Step 4: Local Testing
Verify your scraper logic directly in your terminal before deploying.

| Function | Command | Purpose |
| :--- | :--- | :--- |
| **getHome** | `skystream test -f getHome` | Check if dashboard categories load. |
| **search** | `skystream test -f search -q "Query"` | Verify search results for a keyword. |
| **load** | `skystream test -f load -q "URL"` | Verify movie/series details & episodes. |
| **loadStreams** | `skystream test -f loadStreams -q "URL"` | Check if playable video links are found. |

> [!TIP]
> If a test fails with `PARSE_ERROR`, the CLI (v1.2.8+) will now attempt to show you the internal JavaScript stack trace to help you pinpoint the exact line that crashed.

### Step 4: Deployment
SkyStream uses GitHub Actions to deploy and host your repository automatically.
1. Create a new repository on GitHub.
2. Push your code:
```bash
git init
git remote add origin https://github.com/USER/REPO.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 3. Installation in SkyStream App

Once your GitHub Action finishes deploying (check the "Actions" tab on GitHub), your repository is live!

1. Open SkyStream -> **Extensions** -> **Add Source**.
2. Paste your `repo.json` URL (e.g., `https://raw.githubusercontent.com/USER/REPO/main/repo.json`).
3. Your plugins are now ready to install!

---

## 4. Technical Reference

<details>
<summary><b>JavaScript Helper Classes (Recommended)</b></summary>

SkyStream provides built-in global classes to ensure data consistency. Using these is highly recommended for better structure and future-proofing.

**MultimediaItem**
```javascript
const item = new MultimediaItem({
  title: "Example Title",
  url: `${manifest.baseUrl}/movie`,
  posterUrl: `${manifest.baseUrl}/poster.jpg`,
  type: "movie", // Options: movie, series, anime, livestream
  description: "A great story...", // (optional)
  bannerUrl: `${manifest.baseUrl}/banner.jpg` // (optional)
});
```

**Episode**
```javascript
const ep = new Episode({
  name: "S01E01",
  url: `${manifest.baseUrl}/watch/1`,
  season: 1,
  episode: 1
});
```

**StreamResult**
```javascript
const stream = new StreamResult({
  url: "https://cdn.com/video.mp4",
  quality: "1080p",
  headers: { "Referer": `${manifest.baseUrl}` }
});
```
</details>

<details>
<summary><b>Standard Data Schemas</b></summary>

If you prefer raw objects, ensure they match these definitions:

### MultimediaItem
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | Yes | Display name. |
| `url` | `string` | Yes | Unique ID (usually the source URL). |
| `posterUrl` | `string` | Yes | Vertical image URL. |
| `type` | `string` | Yes | `movie`, `series`, `anime`, or `livestream`. |
| `episodes` | `array` | No | List of `Episode` objects. |

### StreamResult
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string` | Yes | Playable link (MP4/HLS/Magnet). |
| `quality` | `string` | No | Label (e.g., "4K"). |
| `subtitles` | `array` | No | `{ url, label, lang }`. |
| `drmKid` | `string` | No | Widevine Key ID. |
| `licenseUrl` | `string` | No | DRM License server. |
</details>

<details>
<summary><b>Advanced Features</b></summary>

### Byte-Level Proxying
If a video host requires specific headers that the player can't send, use the Magic Proxy:
```javascript
const proxyUrl = "MAGIC_PROXY_v1" + btoa(`${manifest.baseUrl}/video.mp4`);
```

### Dynamic M3U8 Generation
Inject custom logic into playlists:
```javascript
const m3u8 = "magic_m3u8:" + btoa("#EXTM3U\n...");
```
</details>

---
*Powered by SkyStream Gen 2 Architecture*
