/**
 * Dynamic Pages System - Integration Tests
 *
 * Tests the dynamic page builder system including:
 * - Admin page management UI
 * - Page CRUD APIs
 * - Dynamic page rendering
 * - Section components
 *
 * Requires a running server on localhost:3300 and valid session.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";

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

// Test data - will be populated during tests
let createdPageId: string | null = null;
let createdSectionId: string | null = null;

describe("Dynamic Pages Admin", () => {
  describe("Pages List", () => {
    it("should load pages list page", async () => {
      const res = await fetchWithSession("/backend/tpsadmin/pages");
      expect(res.status).toBe(200);

      const html = await res.text();
      expect(isValidHtml(html)).toBe(true);
      expect(html).toContain("Dynamic Pages");
    });

    it("should show add page button", async () => {
      const res = await fetchWithSession("/backend/tpsadmin/pages");
      const html = await res.text();

      // Button text is "Tambah Halaman" in Indonesian
      expect(html.includes("Add Page") || html.includes("Tambah Halaman")).toBe(true);
    });

    it("should redirect to login if not authenticated", async () => {
      const res = await fetch(`${BASE_URL}/backend/tpsadmin/pages`);
      const html = await res.text();

      // Should have redirect script or login redirect
      expect(
        html.includes("localStorage.getItem") ||
        html.includes("Redirecting") ||
        html.includes("/backend/login")
      ).toBe(true);
    });
  });

  describe("Page Editor - Add", () => {
    it("should load add page form", async () => {
      const res = await fetchWithSession("/backend/tpsadmin/pages/add");
      expect(res.status).toBe(200);

      const html = await res.text();
      expect(isValidHtml(html)).toBe(true);
      // Check for page title or form content
      expect(html.includes("New Page") || html.includes("Halaman Baru") || html.includes("page-form")).toBe(true);
    });

    it("should have title and URL fields", async () => {
      const res = await fetchWithSession("/backend/tpsadmin/pages/add");
      const html = await res.text();

      // Should have form fields for title and URL
      expect(html.includes("title") || html.includes("Title")).toBe(true);
      expect(html.includes("url") || html.includes("URL") || html.includes("url_pattern")).toBe(true);
    });

    it("should have section type selector", async () => {
      const res = await fetchWithSession("/backend/tpsadmin/pages/add");
      const html = await res.text();

      // Should have section type options
      expect(
        html.includes("hero") ||
        html.includes("content") ||
        html.includes("Add Section") ||
        html.includes("Tambah Section")
      ).toBe(true);
    });
  });
});

describe("Page Save API", () => {
  it("should require authentication", async () => {
    const res = await fetch(`${BASE_URL}/backend/api/page-save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Page", url_pattern: "/test" }),
    });

    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.message).toContain("Unauthorized");
  });

  it("should require title and url_pattern", async () => {
    const res = await fetchWithSession("/backend/api/page-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Only Title" }),
    });

    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.message).toContain("required");
  });

  it("should create a new page", async () => {
    const timestamp = Date.now();
    const res = await fetchWithSession("/backend/api/page-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Test Dynamic Page ${timestamp}`,
        url_pattern: `/test-dynamic-page-${timestamp}`,
        status: "draft",
      }),
    });

    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.pageId).toBeTruthy();

    // Save for cleanup
    createdPageId = json.pageId;
  });

  it("should update an existing page", async () => {
    if (!createdPageId) {
      console.log("Skipping - no page created");
      return;
    }

    const timestamp = Date.now();
    const res = await fetchWithSession("/backend/api/page-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: createdPageId,
        title: `Test Dynamic Page Updated ${timestamp}`,
        url_pattern: `/test-dynamic-page-updated-${timestamp}`,
        status: "published",
      }),
    });

    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  it("should reject duplicate URL patterns", async () => {
    if (!createdPageId) {
      console.log("Skipping - no page created");
      return;
    }

    // Get the current page's URL pattern
    const timestamp = Date.now();
    // First create a page
    const firstRes = await fetchWithSession("/backend/api/page-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Duplicate Test ${timestamp}`,
        url_pattern: `/duplicate-test-${timestamp}`,
      }),
    });
    const firstJson = await firstRes.json();

    // Try to create another with the same URL
    const res = await fetchWithSession("/backend/api/page-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Another Page",
        url_pattern: `/duplicate-test-${timestamp}`,
      }),
    });

    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.message).toContain("already exists");

    // Cleanup
    if (firstJson.pageId) {
      await fetchWithSession("/backend/api/page-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: firstJson.pageId }),
      });
    }
  });
});

describe("Page Section API", () => {
  it("should require authentication", async () => {
    const res = await fetch(`${BASE_URL}/backend/api/page-section`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add" }),
    });

    const json = await res.json();
    expect(json.status).toBe("error");
  });

  it("should require action parameter", async () => {
    const res = await fetchWithSession("/backend/api/page-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const json = await res.json();
    expect(json.status).toBe("error");
  });

  it("should add a section to a page", async () => {
    if (!createdPageId) {
      console.log("Skipping - no page created");
      return;
    }

    const res = await fetchWithSession("/backend/api/page-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        pageId: createdPageId,
        type: "hero",
        title: "Hero Section",
      }),
    });

    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.sectionId).toBeTruthy();

    createdSectionId = json.sectionId;
  });

  it("should require pageId, type, and title for add action", async () => {
    const res = await fetchWithSession("/backend/api/page-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        pageId: createdPageId,
        // missing type and title
      }),
    });

    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.message).toContain("required");
  });

  it("should delete a section", async () => {
    if (!createdSectionId) {
      console.log("Skipping - no section created");
      return;
    }

    const res = await fetchWithSession("/backend/api/page-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        sectionId: createdSectionId,
      }),
    });

    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  it("should reorder sections", async () => {
    const res = await fetchWithSession("/backend/api/page-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reorder",
        order: [], // Empty array is valid
      }),
    });

    const json = await res.json();
    expect(json.status).toBe("ok");
  });
});

describe("Page Delete API", () => {
  it("should require authentication", async () => {
    const res = await fetch(`${BASE_URL}/backend/api/page-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "test" }),
    });

    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.message).toContain("Unauthorized");
  });

  it("should require page ID", async () => {
    const res = await fetchWithSession("/backend/api/page-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.message).toContain("required");
  });

  it("should delete the test page", async () => {
    if (!createdPageId) {
      console.log("Skipping - no page to delete");
      return;
    }

    const res = await fetchWithSession("/backend/api/page-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: createdPageId }),
    });

    const json = await res.json();
    expect(json.status).toBe("ok");

    createdPageId = null;
  });
});

describe("Dynamic Page Rendering", () => {
  let testPageId: string | null = null;

  beforeAll(async () => {
    // Create a test page for rendering tests
    const res = await fetchWithSession("/backend/api/page-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Render Test Page",
        url_pattern: "/render-test-page",
        status: "published",
      }),
    });

    const json = await res.json();
    if (json.status === "ok") {
      testPageId = json.pageId;
    }
  });

  afterAll(async () => {
    // Cleanup test page
    if (testPageId) {
      await fetchWithSession("/backend/api/page-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testPageId }),
      });
    }
  });

  it("should render a dynamic page", async () => {
    if (!testPageId) {
      console.log("Skipping - no test page created");
      return;
    }

    const res = await fetch(`${BASE_URL}/render-test-page`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(isValidHtml(html)).toBe(true);
    expect(html).toContain("Render Test Page");
  });

  it("should return 404 for non-existent page", async () => {
    const res = await fetch(`${BASE_URL}/non-existent-page-xyz123`);
    expect(res.status).toBe(404);
  });

  it("should include header and footer data for Prasi renderer", async () => {
    if (!testPageId) {
      console.log("Skipping - no test page created");
      return;
    }

    const res = await fetch(`${BASE_URL}/render-test-page`);
    const html = await res.text();

    // Should have Prasi header data
    expect(html).toContain("window.___header");

    // Should have Prasi footer data
    expect(html).toContain("window.___footer");

    // Should have main.js for Prasi renderer
    expect(html).toContain("main.js");
  });

  it("should support language parameter", async () => {
    if (!testPageId) {
      console.log("Skipping - no test page created");
      return;
    }

    // With cookie
    const resWithCookie = await fetch(`${BASE_URL}/render-test-page`, {
      headers: { Cookie: "lang=en" },
    });
    expect(resWithCookie.status).toBe(200);
  });
});

describe("Section Components", () => {
  // These tests verify that section components render correctly
  // by creating pages with different section types

  let pageWithSections: string | null = null;
  const sectionIds: string[] = [];

  beforeAll(async () => {
    // Create a page with various sections
    const pageRes = await fetchWithSession("/backend/api/page-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Section Test Page",
        url_pattern: "/section-test-page",
        status: "published",
      }),
    });

    const pageJson = await pageRes.json();
    if (pageJson.status === "ok") {
      pageWithSections = pageJson.pageId;

      // Add various section types
      const sectionTypes = ["hero", "content", "cards", "faq", "cta"];

      for (const type of sectionTypes) {
        const sectionRes = await fetchWithSession("/backend/api/page-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            pageId: pageWithSections,
            type,
            title: `Test ${type} Section`,
          }),
        });

        const sectionJson = await sectionRes.json();
        if (sectionJson.sectionId) {
          sectionIds.push(sectionJson.sectionId);
        }
      }
    }
  });

  afterAll(async () => {
    // Cleanup
    if (pageWithSections) {
      await fetchWithSession("/backend/api/page-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pageWithSections }),
      });
    }
  });

  it("should render page with multiple sections", async () => {
    if (!pageWithSections) {
      console.log("Skipping - no test page created");
      return;
    }

    const res = await fetch(`${BASE_URL}/section-test-page`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(isValidHtml(html)).toBe(true);
    expect(html).toContain("Section Test Page");
  });

  it("should use hero data for Prasi header banner", async () => {
    if (!pageWithSections) return;

    const res = await fetch(`${BASE_URL}/section-test-page`);
    const html = await res.text();

    // Hero data is now used for header_content (Prasi's page header banner)
    // instead of being rendered in the body, so check for header_content
    expect(html).toContain("header_content");
    expect(html).toContain("Section Test Page"); // Page title in header
  });
});

describe("Page Editor - Edit Existing", () => {
  let editTestPageId: string | null = null;

  beforeAll(async () => {
    // Create a page for edit testing
    const res = await fetchWithSession("/backend/api/page-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Edit Test Page",
        url_pattern: "/edit-test-page",
        status: "draft",
      }),
    });

    const json = await res.json();
    if (json.status === "ok") {
      editTestPageId = json.pageId;
    }
  });

  afterAll(async () => {
    if (editTestPageId) {
      await fetchWithSession("/backend/api/page-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTestPageId }),
      });
    }
  });

  it("should load edit page for existing page", async () => {
    if (!editTestPageId) {
      console.log("Skipping - no page created");
      return;
    }

    const res = await fetchWithSession(
      `/backend/tpsadmin/pages/edit/${editTestPageId}`
    );
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(isValidHtml(html)).toBe(true);
    expect(html).toContain("Edit Test Page");
  });

  it("should show existing page data in form", async () => {
    if (!editTestPageId) return;

    const res = await fetchWithSession(
      `/backend/tpsadmin/pages/edit/${editTestPageId}`
    );
    const html = await res.text();

    expect(html).toContain("Edit Test Page");
    expect(html).toContain("/edit-test-page");
  });

  it("should have tabs for Edit, Settings, Preview", async () => {
    if (!editTestPageId) return;

    const res = await fetchWithSession(
      `/backend/tpsadmin/pages/edit/${editTestPageId}`
    );
    const html = await res.text();

    expect(html.includes("Edit") || html.includes("Content")).toBe(true);
    expect(html.includes("Settings") || html.includes("Pengaturan")).toBe(true);
    expect(html.includes("Preview") || html.includes("Pratinjau")).toBe(true);
  });

  it("should return 404 for non-existent page", async () => {
    const res = await fetchWithSession(
      "/backend/tpsadmin/pages/edit/00000000-0000-0000-0000-000000000000"
    );
    expect(res.status).toBe(404);
  });
});

describe("Performance Tests", () => {
  it("should load pages list in under 2 seconds", async () => {
    const start = Date.now();
    await fetchWithSession("/backend/tpsadmin/pages");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });

  it("should load page editor in under 2 seconds", async () => {
    const start = Date.now();
    await fetchWithSession("/backend/tpsadmin/pages/add");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });

  it("should save page in under 3 seconds", async () => {
    const start = Date.now();

    const res = await fetchWithSession("/backend/api/page-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Performance Test Page",
        url_pattern: "/perf-test-page",
        status: "draft",
      }),
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);

    // Cleanup
    const json = await res.json();
    if (json.pageId) {
      await fetchWithSession("/backend/api/page-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: json.pageId }),
      });
    }
  });
});
