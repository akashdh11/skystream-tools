# SkyStream CLI

The official command-line toolkit for deploying, testing, and managing SkyStream (Gen 2) plugin repositories.

## 🚀 Quick Start

### Installation

```bash
npm install -g skystream-cli
```

### Initialize a new Repository

```bash
skystream init "My Universe" --package-name com.example.repo --plugin-name "Provider 1"
```

### Add a new Plugin

```bash
cd my-universe
skystream add "New Provider"
```

### Deploy for Distribution

```bash
skystream deploy -u https://my-cdn.com/repo
```

## 🛠 Commands

### `init`
Initialize a new Sky Gen 2 Repository project.

**Usage:**
```bash
skystream init <project-name> --package-name <id> --plugin-name <name> [options]
```

**Options:**
- `-p, --package-name <id>`: **(Required)** Unique Repository ID (e.g., `com.dev.stars`).
- `-n, --plugin-name <name>`: **(Required)** First plugin name (e.g., `AYNA 2`).
- `-d, --description <desc>`: Repository description (Default: `SkyStream plugins repository`).
- `-a, --author <author>`: Author name (Default: `Developer`).

---

### `add`
Add a new Sky Gen 2 plugin to an existing repository.

**Usage:**
```bash
skystream add <plugin-name> [options]
```

**Options:**
- `-d, --description <desc>`: Plugin description.
- `-a, --author <author>`: Author name.

---

### `validate`
Validate all plugins in the repository (manifests and logic exports).

**Usage:**
```bash
skystream validate
```

---

### `test`
Test a specific plugin in a mock runtime.

**Usage:**
```bash
skystream test [options]
```

**Options:**
- `-p, --path <path>`: Path to plugin folder (Default: `.`).
- `-f, --function <name>`: Function to test (Default: `getHome`).
- `-q, --query <query>`: Query string for functions like `search`.

---

### `deploy`
Bundle all plugins and generate the `repo.json` index.

**Usage:**
```bash
skystream deploy --url <url>
```

**Options:**
- `-u, --url <url>`: **(Required)** Base hosting URL where the `.sky` files will be served (e.g., `https://raw.githubusercontent.com/USER/REPO/main`).

## 📖 Learn More
Visit the [SkyStream Repository Specification](https://github.com/akashdh11/skystream) for more details.
