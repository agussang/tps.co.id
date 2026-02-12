# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing two main projects for a CMS/deployment system:

- **tps-fw** - React 18 frontend framework with shadcn/ui components and Tailwind CSS
- **tps-core/tps** - Bun-based backend server (named "prasi-deploy") with PostgreSQL database

## Runtime & Package Manager

**Use Bun, not npm or Node.js.** This project requires Bun v1.1.20+.

```bash
# Install dependencies
bun install

# All commands use bun
bun run <script>
```

## Development Commands

### Backend (tps-core/tps)

```bash
cd tps-core/tps

bun run dev          # Development mode with watch
bun run prod         # Production mode
bun run prep         # Docker preparation
bun run pkgs-upgrade # Upgrade packages
```

Default port: 3300

### Frontend (tps-fw)

```bash
cd tps-fw

bun run startup      # Watch and build Tailwind CSS
```

## Database

- **PostgreSQL** with **Prisma ORM** (v5.8.1+)
- Schema: `tps-core/tps/app/db/prisma/schema.prisma`
- Connection: Configure `DATABASE_URL` in `tps-core/tps/app/db/.env`

### Key Models

- `content` - Main content entries with language inheritance (`lang: "inherited"`)
- `structure` - Content structure definitions with paths, types, and metadata
- `layout` - Page layouts with SEO and meta configuration
- `file` / `file_preview` - File storage with preview generation
- `user` / `role` / `user_session` - Authentication and authorization
- `logs` - Audit logging

### Prisma Commands

```bash
cd tps-core/tps/app/db

bunx prisma generate     # Generate client
bunx prisma migrate dev  # Run migrations
bunx prisma db push      # Push schema changes
```

## Architecture

### Backend (tps-core/tps)

```
pkgs/
├── index.ts          # Dev entry point
├── prod.ts           # Production entry with PM2
├── api/              # API endpoint handlers
├── server/           # HTTP server and routing
└── utils/            # Build, deploy, query utilities

app/
├── db/               # Prisma schema and migrations
├── web/              # Frontend assets
│   ├── deploy/       # Prasi bundled .gz files (tps-fw code)
│   └── server/       # Extracted server code (index.js)
└── srv/              # Server-side code
    ├── api/          # API endpoints
    ├── components/   # SSR components
    ├── tests/        # Unit tests (keep here, NOT in api/)
    └── utils/        # Utilities
```

### Frontend (tps-fw)

```
app/
├── admin/            # Admin panel (Layout, actions, content editing)
├── frontend/         # Public-facing components
├── utils/            # Utilities (init, typer, content handling)
└── css/              # Tailwind CSS (globals.css -> build.css)

lib/                  # Shared library code
server/               # Server-side routing and queries
server.ts             # Main HTTP handler
index.tsx             # Component exports
```

## TypeScript Configuration

Both projects use strict TypeScript with path aliases:
- Frontend: `moduleResolution: "Node"`
- Backend: `moduleResolution: "bundler"`

## UI Components

- **Component library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom `c-` prefix and dark mode support
- **Icons**: lucide-react
- **Configuration**: `tps-fw/components.json`

## Docker Deployment

The backend uses Ubuntu base with pm2-runtime for production. See `tps-core/tps/Dockerfile`.

### Production Server

- **Server**: `172.19.154.93`
- **Database**: PostgreSQL at `172.19.154.92:5432` (database: `tps_web`)
- **Container**: `tps-app` (Docker Compose at `/opt/tps-app/docker-compose.yml`)
- **App files**: `/opt/tps-app/` (host) → `/app/` (container)
- **Upload files**: `/opt/tps-data/uploads/` (host) → `/data/files/` (container)
- **Port**: 3300

### Deploy Workflow

Source code di-mount sebagai volume dari host ke container. Deploy cukup rsync + restart.

```bash
# Full deploy (sync + restart)
./deploy.sh

# Sync only + clear cache (tanpa restart, untuk perubahan ringan)
./deploy.sh --sync-only

# Restart container only
./deploy.sh --restart
```

**Apa yang dilakukan `deploy.sh`:**
1. `rsync` 4 direktori source code ke server
2. `docker restart tps-app`
3. Health check + smoke test homepage

**PENTING:**
- Server tidak punya akses internet/GitHub — deploy hanya bisa dari local via SSH
- `node_modules` tetap dari Docker image, tidak perlu install di host
- Untuk update dependencies, perlu `docker compose build` + `docker compose up -d`

### Docker Volumes (docker-compose.yml)

```yaml
volumes:
  # Source code (synced via deploy.sh, langsung dipakai container)
  - /opt/tps-app/pkgs:/app/pkgs                    # Server framework
  - /opt/tps-app/app/srv:/app/app/srv               # SSR API & components
  - /opt/tps-app/app/db:/app/app/db                 # Prisma schema & config
  - /opt/tps-app/app/web/deploy:/app/app/web/deploy # Prasi bundles
  # Data
  - /opt/tps-data/uploads:/data/files               # File uploads
  - /opt/tps-data/logs:/app/logs                    # Application logs
```

### Rebuild Docker Image (jika update dependencies)

```bash
ssh root@172.19.154.93 "cd /opt/tps-app && docker compose build --no-cache && docker compose up -d"
```

## Prasi Bundle System

**IMPORTANT:** tps-fw is bundled by Prasi into `.gz` files stored in `tps-core/tps/app/web/deploy/`.

When server starts, it extracts the latest `.gz` file to `app/web/server/index.js`.

### Patching Bundled Code

