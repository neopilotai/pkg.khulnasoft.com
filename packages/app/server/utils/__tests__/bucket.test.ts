import { describe, it, expect } from "vitest";
import { baseKey } from "../bucket";

describe("bucket utilities", () => {
  describe("constants", () => {
    it("should export baseKey", () => {
      expect(baseKey).toBe("bucket");
    });
  });

  describe("bucket key generation", () => {
    it("should generate correct workflow bucket key", () => {
      const expectedBase = "bucket:workflow";
      expect("bucket:workflow").toBe(expectedBase);
    });

    it("should generate correct packages bucket key", () => {
      const expectedBase = "bucket:package";
      expect("bucket:package").toBe(expectedBase);
    });

    it("should generate correct templates bucket key", () => {
      const expectedBase = "bucket:template";
      expect("bucket:template").toBe(expectedBase);
    });

    it("should generate correct cursor bucket key", () => {
      const expectedBase = "bucket:cursor";
      expect("bucket:cursor").toBe(expectedBase);
    });

    it("should generate correct downloaded-at bucket key", () => {
      const expectedBase = "bucket:downloaded-at";
      expect("bucket:downloaded-at").toBe(expectedBase);
    });

    it("should generate correct pr-number bucket key", () => {
      const expectedBase = "bucket:pr-number";
      expect("bucket:pr-number").toBe(expectedBase);
    });

    it("should generate correct debug bucket key", () => {
      const expectedBase = "bucket:debug";
      expect("bucket:debug").toBe(expectedBase);
    });
  });

  describe("environment binding selection", () => {
    it("should use PROD_CR_BUCKET for production", () => {
      const env = "production";
      const expectedBinding = env === "production" ? "PROD_CR_BUCKET" : "CR_BUCKET";
      expect(expectedBinding).toBe("PROD_CR_BUCKET");
    });

    it("should use CR_BUCKET for non-production", () => {
      const env = "development";
      const expectedBinding = env === "production" ? "PROD_CR_BUCKET" : "CR_BUCKET";
      expect(expectedBinding).toBe("CR_BUCKET");
    });
  });
});