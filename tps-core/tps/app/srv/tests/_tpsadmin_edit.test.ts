/**
 * Unit tests for TPS Admin Edit Page
 * Tests date field loading and file/image field loading from database
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { PrismaClient } from "@prisma/client";

const TEST_SESSION_ID = process.env.TEST_SESSION_ID || "73937cc5-33fc-4ebf-a58d-ceca25e0f27b";
const BASE_URL = "http://localhost:3300";

// Test content ID (press_release with publish_date and image)
const TEST_CONTENT_ID = "597d5e80-8794-454b-b067-09f1eaeaacb1";

describe("TPS Admin Edit Page", () => {
  let db: PrismaClient;

  beforeAll(async () => {
    db = new PrismaClient();
  });

  describe("Database Content Verification", () => {
    test("should have publish_date field in database", async () => {
      const content = await db.content.findFirst({
        where: {
          id_parent: TEST_CONTENT_ID,
          structure: { path: "press_release.publish_date" },
        },
        select: {
          id: true,
          text: true,
          structure: { select: { path: true, type: true } },
        },
      });

      expect(content).not.toBeNull();
      expect(content?.text).toBeTruthy();
      expect(content?.structure?.type).toBe("date");
      console.log("  ✓ publish_date value:", content?.text);
    });

    test("should have image field with file reference in database", async () => {
      const content = await db.content.findFirst({
        where: {
          id_parent: TEST_CONTENT_ID,
          structure: { path: "press_release.image" },
        },
        select: {
          id: true,
          id_file: true,
          structure: { select: { path: true, type: true } },
          file: { select: { uuid: true, path: true } },
        },
      });

      expect(content).not.toBeNull();
      expect(content?.structure?.type).toBe("file");
      expect(content?.id_file).toBeTruthy();
      console.log("  ✓ image id_file:", content?.id_file);
      console.log("  ✓ image file.path:", content?.file?.path);
    });

    test("should load file directly if relation fails", async () => {
      // Get the content with id_file
      const content = await db.content.findFirst({
        where: {
          id_parent: TEST_CONTENT_ID,
          structure: { path: "press_release.image" },
        },
        select: { id_file: true },
      });

      if (content?.id_file) {
        // Fallback query - directly load file by uuid
        const file = await db.file.findFirst({
          where: { uuid: content.id_file },
          select: { path: true },
        });

        expect(file).not.toBeNull();
        expect(file?.path).toBeTruthy();
        console.log("  ✓ Fallback file query works, path:", file?.path);
      }
    });
  });

  describe("Edit Page API Response", () => {
    test("should return HTML with date field populated", async () => {
      const response = await fetch(`${BASE_URL}/backend/tpsadmin/edit/${TEST_CONTENT_ID}`, {
        headers: {
          Cookie: `sid=${TEST_SESSION_ID}`,
        },
      });

      expect(response.status).toBe(200);
      const html = await response.text();

      // Check that publish_date input has a value in YYYY-MM-DD format
      const dateMatch = html.match(/name="publish_date"[^>]*value="(\d{4}-\d{2}-\d{2})"/);
      expect(dateMatch).not.toBeNull();
      console.log("  ✓ publish_date in HTML:", dateMatch?.[1]);
    });

    test("should return HTML with image field showing file preview", async () => {
      const response = await fetch(`${BASE_URL}/backend/tpsadmin/edit/${TEST_CONTENT_ID}`, {
        headers: {
          Cookie: `sid=${TEST_SESSION_ID}`,
        },
      });

      expect(response.status).toBe(200);
      const html = await response.text();

      // Check that image input has a file path value
      const imageMatch = html.match(/name="image"[^>]*value="([^"]+)"/);
      expect(imageMatch).not.toBeNull();
      expect(imageMatch?.[1]).toBeTruthy();
      console.log("  ✓ image path in HTML:", imageMatch?.[1]);

      // Check that there's an img preview
      const imgPreview = html.includes('/_img/') && html.includes('press_release');
      expect(imgPreview).toBe(true);
      console.log("  ✓ Image preview tag found in HTML");
    });
  });

  describe("Date Format Conversion", () => {
    test("should convert ISO date to YYYY-MM-DD format", () => {
      const isoDate = "2021-06-03T00:00:00.000Z";
      const d = new Date(isoDate);
      const formatted = d.toISOString().split("T")[0];

      expect(formatted).toBe("2021-06-03");
      console.log("  ✓ Date conversion:", isoDate, "->", formatted);
    });

    test("should handle various ISO date formats", () => {
      const testCases = [
        { input: "2021-06-03T00:00:00.000Z", expected: "2021-06-03" },
        { input: "2024-12-27T15:30:00.000Z", expected: "2024-12-27" },
        { input: "2025-01-15", expected: "2025-01-15" },
      ];

      for (const { input, expected } of testCases) {
        const d = new Date(input);
        const formatted = d.toISOString().split("T")[0];
        expect(formatted).toBe(expected);
        console.log(`  ✓ ${input} -> ${formatted}`);
      }
    });
  });
});