Changes to tps-fw source won't apply until Prasi rebuilds. To hotfix bundled code:

```typescript
// Use bun script to patch the .gz file directly
const fs = require('fs');
const zlib = require('zlib');

const gzData = fs.readFileSync('app/web/deploy/XXXX.gz');
const jsonData = zlib.gunzipSync(gzData).toString('utf-8');
const data = JSON.parse(jsonData);

// Patch the server code
data.code.server['index.js'] = data.code.server['index.js'].replace(
  /old_pattern/g,
  'new_code'
);

// Re-compress and save
const newJson = JSON.stringify(data);
const newGz = zlib.gzipSync(newJson);
fs.writeFileSync('app/web/deploy/XXXX.gz', newGz);
```

### Test Files Location

**IMPORTANT:** Keep test files in `app/srv/tests/`, NOT in `app/srv/api/`.

The server scans `api/` folder and tries to import all `.ts` files. Test files using `describe()` will cause import errors if placed there.

## Frontend Architecture Overview

Sistem frontend menggunakan **3 pendekatan** berbeda berdasarkan kebutuhan:

### 1. Prasi Legacy (Full Bundle)
~22 halaman yang masih menggunakan Prasi bundle penuh (.gz).
Header, footer, dan body semua dari Prasi.

| Route | Description |
|-------|-------------|
| `/throughput` | Throughput statistics |
| `/gcg` | Tata Kelola |
| `/profil/visi`, `/profil/managemen` | Profile pages |
| `/layanan/:slug` | Layanan pages |
| `/fasilitas` | Fasilitas |
| `/tariff` | Tarif |
| `/contact` | Kontak |
| `/berita/:slug` | Berita List |
| `/news/.../:slug` | Berita Detail |
| `/program-pengembangan-masyarakat` | CSR |
| `/sitemap` | Peta Situs |
| `/ppid/:slug`, `/ppid-info` | PPID pages |
| `/smi/:slug` | SMI Kebijakan |
| `/tutorial`, `/tutorial/clique247` | Tutorial |
| `/search` | Search |
| `/unduh-dokumen` | Download |
| `/layanan-online-dan-jadwal` | Jadwal Online |

### 2. Prasi Hybrid (Header/Footer Prasi, Body Custom)
Halaman dengan header/footer dari Prasi, tapi body di-inject via JavaScript.
**Pendekatan ini dipilih untuk menjaga konsistensi design.**

| Route | API File | Description |
|-------|----------|-------------|
| `/` | `_frontend.ts` | Homepage (data injection) |
| `/karir`, `/career` | `_karir.ts` | Halaman karir bilingual |
| `/about-us` | `_dynamic_page.ts` | About Us (dynamic) |
| `/layanan-kami` | `_dynamic_page.ts` | Layanan Kami (dynamic) |

### 3. SSR Standalone (Full SSR)
Admin backend 100% SSR tanpa Prasi. Semua rendering server-side.

| Route | Description |
|-------|-------------|
| `/backend/tpsadmin/*` | Semua halaman admin |

### Keputusan Arsitektur

**Hybrid dipilih karena:**
- Design konsisten (header/footer dari Prasi sama dengan halaman lain)
- Body bisa dikontrol penuh via database
- Tidak perlu rebuild Prasi bundle untuk konten baru
- Menghindari perbedaan design antara halaman legacy dan baru

**Full SSR TIDAK dipilih untuk frontend karena:**
- Risiko inkonsistensi design dengan halaman legacy
- Perlu reimplementasi header/footer styling
- Maintenance double jika ada update design

## SSR Components (Reference Only)

Komponen SSR tersedia untuk referensi, **tapi tidak aktif dipakai** karena menggunakan pendekatan hybrid.

### File Structure

```
tps-core/tps/app/srv/
├── api/
│   ├── _frontend.ts      # Homepage (Prasi hybrid)
│   ├── _karir.ts         # Karir page (Prasi hybrid)
│   ├── _dynamic_page.ts  # Dynamic pages (Prasi hybrid)
│   └── _static.ts        # Static file serving
├── components/           # SSR Components (untuk referensi)
│   ├── html.ts           # Utilities (escapeHtml, img, file, formatDate)
│   ├── Header.ts         # Header + Navigation (TPS blue theme)
│   ├── HeroBanner.ts     # Hero banner dengan video/image
│   ├── Services.ts       # Service cards grid
│   ├── Profile.ts        # Tentang TPS section
│   ├── Throughput.ts     # Statistics cards
│   ├── VesselSchedule.ts # Jadwal Sandar & Closing kapal
│   ├── News.ts           # Berita terbaru cards
│   ├── Customers.ts      # Logo pelanggan
│   ├── Instagram.ts      # Instagram feed
│   ├── Footer.ts         # Footer (TPS blue theme)
│   └── HomePage.ts       # Main template (TIDAK DIPAKAI)
├── utils/
│   └── jadwal-kapal.ts   # WSDL client untuk jadwal kapal (tps.co.id:9090)
└── data/
    └── ig.json           # Instagram data (local cache)
```

### Design Specifications

**Header:**
- Desktop: 2-tier (white upper 85px + blue menu bar)
- Mobile: single blue bar with hamburger
- Container max-width: 1100px
- Blue color: #0475BC

**Footer:**
- Background: #0475BC
- Box shadow: inset 0 4px 4px rgba(0,0,0,.25)
- Container max-width: 1100px
- Columns: Sitemap + Kontak

### Data Sources

