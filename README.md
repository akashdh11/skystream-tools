# 🛸 SkyStream Tools

A high-performance toolkit for building, testing, and distributing high-quality plugins for the [SkyStream](https://github.com/akashdh11/skystream) ecosystem.

## 📦 What's Included?

This repository contains the core infrastructure for the **SkyStream Gen 2 (Repository Hub)** architecture:

*   **[`skystream-cli`](./cli)**: The official command-line tool for scaffolding, validating, and building plugin repositories.
*   **[`@skystream/sdk`](./sdk)**: Type definitions and documentation for writing safe and robust JavaScript scrapers.
*   **[`runtime`](./runtime)**: A mock execution environment for testing plugins locally without the mobile app.

## 🚀 Getting Started

If you are a developer looking to create plugins, the best place to start is our comprehensive guide:

👉 **[SkyStream Plugin Development Guide](./DEVELOPER.md)**

### Installation

```bash
npm install -g skystream-cli
```

### CLI Quick Reference

| Command | Usage | Description |
| --- | --- | --- |
| `init` | `skystream init <name> [options]` | Create a new repository project |
| `add` | `skystream add <name> [options]` | Add a new plugin to the repo |
| `validate` | `skystream validate` | Check manifests and logic |
| `test` | `skystream test [options]` | Run a plugin in mock runtime |
| `deploy` | `skystream deploy --url <url>` | Bundle and generate `repo.json` |

For detailed usage, see the **[CLI Documentation](./cli/README.md)**.

## 🛠 Features

*   **Monorepo Support**: Manage multiple plugins in a single federated repository.
*   **Type Safety**: Full JSDoc and TypeScript support for JavaScript-based scrapers.
*   **Local Testing**: Validate your logic instantly with the built-in mock runtime.
*   **Automated CI/CD**: One-click deployment to GitHub with automated builds and artifact hosting.
*   **Plug-and-Play Distribution**: Distribute plugins via simple Raw JSON URLs.

## 🏗 Developing the Toolkit

If you'd like to contribute to the tools themselves:

1.  Clone this repository.
2.  Navigate to the respective component (`cli`, `sdk`, or `runtime`).
3.  Run `npm install` and `npm run build`.

---
*Empowering the next generation of decentralized streaming.*
