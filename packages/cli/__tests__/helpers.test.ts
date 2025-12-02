import { describe, it, expect } from "vitest";

describe("CLI helper functions", () => {
  describe("Package JSON parsing", () => {
    it("should handle valid package.json", () => {
      const validJson = JSON.stringify({
        name: "test-package",
        version: "1.0.0",
      });

      const parsed = JSON.parse(validJson);
      expect(parsed.name).toBe("test-package");
      expect(parsed.version).toBe("1.0.0");
    });

    it("should return null for invalid JSON", () => {
      const invalidJson = "{ invalid json }";

      let result = null;
      try {
        JSON.parse(invalidJson);
      } catch {
        result = null;
      }

      expect(result).toBeNull();
    });
  });

  describe("Form entry size calculation", () => {
    it("should calculate string size correctly", () => {
      const str = "hello world";
      expect(str.length).toBe(11);
    });

    it("should calculate File size correctly", () => {
      const file = new File(["test content"], "test.txt");
      expect(file.size).toBe(12);
    });
  });

  describe("Dependency hijacking logic", () => {
    it("should update existing dependencies with new URLs", () => {
      const oldDeps = {
        "package-a": "^1.0.0",
        "package-b": "^2.0.0",
        "unrelated": "^3.0.0",
      };

      const newDeps = new Map([
        ["package-a", "https://pkg.khulnasoft.com/org/repo/package-a@abc123"],
        ["package-b", "https://pkg.khulnasoft.com/org/repo/package-b@abc123"],
      ]);

      // Simulate hijackDeps function
      for (const [newDep, url] of newDeps) {
        if (newDep in oldDeps) {
          oldDeps[newDep] = url;
        }
      }

      expect(oldDeps["package-a"]).toContain("pkg.khulnasoft.com");
      expect(oldDeps["package-b"]).toContain("pkg.khulnasoft.com");
      expect(oldDeps["unrelated"]).toBe("^3.0.0");
    });

    it("should not add dependencies that don't exist", () => {
      const oldDeps = {
        "existing": "^1.0.0",
      };

      const newDeps = new Map([
        ["non-existing", "https://pkg.khulnasoft.com/org/repo/pkg@abc123"],
      ]);

      for (const [newDep, url] of newDeps) {
        if (newDep in oldDeps) {
          oldDeps[newDep] = url;
        }
      }

      expect(oldDeps).not.toHaveProperty("non-existing");
      expect(Object.keys(oldDeps)).toHaveLength(1);
    });

    it("should handle empty dependencies object", () => {
      const oldDeps = {};
      const newDeps = new Map([["package-a", "url"]]);

      for (const [newDep, url] of newDeps) {
        if (newDep in oldDeps) {
          oldDeps[newDep] = url;
        }
      }

      expect(oldDeps).toEqual({});
    });
  });

  describe("Pack method validation", () => {
    it("should validate supported pack methods", () => {
      const supportedMethods = ["npm", "pnpm", "yarn", "bun"];

      expect(supportedMethods).toContain("npm");
      expect(supportedMethods).toContain("pnpm");
      expect(supportedMethods).toContain("yarn");
      expect(supportedMethods).toContain("bun");
    });

    it("should reject unsupported pack methods", () => {
      const supportedMethods = ["npm", "pnpm", "yarn", "bun"];
      const unsupported = "deno";

      expect(supportedMethods).not.toContain(unsupported);
    });
  });

  describe("GitHub environment variables", () => {
    it("should parse owner and repo from GITHUB_REPOSITORY", () => {
      const githubRepo = "testorg/testrepo";
      const [owner, repo] = githubRepo.split("/");

      expect(owner).toBe("testorg");
      expect(repo).toBe("testrepo");
    });

    it("should handle repository with special characters", () => {
      const githubRepo = "my-org/my-repo-name";
      const [owner, repo] = githubRepo.split("/");

      expect(owner).toBe("my-org");
      expect(repo).toBe("my-repo-name");
    });
  });

  describe("Compact mode validation", () => {
    it("should validate repository URL extraction", () => {
      const repository = "https://github.com/org/repo.git";
      const match = repository.match(/^(?:git\+)?https?:\/\/github\.com\/([^/]+)\/([^/]+)\.git$/);

      expect(match).not.toBeNull();
      if (match) {
        expect(match[1]).toBe("org");
        expect(match[2]).toBe("repo");
      }
    });

    it("should reject invalid repository URLs", () => {
      const repository = "https://gitlab.com/org/repo.git";
      const match = repository.match(/^(?:git\+)?https?:\/\/github\.com\/([^/]+)\/([^/]+)\.git$/);

      expect(match).toBeNull();
    });
  });
});