| Data | Source |
|------|--------|
| Content (banner, profile, services, dll) | PostgreSQL via Prisma |
| Jadwal Sandar Kapal | WSDL http://www.tps.co.id:9090/WSCBS/Vessel |
| Jadwal Closing Kapal | WSDL http://www.tps.co.id:9090/WSCBS/Vessel |
| Instagram | Local file `app/srv/data/ig.json` |

### WSDL Credentials

```
URL: http://www.tps.co.id:9090/WSCBS/Vessel
Username: wsvessel
Password: wsvessel123
```

### Development

```bash
# Start server
cd tps-core/tps
bun run dev

# Access homepage (Prasi hybrid)
open http://localhost:3300/

# Access karir page
open http://localhost:3300/karir

# Access dynamic pages
open http://localhost:3300/about-us
open http://localhost:3300/layanan-kami
```

## Prasi-Rendered Pages (Bilingual)

Halaman yang menggunakan Prasi renderer dengan custom body injection dan bilingual support.

### Current Bilingual Pages

| Route ID/EN | API File | Description |
|-------------|----------|-------------|
| `/karir`, `/career` | `_karir.ts` | Halaman karir dengan lowongan |
| `/`, `/en/` | `_frontend.ts` | Homepage |

### Bilingual URL Pattern

```
/karir           -> Indonesian (default)
/career          -> English
/id-id/karir     -> Indonesian (explicit)
/en/career       -> English (explicit)
```

### Key Files for Prasi Pages

- `pkgs/server/create.ts` - Route detection & language extraction
- `pkgs/server/serve-api.ts` - Passes `_url` with `_lang` param to API
- `app/srv/api/_*.ts` - Page API endpoints

### Header Content Structure (CRITICAL)

```typescript
const headerContent = {
  logo: "...",
  menu: sortedMenu,
  shortcut: { menu: shortcutMenu },
  langs: allLangs,           // Array of ALL language options
  lang: Object.values(uniqueLangs), // Array of UNIQUE languages (for popup)
  // NEVER use lang: "id" (string) - popup will break!
};
```

### Creating New Bilingual Page (Checklist)

1. **Add route detection in `create.ts`:**
   ```typescript
   const isNewRoute = url.pathname === "/halaman" || url.pathname === "/page" ||
                      url.pathname.endsWith("/halaman") || url.pathname.endsWith("/page");
   if (isNewRoute) {
     let lang = "id";
     if (url.pathname.startsWith("/en/") || url.pathname.startsWith("/en-")) {
       lang = "en";
     }
     const normalizedUrl = new URL(url.toString());
     normalizedUrl.pathname = "/halaman";
     normalizedUrl.searchParams.set("_lang", lang);
     const api = await serveAPI(normalizedUrl, req);
     if (api) return api;
   }
   ```

2. **Create API file `app/srv/api/_halaman.ts`:**
   - Export `_.url` = primary route (e.g., "/halaman")
   - Export `_.raw` = true
   - Get lang from `this._url?.searchParams?.get("_lang") || "id"`
   - Build headerContent with `lang: Object.values(uniqueLangs)` (array!)
   - Create bilingual translations object
   - Return HTML with injection script

3. **Injection Script Pattern:**
   ```typescript
   const injectionScript = `<script>
   (function() {
     var karirBodyHTML = ${JSON.stringify(bodyHTML)};
     var markersID = ["marker text id"];
     var markersEN = ["marker text en"];
     // ... debounced observer with popup detection
   })();
   </script>`;
   ```

4. **Test both languages:**
   - `http://localhost:3300/halaman` (ID)
   - `http://localhost:3300/en/page` (EN)
   - Test language popup switching

### Recommended Refactoring (Future)

```
app/srv/
├── api/
│   ├── _karir.ts        # Minimal config
│   └── _halaman.ts
├── pages/               # Page-specific logic
│   ├── karir/
│   │   ├── data.ts      # fetchData function
│   │   ├── render.ts    # renderBody function
│   │   └── i18n.ts      # translations
│   └── halaman/
├── shared/
│   ├── prasi-page.ts    # Base template factory
│   ├── header-footer.ts # Header/footer builders
│   ├── injection.ts     # Injection script generator
│   └── i18n/            # Shared translations
└── utils/
    └── bilingual-routes.ts  # Centralized route config
```

## SSR Admin Pages (TPS Admin Backend)

Admin backend menggunakan SSR untuk bypass Prasi bundle limitation. Perubahan di tps-fw tidak langsung apply tanpa rebuild Prasi.

### Routes

| Route | File | Description |
|-------|------|-------------|
| `/backend/tpsadmin/dashboard` | `_tpsadmin_dashboard.ts` | Dashboard dengan stats & quick links |
| `/backend/tpsadmin/list/:structureId` | `_tpsadmin_list.ts` | List konten per struktur |
| `/backend/tpsadmin/edit/:contentId` | `_tpsadmin_edit.ts` | Edit konten dengan Quill RTE |
| `/backend/tpsadmin/nested/:parentId/:structureId` | `_tpsadmin_nested.ts` | Kelola nested/repeater items |
| `/backend/api/nested-item` | `_api_nested_item.ts` | API untuk create/delete nested items |
| `/backend/api/content-delete` | `_api_content_delete.ts` | API delete content (recursive) |

### File Structure

