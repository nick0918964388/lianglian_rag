# 全端架構文件: 良聯智慧諮詢平台

**文件版本:** 1.0
**日期:** 2025年8月5日

---

## 第一章：簡介 (Introduction)

本文件為「良聯智慧諮詢平台」專案定義了完整的全端技術架構，是開發團隊的施工藍圖。

### 1.1 入門模板 (Starter Template)
* **決策:** 採用一個現代化的全端入門模板 (例如 T3 Stack) 作為專案起點，以加速環境設定並遵循業界最佳實踐。

### 1.2 變更日誌 (Change Log)
| 日期 | 版本 | 描述 | 作者 |
| :--- | :--- | :--- | :--- |
| 2025年8月5日 | 1.0 | 初始草稿 | Winston (Architect) |

---

## 第二章：高層次架構 (High Level Architecture)

### 2.1 技術摘要 (Technical Summary)
本專案將建構成一個全端 TypeScript 的 Monorepo 應用程式。前端將採用 Next.js 框架搭配 Ant Design，後端核心業務邏輯以 Docker 容器內的服務存在，負責驅動一個基於 `autogen` 的多代理系統。此系統會與外部的 Ollama 模型及大型語言模型互動，並將元數據儲存在本地部署的 PostgreSQL 資料庫中。

### 2.2 平台與基礎設施 (Platform and Infrastructure)
* **平台:** 自架伺服器 + Docker
* **資料庫:** PostgreSQL (Dockerized)
* **向量資料庫:** ChromaDB (Dockerized, TBD)

### 2.3 儲存庫結構 (Repository Structure)
* **結構:** Monorepo
* **工具:** Turborepo

### 2.4 高層次架構圖 (High Level Architecture Diagram)
```mermaid
graph TD
    subgraph Browser
        U[使用者]
    end

    subgraph Self_Hosted_Server
        subgraph Docker_Compose
            F[前端應用 (Next.js)]
            A[後端 API]
            DB[(PostgreSQL)]
            VDB[(Vector Database)]
        end
        N[Nginx/Caddy as Reverse Proxy]
    end
    
    subgraph External_Services
        LLM[外部 LLM API (Gemini/Claude)]
        O[外部 Ollama API]
    end

    U --> N
    N --> F
    N --> A
    A --> DB
    A --> RAG{RAG Multi-Agent Core}
    RAG --> O
    RAG --> VDB
    RAG --> LLM
```
## 第三章：技術棧 (Tech Stack)

| 類別 | 技術 | 版本 | 用途與理由 |
| :--- | :--- | :--- | :--- |
| **前端語言** | TypeScript | ~5.4 | 為前端應用提供強類型檢查。 |
| **前端框架** | Next.js | ~14.2 | 全功能 React 框架，整合前後端。 |
| **UI 元件庫** | Ant Design | ~5.17 | 提供豐富、專業的企業級 UI 元件。 |
| **前端狀態管理** | Zustand | ~4.5 | 輕量、快速的狀態管理函式庫。 |
| **後端語言** | TypeScript | ~5.4 | 與前端語言統一，實現全端類型安全。 |
| **後端框架** | Next.js API Routes | ~14.2 | 在 Next.js 應用中建立後端 API。 |
| **API 風格** | tRPC | ~11.0 | 實現前端與後端之間端到端的類型安全。 |
| **資料庫** | PostgreSQL | 16 | 強大、可靠的開源關聯式資料庫。 |
| **認證** | NextAuth.js | ~5.0 (beta) | Next.js 生態中最主流的認證函式庫。 |
| **單元/整合測試** | Vitest | ~1.6 | 新一代的測試框架，速度快。 |
| **端對端 (E2E) 測試** | Playwright | ~1.44 | 現代化的端對端測試工具。 |
| **容器化** | Docker Compose | ~2.27 | 定義和運行多容器 Docker 應用程式。 |
| **CI/CD** | GitHub Actions | - | 自動化建構與部署 Docker 映像檔。 |
| **日誌 (Logging)** | Pino | ~9.0 | 高效能的 Node.js 日誌函式庫。 |

---

## 第四章：資料模型 (Data Models)
*詳細定義請參考先前對話，此處為簡要總結*
* **User:** 儲存使用者認證資訊。
* **Dataset:** 代表使用者上傳的資料集合。
* **File:** 記錄每個獨立檔案的元數據與處理狀態。

---

