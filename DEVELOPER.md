# SkyStream Plugin Development Guide

This guide is for developers who want to create and distribute plugins for the SkyStream app using the **Sky Gen 2 (Repository Hub)** architecture.

## 1. Prerequisites
- **Node.js**: v18 or higher (Download from [nodejs.org](https://nodejs.org/))
- **SkyStream SDK**: The CLI handles this automatically.

## 2. Installation
Install the SkyStream CLI globally from NPM:

```bash
npm install -g skystream-cli
```

## 3. Initialize a Repository
A repository is a monorepo that contains multiple plugins.

```bash
# Initialize a new repository
skystream init "My-Repo" --package-name com.package.name --plugin-name "plugin-name" --author "USER_NAME"
```
**This command creates**:
* `repo.json`: Repository metadata and federation links.
* `README.md`: User-facing instructions with auto-generated links.
* `plugin-name/`: The folder for your first plugin containing `plugin.js` and `plugin.json`.

## 4. Writing Plugin Logic
Each plugin consists of a `plugin.json` (metadata) and a `plugin.js` (logic).

### A. The Manifest (`plugin.json`)
Defines the plugin's identity and capabilities.
```json
{
  "id": "com.example.repo.pluginname",
  "name": "My Plugin",
  "version": 1,
  "description": "Short description",
  "authors": ["USER_NAME"],
  "languages": ["en"],
  "categories": ["Movie", "TvSeries"]
}
```

### B. The Logic (`plugin.js`)
SkyStream plugins run in a sandboxed environment. You must wrap your code in an **IIFE** and export functions to `globalThis`.

```javascript
(function() {
    // 1. getHome: Returns content for the dashboard
    async function getHome() {
        return {
            success: true,
            data: [
                { title: "Trending Movies", items: [{ name: "The Matrix", url: "https://example.com/matrix" }] }
            ]
        };
    }

    // 2. search: Handles user queries
    async function search(query) {
        return {
            success: true,
            data: [{ name: `Result for ${query}`, url: "..." }]
        };
    }

    // 3. loadStreams: Provides video links for a content item
    async function loadStreams(contentUrl) {
        return {
            success: true,
            data: [
                { quality: "1080p", url: "https://cdn.com/video.mp4" }
            ]
        };
    }

    // Export functions to the app
    globalThis.getHome = getHome;
    globalThis.search = search;
    globalThis.loadStreams = loadStreams;
})();
```

### C. The `PluginResult` Schema
All functions must return a standard object:
- `success` (boolean): Whether the operation worked.
- `data` (any): The result content (if successful).
- `message` (string): Error description (if failed).

## 5. Development & Testing
You can add more plugins and test them locally using a mock SkyStream environment.

```bash
# Register a new plugin in the repo
skystream add "plugin-name2"

# Test a plugin function locally
skystream test --function getHome
skystream test --function search --query "Movie Name"
```

## 6. Deployment (GitHub)
The CLI includes built-in CI/CD support. You don't need to build locally; just push your code.

1.  **Initialize Git**:
    ```bash
    git init
    git add .
    git commit -m "initial commit"
    ```
2.  **Push to GitHub**:
    Create a new repository on GitHub and run:
    ```bash
    git remote add origin https://github.com/<USER_NAME>/<REPO_NAME>.git
    git branch -M main
    git push -u origin main
    ```

## 7. App Installation
Once pushed, the **GitHub Action** will automatically build your repository. To add it to SkyStream:

1.  Go to **Extensions** -> **Add Source** in the app.
2.  Paste the URL to your **root** `repo.json` from GitHub Pages or Raw content:
    `https://raw.githubusercontent.com/<USER_NAME>/<REPO_NAME>/main/repo.json`
3.  All plugins in your repository will appear for installation!

## 8. CI/CD (GitHub Actions)
The CLI automatically scaffolds a GitHub Action in `.github/workflows/build.yml`.

**What it does**:
- Triggers on every push to the `main` branch.
- Installs the SkyStream CLI.
- Automatically builds your repository and updates the `dist/` folder and `README.md`.
- Commits and pushes the updated distribution files back to your repo.

---
*Powered by SkyStream Gen 2 Architecture*