```
tps-core/tps/app/srv/api/
├── _tpsadmin_dashboard.ts   # SSR Dashboard
├── _tpsadmin_list.ts        # SSR List Page (semua struktur di sidebar)
├── _tpsadmin_edit.ts        # SSR Edit Page (Quill editor, form sections)
├── _tpsadmin_nested.ts      # SSR Nested Items Management
├── _api_nested_item.ts      # Nested Item CRUD API
├── _api_content_save.ts     # Custom content save API
└── _api_content_delete.ts   # Content delete API (recursive)
```

### Key Pattern: URL Parameter Extraction

**PENTING:** Router tidak meneruskan URL parameter dengan reliable. Selalu ekstrak manual:

```typescript
// ❌ JANGAN andalkan parameter dari router
async api(this: { req: Request; _url: URL }, paramId: string) {
  // paramId mungkin undefined!
}

// ✅ GUNAKAN ekstraksi manual dari URL path
async api(this: { req: Request; _url: URL }) {
  const url = this._url || new URL(req?.url || "http://localhost");
  const pathParts = url.pathname.split("/");
  const paramId = pathParts[pathParts.length - 1];
}
```

### Features Implemented

1. **Dashboard** (`_tpsadmin_dashboard.ts`)
   - Stats cards (total content, published, draft)
   - Recent content list
   - Quick links to structures

2. **List Page** (`_tpsadmin_list.ts`)
   - Sidebar dengan SEMUA struktur konten + count
   - Highlight struktur aktif
   - Table dengan field columns
   - Status filter (All/Published/Draft)
   - Search
   - Pagination
   - Edit/Delete actions

3. **Edit Page** (`_tpsadmin_edit.ts`)
   - Quill WYSIWYG editor (CDN)
   - Form sections (Informasi Dasar, Konten, Media)
   - Status dropdown (Draft/Published)
   - Options/relation dropdown dari master data
   - File upload dengan preview
   - Session validation

### Options Field dengan Master Data

```typescript
interface StructureField {
  // ...
  options: any; // JSON: { ref: "struktur-master.field" } atau array statis
  optionsList?: Array<{ value: string; label: string }>; // Loaded options
}

// Load options dari master data
if (field.options?.ref) {
  const [structurePath, fieldName] = field.options.ref.split(".");
  // Query master structure dan load optionsList
}
```

### Nested Items (Repeater Fields)

Untuk struktur dengan `multiple=true`, konten memiliki nested/repeater items.

**Identifikasi Nested Item:**
- Content dengan `id_parent` != null adalah nested item
- Status nested item: `inherited` (bukan draft/published)
- Structure path pattern: `parent.items.field` (dot-separated)

**Database Query Pattern:**
```typescript
// Get nested items untuk parent content
const nestedItems = await g.db.content.findMany({
  where: {
    id_parent: parentContentId,
    id_structure: repeaterStructureId, // struktur dengan multiple=true
  },
});

// Get field values dari nested item
const fields = await g.db.content.findMany({
  where: { id_parent: nestedItemId },
});
```

**API Nested Item (`/backend/api/nested-item`):**
```typescript
// Create
POST { action: "create", parentId: "...", structureId: "..." }
// Response: { status: "ok", id: "new-item-id" }

// Delete (recursive, hapus semua children)
POST { action: "delete", itemId: "..." }
// Response: { status: "ok" }
```

**Navigation UX untuk Nested Items:**
- Sidebar: "Kembali ke [Items]" → nested management page
- Sidebar: "Edit Parent" → parent content edit
- Header breadcrumb: Parent Structure → Parent Title → Items → Edit Item
- Save redirect: kembali ke nested management page (bukan reload)
- Status badge: "Inherited" (purple) bukan dropdown

**Unit Tests:**
```bash
cd tps-core/tps
TEST_SESSION_ID=your-session-id bun test tests/__tests__/nested-item.test.ts
```

### Content Delete API

API untuk menghapus content beserta semua children secara recursive.

**Endpoint:** `POST /backend/api/content-delete`

**Request:**
```typescript
{
  id: string  // Content ID (UUID format)
}
```

**Response:**
```typescript
// Success
{
  status: "ok",
  message: "Deleted 5 content item(s)",
  deletedCount: 5,
  structure: { name: "Berita", path: "berita" },
  cacheCleared: true
}

// Error
{ status: "error", message: "Unauthorized" }           // 401
{ status: "error", message: "Invalid ID format" }     // 400
{ status: "error", message: "Content not found" }     // 404
```

**Features:**
- Session authentication required
- UUID validation
- Recursive delete (semua children ikut terhapus)
- Auto cache clearing
- Error handling dengan message

**PENTING:** Jangan gunakan `/backend/api/del` (legacy) - endpoint ini memanggil `pathSave()` bukan delete!

### User/Role Management

SSR pages untuk mengelola user dan role (superadmin only).

**Routes:**
| Route | File | Description |
|-------|------|-------------|
| `/backend/tpsadmin/user` | `_tpsadmin_users.ts` | User management page |
| `/backend/tpsadmin/role` | `_tpsadmin_roles.ts` | Role management page |

**User APIs:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/backend/api/user` | POST | Create/Update user |
| `/backend/api/user-delete` | POST | Delete user |

**Role APIs:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/backend/api/role` | POST | Create/Update role |
| `/backend/api/role-delete` | POST | Delete role |
| `/backend/api/role-menu` | GET | Get role menu access |
| `/backend/api/role-menu` | POST | Set role menu access |

**Database Schema:**
```
user: id (int), username, name, password, id_role, active, last_login
role: id (int), name, id_parent, can_publish
role_menu: id_role, id_menu (folder ID)
```

