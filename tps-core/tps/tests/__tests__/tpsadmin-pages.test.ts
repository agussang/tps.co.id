/**
 * TPS Admin Pages - Integration Tests
 *
 * Tests all SSR admin pages for correct rendering and functionality.
 * Requires a running server on localhost:3300 and valid session.
 */

import { describe, it, expect, beforeAll } from "bun:test";

const BASE_URL = "http://localhost:3300";

// Get session ID from environment or use test session
const getSessionCookie = () => {
  const sessionId = process.env.TEST_SESSION_ID || "";
  return `sid=${sessionId}`;
};

// Helper to make authenticated requests
const fetchWithSession = async (path: string, options: RequestInit = {}) => {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: getSessionCookie(),
    },
  });
};

// Helper to check if response is valid HTML
const isValidHtml = (html: string): boolean => {
  return html.includes("<!DOCTYPE html>") || html.includes("<html");
};

// Test data - structure IDs from the database
const TEST_DATA = {
  structures: {
    berita: "150394f8-16bf-4748-8933-a087515d4231",
    layanan: "78e29788-9d87-424e-bdac-927ea2a19c59",
  },
  nestedStructures: {
    flow: "6c2ff1ca-9482-46ad-b7ca-89acd4ed500a",
    istilah: "4a04252e-5a11-47e9-8990-c79bb7f2464a",
  },
};

