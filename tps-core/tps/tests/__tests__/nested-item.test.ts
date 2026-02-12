/**
 * Unit Tests for Nested Item API
 * Tests CRUD operations for nested/repeater items
 *
 * Run with: bun test app/srv/api/__tests__/nested-item.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test";

// Test configuration
const BASE_URL = "http://localhost:3300";

// Test data
const TEST_PARENT_ID = "c69381cb-decc-46e9-a740-d4aae226968f"; // Tata Kelola GCG content
const TEST_STRUCTURE_ID = "6c2ff1ca-9482-46ad-b7ca-89acd4ed500a"; // Items structure

// Get session cookie from environment or use a test session
const getTestSessionCookie = async (): Promise<string> => {
  // Try to login and get a valid session
  // For testing purposes, we'll assume a session exists
  // In real tests, you'd set up proper authentication
  const sessionId = process.env.TEST_SESSION_ID || "";
  return `sid=${sessionId}`;
};

describe("Nested Item API", () => {
  let sessionCookie: string;
  let createdItemId: string | null = null;

  beforeAll(async () => {
    sessionCookie = await getTestSessionCookie();
  });

  afterAll(async () => {
    // Cleanup: delete created test item if exists
    if (createdItemId) {
      try {
        await fetch(`${BASE_URL}/backend/api/nested-item`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie,
          },
          body: JSON.stringify({
            action: "delete",
            itemId: createdItemId,
          }),
        });
      } catch (e) {
        console.log("Cleanup error:", e);
      }
    }
  });

  describe("Authentication", () => {
    it("should reject requests without session", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          parentId: TEST_PARENT_ID,
          structureId: TEST_STRUCTURE_ID,
        }),
      });

      const result = await res.json();
      expect(result.status).toBe("error");
      expect(result.message).toBe("Unauthorized");
    });

    it("should reject invalid session", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "sid=invalid-session-id",
        },
        body: JSON.stringify({
          action: "create",
          parentId: TEST_PARENT_ID,
          structureId: TEST_STRUCTURE_ID,
        }),
      });

      const result = await res.json();
      expect(result.status).toBe("error");
      expect(result.message).toBe("Unauthorized");
    });

    it("should reject GET method", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "GET",
        headers: { Cookie: sessionCookie },
      });

      const result = await res.json();
      expect(result.status).toBe("error");
      expect(result.message).toBe("Method not allowed");
    });
  });

  describe("Create Operation", () => {
    it("should fail without parentId", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          action: "create",
          structureId: TEST_STRUCTURE_ID,
        }),
      });

      const result = await res.json();
      expect(result.status).toBe("error");
      expect(result.message).toContain("Missing");
    });

    it("should fail without structureId", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          action: "create",
          parentId: TEST_PARENT_ID,
        }),
      });

      const result = await res.json();
      expect(result.status).toBe("error");
      expect(result.message).toContain("Missing");
    });

    it("should fail with invalid parentId", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          action: "create",
          parentId: "00000000-0000-0000-0000-000000000000",
          structureId: TEST_STRUCTURE_ID,
        }),
      });

      const result = await res.json();
      expect(result.status).toBe("error");
      expect(result.message).toContain("not found");
    });

    it("should create a nested item successfully", async () => {
      // Skip if no valid session
      if (!sessionCookie || sessionCookie === "sid=") {
        console.log("Skipping: No valid session");
        return;
      }

      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          action: "create",
          parentId: TEST_PARENT_ID,
          structureId: TEST_STRUCTURE_ID,
        }),
      });

      const result = await res.json();

      if (result.status === "error" && result.message === "Unauthorized") {
        console.log("Skipping: Unauthorized (need valid session)");
        return;
      }

      expect(result.status).toBe("ok");
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("string");
      expect(result.id.length).toBe(36); // UUID length

      // Save for cleanup
      createdItemId = result.id;
    });
  });

  describe("Delete Operation", () => {
    it("should fail without itemId", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          action: "delete",
        }),
      });

      const result = await res.json();
      expect(result.status).toBe("error");
      expect(result.message).toContain("Missing");
    });

    it("should fail with non-existent itemId", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          action: "delete",
          itemId: "00000000-0000-0000-0000-000000000000",
        }),
      });

      const result = await res.json();
      expect(result.status).toBe("error");
      expect(result.message).toContain("not found");
    });

    it("should delete a nested item successfully", async () => {
      // Skip if no created item
      if (!createdItemId) {
        console.log("Skipping: No item to delete");
        return;
      }

      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          action: "delete",
          itemId: createdItemId,
        }),
      });

      const result = await res.json();

      if (result.status === "error" && result.message === "Unauthorized") {
        console.log("Skipping: Unauthorized (need valid session)");
        return;
      }

      expect(result.status).toBe("ok");

      // Clear so cleanup doesn't try to delete again
      createdItemId = null;
    });
  });

  describe("Invalid Action", () => {
    it("should fail with invalid action", async () => {
      const res = await fetch(`${BASE_URL}/backend/api/nested-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          action: "invalid",
        }),
      });

      const result = await res.json();
      expect(result.status).toBe("error");
      expect(result.message).toContain("Invalid action");
    });
  });
});

// Integration test for full CRUD cycle
describe("Nested Item CRUD Integration", () => {
  const sessionCookie = `sid=${process.env.TEST_SESSION_ID || ""}`;

  it("should complete full CRUD cycle", async () => {
    // Skip if no valid session
    if (!process.env.TEST_SESSION_ID) {
      console.log("Skipping integration test: No TEST_SESSION_ID set");
      console.log("To run: TEST_SESSION_ID=your-session-id bun test");
      return;
    }

    // 1. CREATE
    const createRes = await fetch(`${BASE_URL}/backend/api/nested-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "create",
        parentId: TEST_PARENT_ID,
        structureId: TEST_STRUCTURE_ID,
      }),
    });

    const createResult = await createRes.json();
    expect(createResult.status).toBe("ok");
    const itemId = createResult.id;

    // 2. Verify item exists by checking edit page loads
    const editRes = await fetch(
      `${BASE_URL}/backend/tpsadmin/edit/${itemId}`,
      {
        headers: { Cookie: sessionCookie },
      }
    );
    expect(editRes.status).toBe(200);
    const editHtml = await editRes.text();
    expect(editHtml).toContain("TPS Admin");

    // 3. DELETE
    const deleteRes = await fetch(`${BASE_URL}/backend/api/nested-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "delete",
        itemId: itemId,
      }),
    });

    const deleteResult = await deleteRes.json();
    expect(deleteResult.status).toBe("ok");

    // 4. Verify item is deleted
    const verifyRes = await fetch(
      `${BASE_URL}/backend/tpsadmin/edit/${itemId}`,
      {
        headers: { Cookie: sessionCookie },
      }
    );
    expect(verifyRes.status).toBe(404);
  });
});
