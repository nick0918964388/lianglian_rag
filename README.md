# Lianglian RAG Platform

現代化 RAG 查詢平台 - Modern RAG Query Platform for Lianglian Industrial Corporation (良聯工業股份有限公司)

## Overview

This platform provides an intelligent, unified interface for querying internal company data including procurement records, material pricing, and technical documentation. Built with a monorepo architecture to ensure consistent development standards and efficient code sharing.

## Project Structure

```
lianglian-rag/
├── apps/
│   ├── frontend/          # React-based web application
│   └── backend/           # Node.js backend with autogen integration
├── packages/
│   ├── eslint-config-custom/  # Shared ESLint configuration
│   └── tsconfig/              # Shared TypeScript configuration
└── docs/                      # Project documentation
    ├── stories/               # Development stories
    └── client_doc/            # Client documentation and materials
```

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd lianglian-rag
```

### 2. Install dependencies

```bash
npm install
```

This will install dependencies for all workspaces (frontend, backend, and shared packages).

### 3. Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

Or run specific workspaces:

```bash
# Frontend only
npm run dev --workspace=@lianglian-rag/frontend

# Backend only
npm run dev --workspace=@lianglian-rag/backend
```

### 4. Building

Build all workspaces:

```bash
npm run build
```

### 5. Testing

Run tests across all workspaces:

```bash
npm run test
```

### 6. Linting

Run ESLint across all workspaces:

```bash
npm run lint
```

## Workspace Commands

Each workspace (frontend/backend) has its own set of npm scripts:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## Architecture

This project uses a monorepo structure with npm workspaces to manage multiple packages:

- **Frontend**: React-based web application for user interface
- **Backend**: Node.js backend service integrating with autogen for multi-agent RAG functionality
- **Shared Packages**: Common configurations and utilities shared between frontend and backend

## Contributing

1. Create a new branch for your feature/fix
2. Make your changes following the established coding standards
3. Run tests and linting before committing
4. Submit a pull request with a clear description of changes

## License

ISC License - See LICENSE file for details

## Contact

Lianglian Industrial Corporation (良聯工業股份有限公司)

---

For detailed development documentation, see the `/docs` directory.