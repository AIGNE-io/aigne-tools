# AiGNE Tools

A monorepo containing tools and utilities for the AiGNE framework.

## Structure

This monorepo is organized using [pnpm workspaces](https://pnpm.io/workspaces) and contains the following packages:

- [`@aigne/publish-docs`](./packages/publish-docs) - Tool for publishing documentation to Discuss Kit

## Getting Started

### Prerequisites

- Node.js >= 20.15
- pnpm >= 10.2.1

### Installation

```bash
pnpm install
```

### Development

```bash
# Build all packages
pnpm build

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Clean build outputs
pnpm clean

# Run tests
pnpm test
```
