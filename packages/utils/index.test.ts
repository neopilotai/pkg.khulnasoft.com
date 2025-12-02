import {
  it,
  describe,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import type { PackageManifest } from "query-registry";
import * as utils from "./index.js";

describe("utils", () => {
  describe("extractOwnerAndRepo", () => {
    it("is null for URLs with trailing characters", () => {
      expect(
        utils.extractOwnerAndRepo("https://github.com/org/repo.gitpewpew"),
      ).toBeNull();
    });

    it("is null for URLs with leading characters", () => {
      expect(
        utils.extractOwnerAndRepo("pewpewhttps://github.com/org/repo.git"),
      ).toBeNull();
    });

    it("returns org and repo for valid https URLs", () => {
      expect(
        utils.extractOwnerAndRepo("http://github.com/org/repo.git"),
      ).toEqual(["org", "repo"]);
    });

    it("returns org and repo for valid http URLs", () => {
      expect(
        utils.extractOwnerAndRepo("https://github.com/org/repo.git"),
      ).toEqual(["org", "repo"]);
    });

    it("returns org and repo for valid git+https URLs", () => {
      expect(
        utils.extractOwnerAndRepo("git+https://github.com/org/repo.git"),
      ).toEqual(["org", "repo"]);
    });

    it("returns org and repo for valid git+http URLs", () => {
      expect(
        utils.extractOwnerAndRepo("git+http://github.com/org/repo.git"),
      ).toEqual(["org", "repo"]);
    });
  });

  describe("extractRepository", () => {
    it("returns undefined if no repository", () => {
      expect(utils.extractRepository({} as PackageManifest)).toBeUndefined();
    });

    it("returns undefined if repository is object with no URL", () => {
      expect(
        utils.extractRepository({
          repository: {},
        } as PackageManifest),
      ).toBeUndefined();
    });

    it("returns URL if repository is string", () => {
      expect(
        utils.extractRepository({
          repository: "foo",
        } as PackageManifest),
      ).toBe("foo");
    });

    it("returns URL if repository is object with URL", () => {
      expect(
        utils.extractRepository({
          repository: {
            url: "foo",
          },
        } as PackageManifest),
      ).toBe("foo");
    });
  });

  describe("abbreviateCommitHash", () => {
    it("returns the first 7 characters of a hash", () => {
      expect(
        utils.abbreviateCommitHash("09efd0553374ff7d3e62b79378e3184f5eb57571"),
      ).toBe("09efd05");
    });
  });

  describe("isPullRequest", () => {
    it("returns true if ref is non-nan number", () => {
      expect(utils.isPullRequest("808")).toBe(true);
    });

    it("returns false if ref is nan number", () => {
      expect(utils.isPullRequest("foo")).toBe(false);
    });
  });

  describe("isWhitelisted", () => {
    let fetchSpy: MockInstance;
    let whitelist: string;

    beforeEach(() => {
      whitelist = "";
      fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
        return Promise.resolve(new Response(whitelist, { status: 200 }));
      });
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it("should return true if repo is in whitelist", async () => {
      whitelist = `
        foo/bar
        org/repo
        baz/zab
      `;
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(true);
    });

    it("should return false if repo is not in whitelist", async () => {
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should return false if fetch fails", async () => {
      fetchSpy.mockRejectedValue(new Error("bleep bloop"));
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });
  });

  describe("installCommands", () => {
    it("should have correct install commands for all package managers", () => {
      expect(utils.installCommands.npm).toBe("npm i");
      expect(utils.installCommands.pnpm).toBe("pnpm add");
      expect(utils.installCommands.yarn).toBe("yarn add");
      expect(utils.installCommands.bun).toBe("bun add");
    });

    it("should export all supported package managers", () => {
      expect(Object.keys(utils.installCommands)).toEqual(["npm", "pnpm", "yarn", "bun"]);
    });
  });

  describe("extractOwnerAndRepo - Additional Edge Cases", () => {
    it("should return null for empty string", () => {
      expect(utils.extractOwnerAndRepo("")).toBeNull();
    });

    it("should return null for non-GitHub URLs", () => {
      expect(utils.extractOwnerAndRepo("https://gitlab.com/org/repo.git")).toBeNull();
    });

    it("should return null for malformed GitHub URLs", () => {
      expect(utils.extractOwnerAndRepo("https://github.com/org")).toBeNull();
      expect(utils.extractOwnerAndRepo("https://github.com/org/")).toBeNull();
      expect(utils.extractOwnerAndRepo("https://github.com//repo.git")).toBeNull();
    });

    it("should handle URLs with special characters in owner/repo names", () => {
      expect(utils.extractOwnerAndRepo("https://github.com/my-org/my-repo.git")).toEqual([
        "my-org",
        "my-repo",
      ]);
      expect(utils.extractOwnerAndRepo("https://github.com/org123/repo456.git")).toEqual([
        "org123",
        "repo456",
      ]);
    });
  });

  describe("abbreviateCommitHash - Additional Tests", () => {
    it("should handle short hashes gracefully", () => {
      expect(utils.abbreviateCommitHash("abc")).toBe("abc");
      expect(utils.abbreviateCommitHash("abcdef")).toBe("abcdef");
    });

    it("should handle exactly 7 character hash", () => {
      expect(utils.abbreviateCommitHash("abcdefg")).toBe("abcdefg");
    });

    it("should handle empty string", () => {
      expect(utils.abbreviateCommitHash("")).toBe("");
    });
  });

  describe("isPullRequest - Additional Tests", () => {
    it("should return true for numeric strings", () => {
      expect(utils.isPullRequest("1")).toBe(true);
      expect(utils.isPullRequest("999")).toBe(true);
      expect(utils.isPullRequest("0")).toBe(true);
    });

    it("should return false for non-numeric strings", () => {
      expect(utils.isPullRequest("pr-123")).toBe(false);
      expect(utils.isPullRequest("main")).toBe(false);
      expect(utils.isPullRequest("feature/branch")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(utils.isPullRequest("")).toBe(false);
    });

    it("should handle strings with leading/trailing spaces", () => {
      expect(utils.isPullRequest(" 123 ")).toBe(true);
    });
  });

  describe("isWhitelisted - Additional Tests", () => {
    let fetchSpy: MockInstance;
    let whitelist: string;

    beforeEach(() => {
      whitelist = "";
      fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
        return Promise.resolve(new Response(whitelist, { status: 200 }));
      });
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it("should handle whitelist with extra whitespace", async () => {
      whitelist = `
        foo/bar
        
        org/repo
        
        baz/zab
      `;
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(true);
    });

    it("should be case-sensitive", async () => {
      whitelist = "ORG/REPO";
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should handle partial matches correctly", async () => {
      whitelist = "org/repository";
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should return false on network errors", async () => {
      fetchSpy.mockRejectedValue(new Error("Network error"));
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should return false on non-200 status codes", async () => {
      fetchSpy.mockResolvedValue(new Response("", { status: 404 }));
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });
  });

});

  describe("installCommands", () => {
    it("should have correct install commands for all package managers", () => {
      expect(utils.installCommands.npm).toBe("npm i");
      expect(utils.installCommands.pnpm).toBe("pnpm add");
      expect(utils.installCommands.yarn).toBe("yarn add");
      expect(utils.installCommands.bun).toBe("bun add");
    });

    it("should export all supported package managers", () => {
      expect(Object.keys(utils.installCommands)).toEqual(["npm", "pnpm", "yarn", "bun"]);
    });
  });

  describe("extractOwnerAndRepo - Additional Edge Cases", () => {
    it("should return null for empty string", () => {
      expect(utils.extractOwnerAndRepo("")).toBeNull();
    });

    it("should return null for non-GitHub URLs", () => {
      expect(utils.extractOwnerAndRepo("https://gitlab.com/org/repo.git")).toBeNull();
    });

    it("should return null for malformed GitHub URLs", () => {
      expect(utils.extractOwnerAndRepo("https://github.com/org")).toBeNull();
      expect(utils.extractOwnerAndRepo("https://github.com/org/")).toBeNull();
      expect(utils.extractOwnerAndRepo("https://github.com//repo.git")).toBeNull();
    });

    it("should handle URLs with special characters in owner/repo names", () => {
      expect(utils.extractOwnerAndRepo("https://github.com/my-org/my-repo.git")).toEqual([
        "my-org",
        "my-repo",
      ]);
      expect(utils.extractOwnerAndRepo("https://github.com/org123/repo456.git")).toEqual([
        "org123",
        "repo456",
      ]);
    });
  });

  describe("abbreviateCommitHash - Additional Tests", () => {
    it("should handle short hashes gracefully", () => {
      expect(utils.abbreviateCommitHash("abc")).toBe("abc");
      expect(utils.abbreviateCommitHash("abcdef")).toBe("abcdef");
    });

    it("should handle exactly 7 character hash", () => {
      expect(utils.abbreviateCommitHash("abcdefg")).toBe("abcdefg");
    });

    it("should handle empty string", () => {
      expect(utils.abbreviateCommitHash("")).toBe("");
    });
  });

  describe("isPullRequest - Additional Tests", () => {
    it("should return true for numeric strings", () => {
      expect(utils.isPullRequest("1")).toBe(true);
      expect(utils.isPullRequest("999")).toBe(true);
      expect(utils.isPullRequest("0")).toBe(true);
    });

    it("should return false for non-numeric strings", () => {
      expect(utils.isPullRequest("pr-123")).toBe(false);
      expect(utils.isPullRequest("main")).toBe(false);
      expect(utils.isPullRequest("feature/branch")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(utils.isPullRequest("")).toBe(false);
    });

    it("should handle strings with leading/trailing spaces", () => {
      expect(utils.isPullRequest(" 123 ")).toBe(true);
    });
  });

  describe("isWhitelisted - Additional Tests", () => {
    let fetchSpy: MockInstance;
    let whitelist: string;

    beforeEach(() => {
      whitelist = "";
      fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
        return Promise.resolve(new Response(whitelist, { status: 200 }));
      });
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it("should handle whitelist with extra whitespace", async () => {
      whitelist = `
        foo/bar
        
        org/repo
        
        baz/zab
      `;
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(true);
    });

    it("should be case-sensitive", async () => {
      whitelist = "ORG/REPO";
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should handle partial matches correctly", async () => {
      whitelist = "org/repository";
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should return false on network errors", async () => {
      fetchSpy.mockRejectedValue(new Error("Network error"));
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should return false on non-200 status codes", async () => {
      fetchSpy.mockResolvedValue(new Response("", { status: 404 }));
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });
  });
});