## 第五章：API 規格 (API Specification)
* **方法:** 採用 **tRPC**，以後端 Router 定義作為 API 規格，提供端到端的類型安全。
* **主要路由器:**
    * `authRouter`: 處理註冊、登入。
    * `datasetRouter`: 處理資料集列表、建立、檔案上傳。
    * `chatRouter`: 處理問答查詢。

---

## 第六章：元件 (Components)
* **主要元件:** 前端 Web 應用、API 伺服器、認證服務、資料注入服務、Multi-Agent RAG 核心、主要資料庫、向量資料庫。

---

## 第七章：外部 API (External APIs)
* **外部 LLM:** 用於答案生成 (Gemini/Claude)，可透過設定檔切換。
* **本地 Ollama API:** 用於向量化 (`all-minilm:l6-v2`) 與答案生成 (`qwen3:30b-a3b-q8_0`)。

---

## 第八章：核心工作流程 (Core Workflows)
* **資料注入流程:** 使用者透過前端上傳檔案，後端 API 觸發非同步背景作業進行文件處理與向量化。
* **智慧問答流程:** 使用者提問，後端 RAG 核心的協調員代理進行任務路由，專家代理執行 RAG 流程並生成答案。

---

## 第九章：資料庫綱要 (Database Schema)
* 提供完整的 PostgreSQL DDL，用於建立 `users`, `datasets`, `files` 資料表，並設定外鍵、索引與級聯刪除。

---

## 第十章：前端架構 (Frontend Architecture)
* **元件架構:** 採用功能導向的資料夾結構，區分通用 UI 元件與業務功能元件。
* **狀態管理:** 使用 Zustand 進行模組化的全域狀態管理。
* **路由架構:** 使用 Next.js App Router 搭配 Middleware 進行路由定義與保護。
* **服務層:** 使用 tRPC React Query 客戶端進行類型安全的 API 呼叫。

---

## 第十一章：後端架構 (Backend Architecture)
* **服務架構:** 在 Next.js API Routes 中實現 Serverless 風格的服務，並採用分層設計 (Routers, Services, Repositories)。
* **資料庫架構:** 使用 Prisma 作為 ORM，並透過 Repository 模式進行資料存取。
* **認證架構:** 使用 NextAuth.js 處理認證流程，並由 Middleware 和 tRPC 程序共同實現授權。

---

## 第十二章：整合專案結構 (Unified Project Structure)
* 定義了基於 Turborepo 的 Monorepo 完整資料夾結構，包含 `apps`, `packages`, `docs` 以及根目錄的 Docker 設定檔。

---

## 第十三章：開發工作流程 (Development Workflow)
* 定義了開發環境的先決條件、首次設定步驟以及日常開發（dev, build, test）所需的指令。
* 列出了 `.env` 檔案中所有必要的環境變數。

---

## 第十四章：部署架構 (Deployment Architecture)
* **策略:** 採用基於 Docker Compose 的藍綠部署概念。
* **CI/CD:** 使用 GitHub Actions 自動化建構、推送 Docker 映像檔並在伺服器上啟動新服務。
* **環境:** 定義了開發、預備、生產三種環境。

---

## 第十五章：安全性與效能 (Security and Performance)
* **安全性:** 定義了後端 API、認證、容器與伺服器層級的安全需求。
* **效能:** 定義了前後端的效能優化策略，包括程式碼分割、圖片優化、資料庫索引與快取策略。

---

## 第十六章：測試策略 (Testing Strategy)
* **策略:** 遵循測試金字塔原則，MVP 階段以 Vitest 進行單元/整合測試為主，搭配少量 Playwright E2E 測試。
* **組織:** 測試檔案與原始碼並存，E2E 測試集中存放。

---

## 第十七章：程式碼標準 (Coding Standards)
* 定義了四條關鍵規則（全端型別共享、服務層抽象、環境變數存取、統一日誌）與命名慣例，以確保程式碼品質。

---

## 第十八章：錯誤處理策略 (Error Handling Strategy)
* 定義了標準化的錯誤回傳格式，並規劃了前後端統一的錯誤捕捉與呈現機制。

---

## 第十九章：檢查清單結果報告 (Checklist Results Report)
`architect-checklist` 驗證完畢。報告顯示，本架構文件與前期文件需求高度對齊，技術選型務實，並在安全性、擴展性和可維護性上都有周全的考量。此架構已準備好，可以進入開發階段。