describe("TPS Admin Pages", () => {
  let contentId: string;
  let layananContentId: string;

  beforeAll(async () => {
    // Skip if no session
    if (!process.env.TEST_SESSION_ID) {
      console.log("Skipping tests - no TEST_SESSION_ID provided");
      return;
    }

    // Get a content ID from berita for testing
    const listRes = await fetchWithSession(
      `/backend/tpsadmin/list/${TEST_DATA.structures.berita}`
    );
    const html = await listRes.text();
    const match = html.match(/data-id="([^"]+)"/);
    if (match) {
      contentId = match[1];
    }

    // Get a content ID from layanan for nested testing
    const layananRes = await fetchWithSession(
      `/backend/tpsadmin/list/${TEST_DATA.structures.layanan}`
    );
    const layananHtml = await layananRes.text();
    const layananMatch = layananHtml.match(/data-id="([^"]+)"/);
    if (layananMatch) {
      layananContentId = layananMatch[1];
    }
  });

  describe("Dashboard", () => {
    it("should load dashboard page", async () => {
      const res = await fetchWithSession("/backend/tpsadmin/dashboard");
      expect(res.status).toBe(200);

      const html = await res.text();
      expect(isValidHtml(html)).toBe(true);
      expect(html).toContain("Dashboard - TPS Admin");
    });

    it("should show stats cards", async () => {
      const res = await fetchWithSession("/backend/tpsadmin/dashboard");
      const html = await res.text();

      // Should have stats section (Konten Indonesia / Content English)
      expect(html).toContain("Konten Indonesia");
      expect(html).toContain("Content English");
    });

    it("should redirect to login if not authenticated", async () => {
      const res = await fetch(`${BASE_URL}/backend/tpsadmin/dashboard`);
      const html = await res.text();

      // Should have redirect script or login redirect
      expect(
        html.includes("localStorage.getItem") ||
        html.includes("Redirecting")
      ).toBe(true);
    });
  });

  describe("List Page", () => {
    it("should load list page for berita structure", async () => {
      const res = await fetchWithSession(
        `/backend/tpsadmin/list/${TEST_DATA.structures.berita}`
      );
      expect(res.status).toBe(200);

      const html = await res.text();
      expect(isValidHtml(html)).toBe(true);
      expect(html).toContain("TPS Admin");
    });

    it("should load list page for layanan structure", async () => {
      const res = await fetchWithSession(
        `/backend/tpsadmin/list/${TEST_DATA.structures.layanan}`
      );
      expect(res.status).toBe(200);

      const html = await res.text();
      expect(isValidHtml(html)).toBe(true);
    });

    it("should show table with content items", async () => {
      const res = await fetchWithSession(
        `/backend/tpsadmin/list/${TEST_DATA.structures.berita}`
      );
      const html = await res.text();

      // Should have table structure
      expect(html).toContain("<table");
      expect(html).toContain("table-row");
    });

    it("should show nested item counts for layanan", async () => {
      const res = await fetchWithSession(
        `/backend/tpsadmin/list/${TEST_DATA.structures.layanan}`
      );
      const html = await res.text();

      // Should show nested counts (not full items)
      expect(html).toContain("items</span>");
      expect(html).toContain("Kelola");
    });

    it("should return error for invalid structure ID", async () => {
      const res = await fetchWithSession(
        "/backend/tpsadmin/list/invalid-uuid-here"
      );
      // May return 404 or 500 depending on how it handles invalid UUIDs
      expect([404, 500]).toContain(res.status);
    });

    it("should support status filter", async () => {
      const res = await fetchWithSession(
        `/backend/tpsadmin/list/${TEST_DATA.structures.berita}?status=published`
      );
      expect(res.status).toBe(200);
    });

    it("should support language filter", async () => {
      const res = await fetchWithSession(
        `/backend/tpsadmin/list/${TEST_DATA.structures.berita}?lang=id`
      );
      expect(res.status).toBe(200);
    });

    it("should support pagination", async () => {
      const res = await fetchWithSession(
        `/backend/tpsadmin/list/${TEST_DATA.structures.berita}?page=1`
      );
      expect(res.status).toBe(200);
    });
  });

  describe("Edit Page", () => {
    it("should load edit page for valid content", async () => {
      if (!contentId) {
        console.log("Skipping - no content ID available");
        return;
      }

      const res = await fetchWithSession(`/backend/tpsadmin/edit/${contentId}`);
      expect(res.status).toBe(200);

      const html = await res.text();
      expect(isValidHtml(html)).toBe(true);
      expect(html).toContain("TPS Admin");
    });

    it("should include Quill editor", async () => {
      if (!contentId) return;

      const res = await fetchWithSession(`/backend/tpsadmin/edit/${contentId}`);
      const html = await res.text();

      // Should have Quill CDN
      expect(html).toContain("quill");
    });

    it("should show form fields", async () => {
      if (!contentId) return;

      const res = await fetchWithSession(`/backend/tpsadmin/edit/${contentId}`);
      const html = await res.text();

      // Should have form elements
      expect(html).toContain("<form");
      // Save button can be "Save" or "Simpan"
      expect(html.includes("Save") || html.includes("Simpan")).toBe(true);
    });

    it("should return 404 for invalid content ID", async () => {
      const res = await fetchWithSession(
        "/backend/tpsadmin/edit/00000000-0000-0000-0000-000000000000"
      );
      expect(res.status).toBe(404);
    });
  });

  describe("Add Page", () => {
    it("should load add page for valid structure", async () => {
      const res = await fetchWithSession(
        `/backend/tpsadmin/add/${TEST_DATA.structures.berita}`
      );
      expect(res.status).toBe(200);

      const html = await res.text();
      expect(isValidHtml(html)).toBe(true);
    });

    it("should show empty form for new content", async () => {
      const res = await fetchWithSession(
        `/backend/tpsadmin/add/${TEST_DATA.structures.berita}`
      );
      const html = await res.text();

      // Should have form
      expect(html).toContain("<form") || expect(html).toContain("Simpan");
    });

    it("should return 404 for invalid structure", async () => {
      const res = await fetchWithSession(
        "/backend/tpsadmin/add/00000000-0000-0000-0000-000000000000"
      );
      expect(res.status).toBe(404);
    });
  });

  describe("Nested Management Page", () => {
    it("should load nested page for layanan flow", async () => {
      if (!layananContentId) {
        console.log("Skipping - no layanan content ID available");
        return;
      }

      const res = await fetchWithSession(
        `/backend/tpsadmin/nested/${layananContentId}/${TEST_DATA.nestedStructures.flow}`
      );
      expect(res.status).toBe(200);

      const html = await res.text();
      expect(isValidHtml(html)).toBe(true);
    });

    it("should show nested items list", async () => {
      if (!layananContentId) return;

      const res = await fetchWithSession(
        `/backend/tpsadmin/nested/${layananContentId}/${TEST_DATA.nestedStructures.flow}`
      );
      const html = await res.text();

      // Should have nested items section
      expect(html).toContain("nested-item") || expect(html).toContain("Add Item");
    });

    it("should have add and delete buttons", async () => {
      if (!layananContentId) return;

      const res = await fetchWithSession(
        `/backend/tpsadmin/nested/${layananContentId}/${TEST_DATA.nestedStructures.flow}`
      );
      const html = await res.text();

      // Should have action buttons (Add Item or Tambah)
      expect(html.includes("Add") || html.includes("Tambah")).toBe(true);
    });
  });

  describe("Folders Page", () => {
    it("should load folders management page", async () => {
      const res = await fetchWithSession("/backend/tpsadmin/folders");
      expect(res.status).toBe(200);

      const html = await res.text();
      expect(isValidHtml(html)).toBe(true);
      expect(html).toContain("Folder");
    });

    it("should show folder list", async () => {
      const res = await fetchWithSession("/backend/tpsadmin/folders");
      const html = await res.text();

      // Should have folder management UI
      expect(html).toContain("folder") || expect(html).toContain("Folder");
    });
  });
});

