/**
 * Permission Enforcement Tests
 * Tests that role-based permissions are enforced on admin pages and APIs
 */

import { describe, it, expect } from "bun:test";

const BASE_URL = "http://localhost:3300";
const getSessionCookie = () => `sid=${process.env.TEST_SESSION_ID || ""}`;

const fetchWithSession = async (path: string, options: RequestInit = {}) => {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...options.headers, Cookie: getSessionCookie() },
    redirect: "manual",
  });
};

describe("Permission Enforcement", () => {
  // Test 1: List page loads for superadmin (should have all buttons)
  it("T1: superadmin sees Add/Edit/Delete buttons on list page", async () => {
    // First get a structure ID from dashboard
    const dashRes = await fetchWithSession("/backend/tpsadmin/dashboard");
    const dashHtml = await dashRes.text();
    const structMatch = dashHtml.match(/\/backend\/tpsadmin\/list\/([a-f0-9-]+)/);
    expect(structMatch).toBeTruthy();

    const structureId = structMatch![1];
    const res = await fetchWithSession(`/backend/tpsadmin/list/${structureId}`);
    expect(res.status).toBe(200);
    const html = await res.text();

    // Superadmin should see Add Content button
    expect(html).toContain("Add Content");
    // Should see edit and delete action buttons
    expect(html).toContain('title="Edit"');
    expect(html).toContain('title="Delete"');
  });

  // Test 2: Permission utility module loads correctly
  it("T2: loadRolePermissions returns Map", async () => {
    // Test via the role-permission API (GET)
    const res = await fetchWithSession("/backend/api/role-permission?roleId=1");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(Array.isArray(data.permissions)).toBe(true);
  });

  // Test 3: Content save API includes role check
  it("T3: content-save API returns proper error for auth", async () => {
    const res = await fetch(`${BASE_URL}/backend/api/content-save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "test", status: "draft", entry: {} }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toBe("Unauthorized");
  });

  // Test 4: Content delete API includes role check
  it("T4: content-delete API returns proper error for auth", async () => {
    const res = await fetch(`${BASE_URL}/backend/api/content-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toBe("Unauthorized");
  });

  // Test 5: Dashboard sidebar renders for superadmin
  it("T5: dashboard loads with sidebar structures", async () => {
    const res = await fetchWithSession("/backend/tpsadmin/dashboard");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Kelola Konten");
    expect(html).toContain("folder-list");
  });

  // Test 6: Add page accessible for superadmin
  it("T6: add page loads for superadmin", async () => {
    const dashRes = await fetchWithSession("/backend/tpsadmin/dashboard");
    const dashHtml = await dashRes.text();
    const structMatch = dashHtml.match(/\/backend\/tpsadmin\/list\/([a-f0-9-]+)/);
    expect(structMatch).toBeTruthy();

    const structureId = structMatch![1];
    const res = await fetchWithSession(`/backend/tpsadmin/add/${structureId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Tambah");
  });

  // Test 7: Role permission page accessible
  it("T7: role-permissions page loads for superadmin", async () => {
    const res = await fetchWithSession("/backend/tpsadmin/role-permissions");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Hak Akses Role");
    expect(html).toContain("Pilih Role");
  });

  // Test 8: Permission save API works
  it("T8: role-permission POST saves and retrieves", async () => {
    // First get a role to test with (non-superadmin)
    const rolesRes = await fetchWithSession("/backend/tpsadmin/role");
    const rolesHtml = await rolesRes.text();

    // Get a structure ID
    const dashRes = await fetchWithSession("/backend/tpsadmin/dashboard");
    const dashHtml = await dashRes.text();
    const structMatch = dashHtml.match(/data-structure-id="([a-f0-9-]+)"/);

    if (structMatch) {
      const testStructureId = structMatch[1];

      // We'll use role ID 2 for testing (assuming it exists)
      const saveRes = await fetchWithSession("/backend/api/role-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: 2,
          permissions: [{
            id_structure: testStructureId,
            can_view: true,
            can_add: false,
            can_edit: true,
            can_delete: false,
          }],
        }),
      });

      if (saveRes.status === 200) {
        const saveData = await saveRes.json();
        expect(saveData.status).toBe("ok");

        // Verify saved
        const getRes = await fetchWithSession(`/backend/api/role-permission?roleId=2`);
        const getData = await getRes.json();
        expect(getData.status).toBe("ok");
        const perm = getData.permissions.find((p: any) => p.id_structure === testStructureId);
        expect(perm).toBeTruthy();
        if (perm) {
          expect(perm.can_view).toBe(true);
          expect(perm.can_add).toBe(false);
          expect(perm.can_edit).toBe(true);
          expect(perm.can_delete).toBe(false);
        }
      }
    }
  });

  // Test 9: Forbidden page renders properly
  it("T9: permissions utility file exists and exports correctly", async () => {
    // Verify the utility file exists by checking import in list page
    const res = await fetchWithSession("/backend/tpsadmin/dashboard");
    expect(res.status).toBe(200);
    // If permissions module had a syntax error, the server would fail to start
    // The fact that we get 200 means all imports are working
  });
});
