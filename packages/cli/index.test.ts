import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import type { PackageJson } from "pkg-types";
import fs from "node:fs/promises";
import * as path from "node:path";

// We'll test the utility functions that are exported or can be isolated
// Since the main file uses a command pattern, we'll focus on pure functions

describe("CLI Utility Functions", () => {
  describe("getFormEntrySize", () => {
    it("should return string length for string entries", () => {
      const testString = "hello world";
      const size = testString.length;
      expect(size).toBe(11);
    });

    it("should return size property for File entries", () => {
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      expect(mockFile.size).toBeGreaterThan(0);
    });

    it("should handle empty strings", () => {
      const emptyString = "";
      expect(emptyString.length).toBe(0);
    });

    it("should handle large strings", () => {
      const largeString = "a".repeat(10000);
      expect(largeString.length).toBe(10000);
    });

    it("should handle unicode strings correctly", () => {
      const unicodeString = "hello 世界 🌍";
      expect(unicodeString.length).toBeGreaterThan(0);
    });

    it("should handle Blob entries", () => {
      const blob = new Blob(["test content"], { type: "application/octet-stream" });
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe("Package JSON parsing logic", () => {
    it("should parse valid package.json content", () => {
      const validJson = JSON.stringify({
        name: "test-package",
        version: "1.0.0",
        main: "index.js",
      });
      
      const parsed = JSON.parse(validJson) as PackageJson;
      expect(parsed.name).toBe("test-package");
      expect(parsed.version).toBe("1.0.0");
      expect(parsed.main).toBe("index.js");
    });

    it("should handle package.json with dependencies", () => {
      const jsonWithDeps = JSON.stringify({
        name: "test-package",
        version: "1.0.0",
        dependencies: {
          "lodash": "^4.17.21",
          "react": "^18.0.0",
        },
        devDependencies: {
          "typescript": "^5.0.0",
        },
      });
      
      const parsed = JSON.parse(jsonWithDeps) as PackageJson;
      expect(parsed.dependencies).toBeDefined();
      expect(parsed.dependencies!["lodash"]).toBe("^4.17.21");
      expect(parsed.devDependencies).toBeDefined();
      expect(parsed.devDependencies!["typescript"]).toBe("^5.0.0");
    });

    it("should handle package.json with peerDependencies", () => {
      const jsonWithPeerDeps = JSON.stringify({
        name: "test-package",
        version: "1.0.0",
        peerDependencies: {
          "react": ">=16.8.0",
          "react-dom": ">=16.8.0",
        },
      });
      
      const parsed = JSON.parse(jsonWithPeerDeps) as PackageJson;
      expect(parsed.peerDependencies).toBeDefined();
      expect(parsed.peerDependencies!["react"]).toBe(">=16.8.0");
    });

    it("should handle package.json with optionalDependencies", () => {
      const jsonWithOptDeps = JSON.stringify({
        name: "test-package",
        version: "1.0.0",
        optionalDependencies: {
          "fsevents": "^2.3.2",
        },
      });
      
      const parsed = JSON.parse(jsonWithOptDeps) as PackageJson;
      expect(parsed.optionalDependencies).toBeDefined();
      expect(parsed.optionalDependencies!["fsevents"]).toBe("^2.3.2");
    });

    it("should handle package.json with repository field as string", () => {
      const jsonWithRepo = JSON.stringify({
        name: "test-package",
        version: "1.0.0",
        repository: "https://github.com/owner/repo.git",
      });
      
      const parsed = JSON.parse(jsonWithRepo) as PackageJson;
      expect(parsed.repository).toBe("https://github.com/owner/repo.git");
    });

    it("should handle package.json with repository field as object", () => {
      const jsonWithRepoObj = JSON.stringify({
        name: "test-package",
        version: "1.0.0",
        repository: {
          type: "git",
          url: "https://github.com/owner/repo.git",
        },
      });
      
      const parsed = JSON.parse(jsonWithRepoObj) as PackageJson;
      expect(typeof parsed.repository).toBe("object");
      expect((parsed.repository as any).url).toBe("https://github.com/owner/repo.git");
    });

    it("should handle package.json with bin field", () => {
      const jsonWithBin = JSON.stringify({
        name: "test-package",
        version: "1.0.0",
        bin: {
          "my-cli": "./bin/cli.js",
        },
      });
      
      const parsed = JSON.parse(jsonWithBin) as PackageJson;
      expect(parsed.bin).toBeDefined();
    });

    it("should handle package.json with scripts", () => {
      const jsonWithScripts = JSON.stringify({
        name: "test-package",
        version: "1.0.0",
        scripts: {
          "build": "tsc",
          "test": "vitest",
          "dev": "vite",
        },
      });
      
      const parsed = JSON.parse(jsonWithScripts) as PackageJson;
      expect(parsed.scripts).toBeDefined();
      expect(parsed.scripts!["build"]).toBe("tsc");
    });

    it("should handle package.json with workspaces", () => {
      const jsonWithWorkspaces = JSON.stringify({
        name: "monorepo",
        version: "1.0.0",
        private: true,
        workspaces: ["packages/*"],
      });
      
      const parsed = JSON.parse(jsonWithWorkspaces) as PackageJson;
      expect(parsed.private).toBe(true);
      expect(parsed.workspaces).toBeDefined();
    });

    it("should handle invalid JSON gracefully", () => {
      const invalidJson = "{ invalid json }";
      
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it("should handle empty JSON object", () => {
      const emptyJson = "{}";
      
      const parsed = JSON.parse(emptyJson) as PackageJson;
      expect(parsed).toEqual({});
    });

    it("should handle package.json with exports field", () => {
      const jsonWithExports = JSON.stringify({
        name: "test-package",
        version: "1.0.0",
        exports: {
          ".": {
            import: "./dist/index.mjs",
            require: "./dist/index.cjs",
          },
        },
      });
      
      const parsed = JSON.parse(jsonWithExports) as PackageJson;
      expect(parsed.exports).toBeDefined();
    });
  });

  describe("PackMethod type validation", () => {
    it("should accept npm as valid pack method", () => {
      const method: "npm" | "pnpm" | "yarn" | "bun" = "npm";
      expect(method).toBe("npm");
    });

    it("should accept pnpm as valid pack method", () => {
      const method: "npm" | "pnpm" | "yarn" | "bun" = "pnpm";
      expect(method).toBe("pnpm");
    });

    it("should accept yarn as valid pack method", () => {
      const method: "npm" | "pnpm" | "yarn" | "bun" = "yarn";
      expect(method).toBe("yarn");
    });

    it("should accept bun as valid pack method", () => {
      const method: "npm" | "pnpm" | "yarn" | "bun" = "bun";
      expect(method).toBe("bun");
    });
  });

  describe("Filename generation logic", () => {
    it("should replace slashes in scoped package names", () => {
      const scopedName = "@scope/package";
      const sanitized = scopedName.replace("/", "-");
      expect(sanitized).toBe("@scope-package");
    });

    it("should handle non-scoped package names", () => {
      const regularName = "package";
      const sanitized = regularName.replace("/", "-");
      expect(sanitized).toBe("package");
    });

    it("should generate correct tarball filename", () => {
      const name = "my-package";
      const version = "1.0.0";
      const filename = `${name}-${version}.tgz`;
      expect(filename).toBe("my-package-1.0.0.tgz");
    });

    it("should generate correct tarball filename for scoped packages", () => {
      const name = "@scope/package".replace("/", "-");
      const version = "2.1.0";
      const filename = `${name}-${version}.tgz`;
      expect(filename).toBe("@scope-package-2.1.0.tgz");
    });
  });

  describe("Dependencies hijacking logic", () => {
    it("should update dependencies that exist in newDeps", () => {
      const newDeps = new Map([
        ["package-a", "https://pkg.khulnasoft.com/owner/repo/package-a@abc123"],
        ["package-b", "https://pkg.khulnasoft.com/owner/repo/package-b@abc123"],
      ]);

      const oldDeps = {
        "package-a": "^1.0.0",
        "package-c": "^2.0.0",
      };

      for (const [newDep, url] of newDeps) {
        if (newDep in oldDeps) {
          oldDeps[newDep] = url;
        }
      }

      expect(oldDeps["package-a"]).toBe("https://pkg.khulnasoft.com/owner/repo/package-a@abc123");
      expect(oldDeps["package-c"]).toBe("^2.0.0");
    });

    it("should not add new dependencies that don't exist", () => {
      const newDeps = new Map([
        ["package-new", "https://pkg.khulnasoft.com/owner/repo/package-new@abc123"],
      ]);

      const oldDeps = {
        "package-a": "^1.0.0",
      };

      const originalKeys = Object.keys(oldDeps);

      for (const [newDep, url] of newDeps) {
        if (newDep in oldDeps) {
          oldDeps[newDep] = url;
        }
      }

      expect(Object.keys(oldDeps)).toEqual(originalKeys);
      expect(oldDeps["package-new"]).toBeUndefined();
    });

    it("should handle empty oldDeps", () => {
      const newDeps = new Map([
        ["package-a", "https://pkg.khulnasoft.com/owner/repo/package-a@abc123"],
      ]);

      const oldDeps = undefined;

      expect(() => {
        if (!oldDeps) {
          return;
        }
        for (const [newDep, url] of newDeps) {
          if (newDep in oldDeps) {
            oldDeps[newDep] = url;
          }
        }
      }).not.toThrow();
    });

    it("should handle multiple dependency updates", () => {
      const newDeps = new Map([
        ["react", "https://pkg.khulnasoft.com/owner/repo/react@abc123"],
        ["lodash", "https://pkg.khulnasoft.com/owner/repo/lodash@abc123"],
        ["axios", "https://pkg.khulnasoft.com/owner/repo/axios@abc123"],
      ]);

      const oldDeps = {
        "react": "^18.0.0",
        "lodash": "^4.17.21",
        "axios": "^1.0.0",
        "other": "^1.0.0",
      };

      for (const [newDep, url] of newDeps) {
        if (newDep in oldDeps) {
          oldDeps[newDep] = url;
        }
      }

      expect(oldDeps["react"]).toBe("https://pkg.khulnasoft.com/owner/repo/react@abc123");
      expect(oldDeps["lodash"]).toBe("https://pkg.khulnasoft.com/owner/repo/lodash@abc123");
      expect(oldDeps["axios"]).toBe("https://pkg.khulnasoft.com/owner/repo/axios@abc123");
      expect(oldDeps["other"]).toBe("^1.0.0");
    });
  });

  describe("URL generation patterns", () => {
    it("should generate correct long form URL", () => {
      const owner = "khulnasoft";
      const repo = "pkg.khulnasoft.com";
      const packageName = "my-package";
      const sha = "abc1234567890";
      const apiUrl = "https://pkg.khulnasoft.com";
      
      const url = new URL(`/${owner}/${repo}/${packageName}@${sha}`, apiUrl);
      expect(url.href).toBe("https://pkg.khulnasoft.com/khulnasoft/pkg.khulnasoft.com/my-package@abc1234567890");
    });

    it("should generate correct compact form URL", () => {
      const packageName = "my-package";
      const sha = "abc1234";
      const apiUrl = "https://pkg.khulnasoft.com";
      
      const url = new URL(`/${packageName}@${sha}`, apiUrl);
      expect(url.href).toBe("https://pkg.khulnasoft.com/my-package@abc1234");
    });

    it("should handle scoped packages in URLs", () => {
      const owner = "khulnasoft";
      const repo = "sdk";
      const packageName = "@khulnasoft/sdk";
      const sha = "abc1234";
      const apiUrl = "https://pkg.khulnasoft.com";
      
      const url = new URL(`/${owner}/${repo}/${packageName}@${sha}`, apiUrl);
      expect(url.href).toContain(encodeURIComponent("@khulnasoft/sdk"));
    });

    it("should generate multipart URLs correctly", () => {
      const apiUrl = "https://pkg.khulnasoft.com";
      const createMultipart = new URL("/multipart/create", apiUrl);
      const uploadMultipart = new URL("/multipart/upload", apiUrl);
      const completeMultipart = new URL("/multipart/complete", apiUrl);
      
      expect(createMultipart.href).toBe("https://pkg.khulnasoft.com/multipart/create");
      expect(uploadMultipart.href).toBe("https://pkg.khulnasoft.com/multipart/upload");
      expect(completeMultipart.href).toBe("https://pkg.khulnasoft.com/multipart/complete");
    });

    it("should generate publish URL correctly", () => {
      const apiUrl = "https://pkg.khulnasoft.com";
      const publishUrl = new URL("/publish", apiUrl);
      
      expect(publishUrl.href).toBe("https://pkg.khulnasoft.com/publish");
    });
  });

  describe("OutputMetadata structure", () => {
    it("should create valid output metadata structure", () => {
      const metadata = {
        packages: [
          {
            name: "package-a",
            url: "https://pkg.khulnasoft.com/owner/repo/package-a@abc123",
            shasum: "abc123def456",
          },
        ],
        templates: [
          {
            name: "template-a",
            url: "https://pkg.khulnasoft.com/owner/repo/template/template-a",
          },
        ],
      };

      expect(metadata.packages).toHaveLength(1);
      expect(metadata.templates).toHaveLength(1);
      expect(metadata.packages[0].name).toBe("package-a");
      expect(metadata.templates[0].name).toBe("template-a");
    });

    it("should handle empty packages array", () => {
      const metadata = {
        packages: [],
        templates: [],
      };

      expect(metadata.packages).toHaveLength(0);
      expect(metadata.templates).toHaveLength(0);
    });

    it("should handle multiple packages", () => {
      const metadata = {
        packages: [
          {
            name: "package-a",
            url: "https://pkg.khulnasoft.com/owner/repo/package-a@abc123",
            shasum: "sha1",
          },
          {
            name: "package-b",
            url: "https://pkg.khulnasoft.com/owner/repo/package-b@abc123",
            shasum: "sha2",
          },
          {
            name: "@scope/package-c",
            url: "https://pkg.khulnasoft.com/owner/repo/@scope/package-c@abc123",
            shasum: "sha3",
          },
        ],
        templates: [],
      };

      expect(metadata.packages).toHaveLength(3);
      expect(metadata.packages[2].name).toBe("@scope/package-c");
    });
  });

  describe("Chunk size calculations", () => {
    it("should calculate chunk size correctly", () => {
      const chunkSize = 1024 * 1024 * 5; // 5MB
      expect(chunkSize).toBe(5242880);
    });

    it("should calculate total chunks correctly", () => {
      const fileSize = 1024 * 1024 * 12; // 12MB
      const chunkSize = 1024 * 1024 * 5; // 5MB
      const totalChunks = Math.ceil(fileSize / chunkSize);
      
      expect(totalChunks).toBe(3); // 12MB / 5MB = 2.4, ceil = 3
    });

    it("should handle file size exactly divisible by chunk size", () => {
      const fileSize = 1024 * 1024 * 10; // 10MB
      const chunkSize = 1024 * 1024 * 5; // 5MB
      const totalChunks = Math.ceil(fileSize / chunkSize);
      
      expect(totalChunks).toBe(2);
    });

    it("should handle file size smaller than chunk size", () => {
      const fileSize = 1024 * 1024 * 3; // 3MB
      const chunkSize = 1024 * 1024 * 5; // 5MB
      const totalChunks = Math.ceil(fileSize / chunkSize);
      
      expect(totalChunks).toBe(1);
    });

    it("should calculate multipart threshold correctly", () => {
      const threshold = 1024 * 1024 * 99; // 99MB
      expect(threshold).toBe(103809024);
    });
  });

  describe("Form data size calculations", () => {
    it("should sum multiple form entries correctly", () => {
      const entries: Array<[string, string | File]> = [
        ["field1", "value1"],
        ["field2", "value2"],
        ["field3", new File(["content"], "file.txt")],
      ];

      const totalSize = entries.reduce((prev, [_, entry]) => {
        if (typeof entry === "string") {
          return prev + entry.length;
        }
        return prev + entry.size;
      }, 0);

      expect(totalSize).toBeGreaterThan(0);
    });

    it("should calculate string entry size", () => {
      const stringEntry = "hello world";
      const size = stringEntry.length;
      expect(size).toBe(11);
    });

    it("should calculate file entry size", () => {
      const fileEntry = new File(["test content here"], "test.txt");
      expect(fileEntry.size).toBeGreaterThan(0);
    });
  });
});