**Features:**
- User: CRUD, toggle active status, role assignment
- Role: CRUD, parent role, can_publish flag
- Role Menu: assign folder access per role (struktur yang bisa diakses)
- Password hashing dengan SHA-256
- Prevent self-delete dan delete role yang memiliki user

**PENTING:** Setelah menambah file API baru, server perlu direstart untuk memuat routes baru (watch mode tidak otomatis scan file baru).

### Cache Clearing

Gunakan HTTP fetch untuk clear cache, bukan `g.cache.clear()`:
```typescript
// Clear all cache
await fetch(`http://localhost:${g.port || 3300}/clear-cache/`);

// Clear specific path
await fetch(`http://localhost:${g.port || 3300}/clear-cache/${rootPath}`);
```

### Performance Optimization

**List Page dengan Nested Items:**

Untuk struktur dengan banyak nested items (seperti Layanan dengan 126+ flow items), gunakan `count` bukan load semua data:

```typescript
// ❌ SLOW - loads all nested items (N+1 query problem)
const getNestedItems = async (parentId, structureId) => {
  const items = await g.db.content.findMany({ where: { id_parent: parentId, id_structure: structureId }});
  for (const item of items) {
    const fields = await g.db.content.findMany({ where: { id_parent: item.id }}); // N queries!
  }
};

// ✅ FAST - just count
const getNestedItemCount = async (parentId, structureId) => {
  return g.db.content.count({ where: { id_parent: parentId, id_structure: structureId }});
};
```

**Response Time Targets:**
| Page | Target |
|------|--------|
| Dashboard | < 2s |
| List (simple) | < 3s |
| List (with nested) | < 5s |
| Edit | < 1s |
| Nested Management | < 1s |

## Unit Testing

### Test Files

```
tps-core/tps/tests/__tests__/
├── tpsadmin-pages.test.ts   # 48 tests - all admin pages + user/role
└── nested-item.test.ts      # 12 tests - nested item CRUD
```

### Running Tests

```bash
cd tps-core/tps

# Run all tests (requires valid session)
TEST_SESSION_ID="your-session-id" bun test tests/__tests__/

# Run specific test file
TEST_SESSION_ID="your-session-id" bun test tests/__tests__/tpsadmin-pages.test.ts

# Get session ID from server logs after login
# Look for: [STANDALONE LOGIN] Success: { sessionId: "..." }
```

### Test Coverage

**TPS Admin Pages (48 tests):**
- Dashboard: stats, login redirect
- List Page: berita, layanan, nested counts, filters (status/lang/pagination)
- Edit Page: form, Quill editor, validation
- Add Page: form, structure validation
- Nested Management: items, add/delete buttons
- Folders Page: management UI
- User Management: page load, table display, API auth (4 tests)
- Role Management: page load, table display, API auth (5 tests)
- APIs: auth, validation for Content Save, Nested Item, Folder, Content Delete APIs
- Performance: response time assertions

**Content Delete API (4 tests):**
- Authentication requirements
- Method validation (POST only)
- ID format validation (UUID)
- Non-existent content handling (404)

**User/Role APIs (9 tests):**
- User page: load, table display
- User API: auth for create/update, auth for delete
- Role page: load, table display
- Role API: auth for create/update, auth for delete, auth for menu

**Nested Item API (12 tests):**
- Authentication requirements
- Method validation (POST only)
- Create: parentId, structureId validation
- Delete: itemId validation, recursive delete
- Error handling

### Writing New Tests

```typescript
import { describe, it, expect, beforeAll } from "bun:test";

const BASE_URL = "http://localhost:3300";
const getSessionCookie = () => `sid=${process.env.TEST_SESSION_ID || ""}`;

const fetchWithSession = async (path: string, options: RequestInit = {}) => {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...options.headers, Cookie: getSessionCookie() },
  });
};