describe("TPS Admin APIs", () => {
  describe("Content Save API", () => {
    it("should require authentication", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/content-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "test" }),
      });

      // Should be unauthorized (401) or error (500) without session
      expect([401, 500]).toContain(res.status);
    });

    it("should reject invalid requests", async () => {
      const res = await fetchWithSession("/backend/api/content-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      expect(json.status).toBe("error");
    });
  });

  describe("Nested Item API", () => {
    it("should require authentication", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });

      expect(res.status).toBe(401);
    });

    it("should reject GET requests", async () => {
      const res = await fetchWithSession("/backend/api/nested-item");
      expect(res.status).toBe(405);
    });

    it("should require action parameter", async () => {
      const res = await fetchWithSession("/backend/api/nested-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      expect(json.status).toBe("error");
    });

    it("should require parentId and structureId for create", async () => {
      const res = await fetchWithSession("/backend/api/nested-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });

      const json = await res.json();
      expect(json.status).toBe("error");
      expect(json.message).toContain("Missing");
    });

    it("should require itemId for delete", async () => {
      const res = await fetchWithSession("/backend/api/nested-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });

      const json = await res.json();
      expect(json.status).toBe("error");
      expect(json.message).toContain("Missing");
    });
  });

  describe("Folder Save API", () => {
    it("should require authentication", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/folder-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test" }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("Folder Delete API", () => {
    it("should require authentication", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/folder-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "test" }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("Content Delete API", () => {
    it("should require authentication", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/content-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "test" }),
      });

      expect(res.status).toBe(401);
    });

    it("should reject non-POST methods", async () => {
      const res = await fetchWithSession("/backend/api/content-delete");
      expect(res.status).toBe(405);
    });

    it("should validate ID format", async () => {
      const res = await fetchWithSession("/backend/api/content-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "invalid-id" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain("Invalid ID format");
    });

    it("should return 404 for non-existent content", async () => {
      const res = await fetchWithSession("/backend/api/content-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "00000000-0000-0000-0000-000000000000" }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.message).toContain("Content not found");
    });
  });
});

describe("User Management", () => {
  it("should load user management page", async () => {
    const res = await fetchWithSession("/backend/tpsadmin/user");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("Kelola User");
  });

  it("should show user table", async () => {
    const res = await fetchWithSession("/backend/tpsadmin/user");
    const html = await res.text();

    expect(html).toContain("<table");
    expect(html).toContain("Username");
    expect(html).toContain("Role");
  });

  it("should require authentication for user API", async () => {
    const res = await fetch(`${BASE_URL}/backend/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test" }),
    });

    expect(res.status).toBe(401);
  });

  it("should require authentication for user delete API", async () => {
    const res = await fetch(`${BASE_URL}/backend/api/user-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1 }),
    });

    expect(res.status).toBe(401);
  });
});

describe("Role Management", () => {
  it("should load role management page", async () => {
    const res = await fetchWithSession("/backend/tpsadmin/role");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("Kelola Role");
  });

  it("should show role table", async () => {
    const res = await fetchWithSession("/backend/tpsadmin/role");
    const html = await res.text();

    expect(html).toContain("<table");
    expect(html).toContain("Nama Role");
    expect(html).toContain("Can Publish");
  });

  it("should require authentication for role API", async () => {
    const res = await fetch(`${BASE_URL}/backend/api/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }),
    });

    expect(res.status).toBe(401);
  });

  it("should require authentication for role delete API", async () => {
    const res = await fetch(`${BASE_URL}/backend/api/role-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1 }),
    });

    expect(res.status).toBe(401);
  });

  it("should require authentication for role menu API", async () => {
    const res = await fetch(`${BASE_URL}/backend/api/role-menu?roleId=1`);
    expect(res.status).toBe(401);
  });
});

describe("Performance Tests", () => {
  it("should load dashboard in under 2 seconds", async () => {
    const start = Date.now();
    await fetchWithSession("/backend/tpsadmin/dashboard");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });

  it("should load list page in under 3 seconds", async () => {
    const start = Date.now();
    await fetchWithSession(
      `/backend/tpsadmin/list/${TEST_DATA.structures.berita}`
    );
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
  });

  it("should load layanan list (with nested) in under 5 seconds", async () => {
    const start = Date.now();
    await fetchWithSession(
      `/backend/tpsadmin/list/${TEST_DATA.structures.layanan}`
    );
    const elapsed = Date.now() - start;

    // Should be fast now with count optimization
    expect(elapsed).toBeLessThan(5000);
  });
});
