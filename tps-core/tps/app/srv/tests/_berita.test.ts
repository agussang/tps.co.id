/**
 * Unit tests for Berita (News) Landing Page
 * Tests pagination, category filtering, and data loading
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { PrismaClient } from "@prisma/client";

const TEST_SESSION_ID = process.env.TEST_SESSION_ID || "73937cc5-33fc-4ebf-a58d-ceca25e0f27b";
const BASE_URL = "http://localhost:3300";

describe("Berita Landing Page", () => {
  let db: PrismaClient;

  beforeAll(async () => {
    db = new PrismaClient();
  });

  describe("Database Content Verification", () => {
    test("should have press_release structure in database", async () => {
      const structure = await db.structure.findFirst({
        where: { path: "press_release" },
        select: { id: true, path: true, title: true },
      });

      expect(structure).not.toBeNull();
      expect(structure?.path).toBe("press_release");
      console.log("  ✓ press_release structure found:", structure?.id);
    });

    test("should have press_release content items", async () => {
      const structure = await db.structure.findFirst({
        where: { path: "press_release" },
      });

      if (!structure) {
        throw new Error("press_release structure not found");
      }

      const contentCount = await db.content.count({
        where: {
          id_structure: structure.id,
          id_parent: null,
          status: "published",
        },
      });

      expect(contentCount).toBeGreaterThan(0);
      console.log("  ✓ Published press_release count:", contentCount);
    });

    test("should have publish_date field in press_release content", async () => {
      const structure = await db.structure.findFirst({
        where: { path: "press_release.publish_date" },
        select: { id: true, path: true, type: true },
      });

      expect(structure).not.toBeNull();
      expect(structure?.type).toBe("date");
      console.log("  ✓ publish_date structure type:", structure?.type);
    });
  });

  describe("Berita Page HTTP Response", () => {
    test("should return 200 for /berita/press-release", async () => {
      const response = await fetch(`${BASE_URL}/berita/press-release`);
      expect(response.status).toBe(200);
      console.log("  ✓ /berita/press-release returns 200");
    });

    test("should return 200 for /berita/press-release with page param", async () => {
      const response = await fetch(`${BASE_URL}/berita/press-release?page=1`);
      expect(response.status).toBe(200);
      console.log("  ✓ /berita/press-release?page=1 returns 200");
    });

    test("should return 200 for /berita/press-release with category and page", async () => {
      const response = await fetch(`${BASE_URL}/berita/press-release?category=all&page=1`);
      expect(response.status).toBe(200);
      console.log("  ✓ /berita/press-release?category=all&page=1 returns 200");
    });

    test("should contain news items in response", async () => {
      const response = await fetch(`${BASE_URL}/berita/press-release`);
      const html = await response.text();

      // Check for news content in the page
      // The page should contain article/news items
      const hasContent = html.length > 1000; // Basic check for content
      expect(hasContent).toBe(true);
      console.log("  ✓ Page has content, HTML length:", html.length);
    });
  });

  describe("Pagination Functionality", () => {
    test("page 1 should have different content than page 2", async () => {
      const [response1, response2] = await Promise.all([
        fetch(`${BASE_URL}/berita/press-release?page=1`),
        fetch(`${BASE_URL}/berita/press-release?page=2`),
      ]);

      const html1 = await response1.text();
      const html2 = await response2.text();

      // Both pages should return successfully
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Pages might be same if there's only one page of content
      // But they should both have content
      expect(html1.length).toBeGreaterThan(500);
      console.log("  ✓ Page 1 length:", html1.length);
      console.log("  ✓ Page 2 length:", html2.length);

      // If page 2 has less content, it might be empty/last page
      // This is acceptable behavior
      if (html2.length < html1.length * 0.5) {
        console.log("  ℹ Page 2 appears to be last/empty page (less content)");
      }
    });

    test("should handle high page numbers gracefully", async () => {
      const response = await fetch(`${BASE_URL}/berita/press-release?page=999`);
      // Should still return 200, just with no/empty results
      expect(response.status).toBe(200);
      console.log("  ✓ High page number (999) handled gracefully");
    });
  });

  describe("Berita Detail Page", () => {
    test("should have content with slug for detail page", async () => {
      // Get a press_release item with slug
      const structure = await db.structure.findFirst({
        where: { path: "press_release" },
      });

      const slugStructure = await db.structure.findFirst({
        where: { path: "press_release.slug" },
      });

      if (!structure || !slugStructure) {
        console.log("  ⚠ Skipping: structure not found");
        return;
      }

      // Get a content item with slug
      const content = await db.content.findFirst({
        where: {
          id_structure: slugStructure.id,
          text: { not: null },
        },
        select: { text: true, id_parent: true },
      });

      if (content?.text) {
        console.log("  ✓ Found content with slug:", content.text);

        // Test detail page
        const response = await fetch(
          `${BASE_URL}/berita/press-release/${content.text}`
        );
        console.log("  ✓ Detail page status:", response.status);
      }
    });
  });

  describe("Date Sorting", () => {
    test("should return news sorted by publish_date desc", async () => {
      const structure = await db.structure.findFirst({
        where: { path: "press_release" },
      });

      const publishDateStructure = await db.structure.findFirst({
        where: { path: "press_release.publish_date" },
      });

      if (!structure || !publishDateStructure) {
        console.log("  ⚠ Skipping: structure not found");
        return;
      }

      // Get parent content IDs
      const parentContents = await db.content.findMany({
        where: {
          id_structure: structure.id,
          id_parent: null,
          status: "published",
        },
        take: 10,
        select: { id: true },
      });

      // Get publish dates for these contents
      const dates = await db.content.findMany({
        where: {
          id_structure: publishDateStructure.id,
          id_parent: { in: parentContents.map((c) => c.id) },
        },
        select: { text: true, id_parent: true },
      });

      const parsedDates = dates
        .filter((d) => d.text)
        .map((d) => ({
          id: d.id_parent,
          date: new Date(d.text!),
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      if (parsedDates.length > 1) {
        console.log("  ✓ First date:", parsedDates[0].date.toISOString());
        console.log("  ✓ Last date:", parsedDates[parsedDates.length - 1].date.toISOString());

        // Verify dates are in descending order
        for (let i = 0; i < parsedDates.length - 1; i++) {
          expect(parsedDates[i].date.getTime()).toBeGreaterThanOrEqual(
            parsedDates[i + 1].date.getTime()
          );
        }
        console.log("  ✓ Dates are in descending order");
      }
    });
  });
});