describe("My Feature", () => {
  it("should work", async () => {
    const res = await fetchWithSession("/backend/tpsadmin/dashboard");
    expect(res.status).toBe(200);
  });
});
```

### Completed Tasks

- [x] Dashboard → List → Edit → Save flow
- [x] Sidebar navigation filtering
- [x] Options dropdown dengan master data
- [x] Nested items CRUD (create, read, update, delete)
- [x] Nested items navigation UX
- [x] List page performance optimization (count vs load)
- [x] Comprehensive unit tests (51 tests passing)

## Dynamic Pages System

Sistem halaman dinamis yang menggunakan Prasi renderer untuk header/footer konsisten, dengan section components custom yang di-render di body.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    URL Request                          │
│                  (e.g., /layanan-kami)                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              _dynamic_page.ts                           │
│  1. Query structure WHERE url_pattern = pathname        │
│  2. Load section content                                │
│  3. Render sections dengan inline styles                │
│  4. Inject ke Prasi template                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               Page Structure                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Header (Prasi) - minimal            │   │
│  ├─────────────────────────────────────────────────┤   │
│  │         HeroSection (custom, inline CSS)         │   │
│  ├─────────────────────────────────────────────────┤   │
│  │         ContentSection (Quill richtext)          │   │
│  ├─────────────────────────────────────────────────┤   │
│  │         CardGrid / CTA / etc.                    │   │
│  ├─────────────────────────────────────────────────┤   │
│  │              Footer (Prasi)                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Key Files

| File | Description |
|------|-------------|
| `app/srv/api/_dynamic_page.ts` | Dynamic route handler (/_page/*) |
| `app/srv/api/_api_page_save.ts` | Page save API |
| `app/srv/utils/page-builder.ts` | Helper functions |
| `app/srv/components/sections/*.ts` | Section components |
| `app/srv/api/_tpsadmin_pages.ts` | Admin page list |
| `app/srv/api/_tpsadmin_pages_edit.ts` | Admin page editor |

### Section Components (Inline Styles)

**PENTING:** Semua section components menggunakan inline styles, BUKAN Tailwind classes, untuk menghindari CSS conflict dengan Prasi.

| Component | Type | Description |
|-----------|------|-------------|
| `HeroSection` | `hero` | Banner dengan title, subtitle, description (richtext) |
| `ContentSection` | `content` | Rich text content dengan Quill |
| `CardGrid` | `cards` | Grid kartu (needs card items) |
| `CTA` | `cta` | Call to action banner |
| `FAQ` | `faq` | Accordion FAQ |
| `ImageGallery` | `gallery` | Grid gambar |
| `VideoEmbed` | `video` | YouTube/Vimeo embed |
| `Tabs` | `tabs` | Tab content panels |
| `ContactForm` | `form` | Form kontak |

### Database Schema

```sql
-- Page structure
INSERT INTO structure (id, path, title, url_pattern, type, status) VALUES
('uuid', 'page_name', 'Page Title', '/url-pattern', 'page', 'published');

-- Section structure (parent = page id)
INSERT INTO structure (id, path, title, type, parent, depth, sort_idx) VALUES
('uuid', 'page_name.hero', 'Hero Banner', 'hero', 'page-uuid', 1, 0);

-- Field structure (parent = section id)
INSERT INTO structure (id, path, title, type, parent, depth, sort_idx) VALUES
('uuid', 'page_name.hero.title', 'Title', 'text', 'section-uuid', 2, 0),
('uuid', 'page_name.hero.description', 'Description', 'richtext', 'section-uuid', 2, 2);

-- Content values
INSERT INTO content (id, id_structure, lang, status, text) VALUES
('uuid', 'field-uuid', 'id', 'published', 'Content text here');
```

### Header Content (Minimal)

Untuk mencegah text overflow di Prasi header banner, gunakan header_content minimal:

```typescript
const bodyContent = {
  header_content: {
    title: page.title,
    banner: "/_file/layout/header/header-default-bg.png",
    tagline: "",      // KOSONG - tidak overflow
    heading: "",      // KOSONG - tidak overflow
    sub_heading: "",  // KOSONG - tidak overflow
  },
  // ...
};
```

HeroSection di-render langsung di page body dengan inline CSS yang kita kontrol.

### Inline Styles Pattern

```typescript
// ❌ JANGAN gunakan Tailwind classes (conflict dengan Prasi)
return `<section class="bg-white py-12 px-4">...`;

// ✅ GUNAKAN inline styles
const sectionStyle = `
  background: #ffffff;
  padding: 3rem 1rem;
`.trim();

return `<section style="${sectionStyle}">...`;
```

### Field Types untuk Sections

```typescript
const SECTION_FIELDS = {
  hero: [
    { name: "title", title: "Title", type: "text" },
    { name: "subtitle", title: "Subtitle", type: "text" },
    { name: "description", title: "Description", type: "richtext" }, // Quill editor
    { name: "image", title: "Background Image", type: "file" },
    { name: "cta_text", title: "Button Text", type: "text" },
    { name: "cta_url", title: "Button URL", type: "text" },
  ],
  content: [
    { name: "title", title: "Title", type: "text" },
    { name: "content", title: "Content", type: "richtext" },
  ],
  cta: [
    { name: "title", title: "Title", type: "text" },
    { name: "description", title: "Description", type: "textarea" },
    { name: "button_text", title: "Button Text", type: "text" },
    { name: "button_url", title: "Button URL", type: "text" },
  ],
  // ...
};
```

### Page Save API

**Field Key Format:** `field-{uuid}-{lang}`

```typescript
// Parse field key properly (UUID contains dashes!)
const withoutPrefix = key.substring(6); // Remove "field-"
const lastDashIndex = withoutPrefix.lastIndexOf("-");
const fieldId = withoutPrefix.substring(0, lastDashIndex);
const lang = withoutPrefix.substring(lastDashIndex + 1);

// Validate UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(fieldId)) continue;

// Sanitize value (handle objects from form)
if (typeof value === "object") value = "";
```

### Testing Dynamic Pages

```bash
# Access dynamic page
open http://localhost:3300/layanan-kami

# Admin page editor
open http://localhost:3300/backend/tpsadmin/pages

# Run tests
TEST_SESSION_ID="your-session-id" bun test tests/__tests__/dynamic-pages.test.ts
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Text overflow di header banner | Gunakan header_content minimal (tagline, heading, sub_heading kosong) |
| CSS conflict dengan Prasi | Gunakan inline styles, bukan Tailwind classes |
| "Error creating UUID" saat save | Parse field key dengan `lastIndexOf("-")` |
| "Expected String, provided Object" | Sanitize value sebelum save ke database |
| Cards section kosong | Perlu card items (nested content), bukan hanya title/subtitle |

## Admin Sidebar (WordPress-like CMS)

Sidebar navigasi admin yang konsisten di semua halaman, seperti WordPress CMS.

### Features

1. **Semua Struktur Ditampilkan** - 34 struktur konten dalam 14 folder
2. **Collapsible Folders** - Klik folder untuk expand/collapse, state tersimpan di localStorage
3. **Drag & Drop** - Folder bisa di-drag untuk mengubah urutan (tersimpan ke database)
4. **Icon per Kategori** - Setiap folder memiliki icon sesuai kategori
5. **Urutan Berdasarkan Database** - Folder diurutkan berdasarkan `sort_idx`

### Key Files

| File | Description |
|------|-------------|
| `app/srv/components/AdminSidebar.ts` | Shared sidebar component |
| `app/srv/api/_tpsadmin_api_folder_order.ts` | API untuk save folder order |

### Sidebar Structure

```
┌─────────────────────────┐
│ 🏢 TPS Admin            │
├─────────────────────────┤
│ 📊 Dashboard            │
├─────────────────────────┤
│ KELOLA KONTEN           │
│ 📁 Karir (6)            │  ← Collapsible folder
│   └── Karir (3)         │
│   └── Lowongan (3)      │
│ 📁 Berita (397)         │
│ 📁 Home (104)           │
│ ... (14 folders total)  │
│ 📄 About Us - TPS       │  ← Tanpa folder
├─────────────────────────┤
│ PENGATURAN              │
│   Dynamic Pages         │
│   Kelola Folder         │
├─────────────────────────┤
│ ADMINISTRASI            │  ← Superadmin only
│   Kelola User           │
│   Kelola Role           │
└─────────────────────────┘
```

### Usage in Pages

```typescript
import { AdminSidebar, loadSidebarStructures } from "../components/AdminSidebar";

// Load sidebar data
const structures = await loadSidebarStructures();

// Render sidebar
${AdminSidebar({
  activePage: "dashboard", // atau "content", "pages", "folders", "users", "roles"
  user: { username: user.username, role: { name: user.role.name } },
  currentStructureId: structureId, // optional, untuk highlight struktur aktif
  structures,
})}
```

### Collapse/Expand Implementation

```javascript
// State disimpan di data-collapsed attribute
<div id="folder-content-{id}" data-collapsed="false">

// Toggle function
function toggleFolder(folderId, event) {
  var content = document.getElementById('folder-content-' + folderId);
  var isCollapsed = content.dataset.collapsed === 'true';

  if (isCollapsed) {
    content.style.display = 'block';
    content.dataset.collapsed = 'false';
    localStorage.removeItem('sidebar_folder_' + folderId);
  } else {
    content.style.display = 'none';
    content.dataset.collapsed = 'true';
    localStorage.setItem('sidebar_folder_' + folderId, 'collapsed');
  }
}
```

### localStorage Cleanup

Jika ada masalah dengan collapse/expand, script otomatis membersihkan data lama:

```javascript
// One-time cleanup (v2)
var cleanupDone = localStorage.getItem('sidebar_cleanup_v2');
if (!cleanupDone) {
  Object.keys(localStorage).filter(k => k.startsWith('sidebar_folder_')).forEach(k => localStorage.removeItem(k));
  localStorage.setItem('sidebar_cleanup_v2', 'done');
}
```

### Route Redirect

`/backend/tpsadmin` di-redirect ke `/backend/tpsadmin/dashboard` untuk bypass halaman Prasi:

```typescript
// pkgs/server/create.ts
if (url.pathname === "/backend/tpsadmin" || url.pathname === "/backend/tpsadmin/") {
  return new Response(null, {
    status: 302,
    headers: { "Location": "/backend/tpsadmin/dashboard" },
  });
}
```

### Prasi Content Page

Halaman "content" di Prasi (`/backend/tpsadmin`) **tidak lagi dipakai**. Semua admin functionality sudah menggunakan SSR standalone:

| Route | Handler |
|-------|---------|
| `/backend/tpsadmin` | SSR Login Page |
| `/backend/tpsadmin/dashboard` | SSR |
| `/backend/tpsadmin/list/:id` | SSR |
| `/backend/tpsadmin/edit/:id` | SSR |
| `/backend/tpsadmin/add/:id` | SSR |
| `/backend/tpsadmin/folders` | SSR |
| `/backend/tpsadmin/user` | SSR |
| `/backend/tpsadmin/role` | SSR |
| `/backend/tpsadmin/pages` | SSR |

### Event Delegation untuk Sidebar (CRITICAL)

**JANGAN gunakan inline `onclick` handler** untuk sidebar folders. Gunakan event delegation:

```javascript
// ❌ TIDAK RELIABLE di halaman dengan script lain
<button onclick="toggleFolder('${id}', event)">

// ✅ GUNAKAN event delegation
<button data-toggle-folder="${id}" class="folder-toggle-btn">

// JavaScript
folderList.addEventListener('click', function(e) {
  var btn = e.target.closest('.folder-toggle-btn');
  if (!btn) return;
  var folderId = btn.dataset.toggleFolder;
  e.preventDefault();
  e.stopPropagation();
  toggleFolder(folderId);
});
```

**Mengapa?**
- Inline onclick bisa gagal jika ada error di script lain
- Event delegation lebih robust karena hanya perlu satu listener
- `closest()` memastikan click pada child element (icon, span) tetap terdeteksi

### Login/Logout Flow

**Login Page:** `/backend/tpsadmin` (SSR)
- Cek localStorage untuk existing session
- Verifikasi session ke server via `/backend/api/session-check`
- Jika valid, redirect ke dashboard
- Jika tidak valid, clear localStorage dan tampilkan form

**Logout API:** `/backend/api/logout`
- DELETE session dari database `user_session`
- Clear cookie via Set-Cookie header
- Client clear localStorage dan redirect ke login

**Session Check API:** `/backend/api/session-check`
- Verifikasi session ID dari cookie
- Return `{ valid: true/false, user: {...} }`

```javascript
// Logout button (di AdminSidebar)
fetch('/backend/api/logout', { method: 'POST', credentials: 'include' })
  .finally(() => {
    localStorage.removeItem('sid');
    window.location.href = '/backend/tpsadmin';
  });
```

## Throughput Fields (Special Handling)

Form entry untuk Throughput dan Annual Throughput memiliki field khusus dengan UX yang lebih baik.

### Field Types

| Field | Type | UX |
|-------|------|-----|
| Year | Dropdown | 5 tahun ke depan + 5 tahun ke belakang (2020-2030) |
| Month | Dropdown | Nama bulan Indonesia (Januari-Desember) |
| Domestics | Number | Format ribuan (1.234.567) + label "TEUs" |
| International | Number | Format ribuan (1.234.567) + label "TEUs" |

### Implementation

```typescript
// Year dropdown (edit & add page)
if (field.path === "throughput.year" || field.path === "annual_throughput.year" ||
    (fieldName === "year" && field.path.includes("throughput"))) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 5; y >= currentYear - 5; y--) {
    years.push(y);
  }
  // Render dropdown dengan default tahun ini
}

// Number formatting dengan hidden input
<input type="text" id="display-${fieldName}" oninput="formatNumberInput(this)">
<input type="hidden" name="${fieldName}" id="input-${fieldName}">

function formatNumberInput(input) {
  const fieldName = input.dataset.field;
  const hiddenInput = document.getElementById('input-' + fieldName);
  let value = input.value.replace(/[^\d]/g, '');
  hiddenInput.value = value; // Raw value untuk save
  if (value) {
    input.value = parseInt(value).toLocaleString('id-ID'); // Formatted display
  }
}
```

### List Page Display

```typescript
// Month: tampilkan nama bulan
if (fieldName === "month") {
  const monthNames = ["Januari", "Februari", ...];
  return `<span class="badge">${monthNames[value - 1]}</span>`;
}

// Numbers: format ribuan
if (field.type === "number" || fieldName === "domestics" || fieldName === "international") {
  return `<span class="font-mono">${num.toLocaleString("id-ID")}</span>`;
}
```

## Known Issues & Fixes

### Berita Pagination Bug (Fixed Dec 2025)

**Issue:** Pagination on berita landing page (`/berita/press-release?page=X`) not working - all pages showed same content.

**Root Cause:** Hardcoded pagination in `tps-fw/server/data/content/news/news.ts`:
```typescript
// BUG - ignores skip/take parameters
paging: { skip: 0, take: 5 }

// FIX - uses function parameters
paging: { skip, take }
```

**Fix Applied To:**
1. Source: `tps-fw/server/data/content/news/news.ts`
2. Bundle: `tps-core/tps/app/web/deploy/1766335010850.gz`

**Unit Tests:** `app/srv/tests/_berita.test.ts` (11 tests)

### File Upload Bug (Fixed Feb 2026)

**Issue:** File upload di admin edit page (`/backend/tpsadmin/edit/:id`) tidak berfungsi. Uploaded file tidak tersimpan.

**Root Causes (3 bugs):**

1. **Frontend mengirim raw File, bukan FormData** (`_tpsadmin_edit.ts:1002`)
   ```javascript
   // BUG - raw file, multipart parser gagal
   body: file
   // FIX - FormData dengan boundary
   body: formData
   ```

2. **Upload directory creation gagal** (`pkgs/api/_upload.ts:56-58`)
   ```typescript
   // BUG - relative path + logika terbalik (create only if exists)
   if (await existsAsync(dirname(to))) { dirAsync(dirname(to)); }
   // FIX - absolute path, selalu create
   const fullPath = dir(`${g.datadir}/files/${to}`);
   await dirAsync(dirname(fullPath));
   ```

3. **`location.reload()` setelah upload menghapus file path** (`_tpsadmin_edit.ts:1010`)
   - Sebelum: upload → set hidden input → reload (path hilang, belum di-save)
   - Sesudah: upload → set hidden input → update preview di DOM → user klik Simpan

**Files Changed:**
- `tps-core/tps/app/srv/api/_tpsadmin_edit.ts`
- `tps-core/tps/pkgs/api/_upload.ts`

### File URL /file/* vs /_file/* (Fixed Feb 2026)

**Issue:** Halaman Prasi legacy (unduh-dokumen) generate URL `/file/media/...` tapi endpoint server hanya handle `/_file/...`.

**Fix:** Redirect 301 di `pkgs/server/create.ts`:
```typescript
if (url.pathname.startsWith("/file/")) {
  const newPath = "/_file/" + url.pathname.substring(6);
  return Response.redirect(new URL(newPath + url.search, url.origin).toString(), 301);
}
```

### Prisma Init Crash (Fixed Feb 2026)

**Issue:** Semua halaman Prasi legacy error `db.config is undefined` karena `global.db` tidak ter-set.

**Root Cause:** `prisma generate` gagal (bug Prisma 5.11.0 schema parser) dan karena generate + import PrismaClient dalam satu try-catch, kegagalan generate menyebabkan import juga di-skip.

**Fix:** Pisahkan ke dua try-catch terpisah di `pkgs/utils/prisma.ts`:
```typescript
// Try generate (non-fatal)
try { await $(...)`bun prisma generate`; }
catch (e) { console.log("Using existing client"); }

// Import client (independent)
try { g.db = new PrismaClient(); }
catch (e) { console.log("Prisma not initialized"); }
```

**PENTING:** Jangan upgrade Prisma tanpa testing `prisma generate` dulu — versi 5.11.0 punya bug schema parser.
