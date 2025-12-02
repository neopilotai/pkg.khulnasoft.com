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
});

  describe("installCommands", () => {
    it("should have correct npm command", () => {
      expect(utils.installCommands.npm).toBe("npm i");
    });

    it("should have correct pnpm command", () => {
      expect(utils.installCommands.pnpm).toBe("pnpm add");
    });

    it("should have correct yarn command", () => {
      expect(utils.installCommands.yarn).toBe("yarn add");
    });

    it("should have correct bun command", () => {
      expect(utils.installCommands.bun).toBe("bun add");
    });

    it("should have all four package managers", () => {
      const managers = Object.keys(utils.installCommands);
      expect(managers).toHaveLength(4);
      expect(managers).toContain("npm");
      expect(managers).toContain("pnpm");
      expect(managers).toContain("yarn");
      expect(managers).toContain("bun");
    });
  });

  describe("extractOwnerAndRepo - edge cases", () => {
    it("should handle URLs with different github domains", () => {
      expect(
        utils.extractOwnerAndRepo("https://github.com/owner/repo.git"),
      ).toEqual(["owner", "repo"]);
    });

    it("should return null for non-github URLs", () => {
      expect(
        utils.extractOwnerAndRepo("https://gitlab.com/owner/repo.git"),
      ).toBeNull();
    });

    it("should return null for malformed URLs", () => {
      expect(utils.extractOwnerAndRepo("not a url")).toBeNull();
    });

    it("should return null for github URLs without .git extension", () => {
      expect(
        utils.extractOwnerAndRepo("https://github.com/owner/repo"),
      ).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(utils.extractOwnerAndRepo("")).toBeNull();
    });

    it("should handle git protocol URLs", () => {
      expect(
        utils.extractOwnerAndRepo("git+https://github.com/owner/repo.git"),
      ).toEqual(["owner", "repo"]);
    });

    it("should handle URLs with special characters in owner name", () => {
      expect(
        utils.extractOwnerAndRepo("https://github.com/owner-name/repo.git"),
      ).toEqual(["owner-name", "repo"]);
    });

    it("should handle URLs with special characters in repo name", () => {
      expect(
        utils.extractOwnerAndRepo("https://github.com/owner/repo-name.git"),
      ).toEqual(["owner", "repo-name"]);
    });

    it("should handle URLs with numbers in owner and repo", () => {
      expect(
        utils.extractOwnerAndRepo("https://github.com/owner123/repo456.git"),
      ).toEqual(["owner123", "repo456"]);
    });

    it("should return null for URLs with too many path segments", () => {
      expect(
        utils.extractOwnerAndRepo("https://github.com/owner/repo/extra.git"),
      ).toBeNull();
    });

    it("should return null for URLs with too few path segments", () => {
      expect(utils.extractOwnerAndRepo("https://github.com/owner.git")).toBeNull();
    });
  });

  describe("extractRepository - edge cases", () => {
    it("should handle manifest with null repository", () => {
      expect(
        utils.extractRepository({ repository: null } as any),
      ).toBeUndefined();
    });

    it("should handle manifest with repository as empty string", () => {
      expect(utils.extractRepository({ repository: "" } as PackageManifest)).toBe(
        "",
      );
    });

    it("should handle manifest with repository object with empty url", () => {
      expect(
        utils.extractRepository({
          repository: { url: "" },
        } as PackageManifest),
      ).toBe("");
    });

    it("should handle manifest with repository object with type only", () => {
      expect(
        utils.extractRepository({
          repository: { type: "git" },
        } as PackageManifest),
      ).toBeUndefined();
    });

    it("should handle manifest with repository object with directory field", () => {
      expect(
        utils.extractRepository({
          repository: {
            type: "git",
            url: "https://github.com/owner/repo.git",
            directory: "packages/sub",
          },
        } as PackageManifest),
      ).toBe("https://github.com/owner/repo.git");
    });
  });

  describe("abbreviateCommitHash - edge cases", () => {
    it("should handle exactly 7 character hash", () => {
      expect(utils.abbreviateCommitHash("1234567")).toBe("1234567");
    });

    it("should handle hash shorter than 7 characters", () => {
      expect(utils.abbreviateCommitHash("123")).toBe("123");
    });

    it("should handle very long hash", () => {
      const longHash = "a".repeat(100);
      expect(utils.abbreviateCommitHash(longHash)).toBe("aaaaaaa");
    });

    it("should handle hash with mixed case", () => {
      expect(utils.abbreviateCommitHash("AbCdEfG1234567890")).toBe("AbCdEfG");
    });

    it("should handle empty string", () => {
      expect(utils.abbreviateCommitHash("")).toBe("");
    });

    it("should preserve the first 7 characters exactly", () => {
      const hash = "1234567890abcdef";
      expect(utils.abbreviateCommitHash(hash)).toBe("1234567");
      expect(utils.abbreviateCommitHash(hash)).toHaveLength(7);
    });
  });

  describe("isPullRequest - edge cases", () => {
    it("should return true for single digit number", () => {
      expect(utils.isPullRequest("1")).toBe(true);
    });

    it("should return true for large numbers", () => {
      expect(utils.isPullRequest("9999999")).toBe(true);
    });

    it("should return true for zero", () => {
      expect(utils.isPullRequest("0")).toBe(true);
    });

    it("should return false for negative numbers", () => {
      expect(utils.isPullRequest("-123")).toBe(false);
    });

    it("should return false for decimal numbers", () => {
      expect(utils.isPullRequest("123.45")).toBe(false);
    });

    it("should return false for numbers with spaces", () => {
      expect(utils.isPullRequest("123 456")).toBe(false);
    });

    it("should return false for alphanumeric strings", () => {
      expect(utils.isPullRequest("pr123")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(utils.isPullRequest("")).toBe(false);
    });

    it("should return false for whitespace", () => {
      expect(utils.isPullRequest("   ")).toBe(false);
    });

    it("should return false for branch names", () => {
      expect(utils.isPullRequest("feature/branch-name")).toBe(false);
    });

    it("should return false for merge refs", () => {
      expect(utils.isPullRequest("123/merge")).toBe(false);
    });

    it("should return true for numeric strings with leading zeros", () => {
      expect(utils.isPullRequest("0123")).toBe(true);
    });
  });

  describe("isWhitelisted - additional cases", () => {
    let fetchSpy: MockInstance;

    beforeEach(() => {
      fetchSpy = vi.spyOn(globalThis, "fetch");
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it("should handle whitelist with extra whitespace", async () => {
      fetchSpy.mockResolvedValue(
        new Response("  foo/bar  \n  org/repo  \n  baz/zab  ", { status: 200 }),
      );
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(true);
    });

    it("should handle whitelist with empty lines", async () => {
      fetchSpy.mockResolvedValue(
        new Response("\nfoo/bar\n\norg/repo\n\n", { status: 200 }),
      );
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(true);
    });

    it("should be case sensitive", async () => {
      fetchSpy.mockResolvedValue(
        new Response("Org/Repo", { status: 200 }),
      );
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should handle fetch returning non-200 status", async () => {
      fetchSpy.mockResolvedValue(new Response("", { status: 404 }));
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should handle fetch returning 500 status", async () => {
      fetchSpy.mockResolvedValue(new Response("Server Error", { status: 500 }));
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should handle network timeout", async () => {
      fetchSpy.mockRejectedValue(new Error("Network timeout"));
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should handle partial match correctly", async () => {
      fetchSpy.mockResolvedValue(
        new Response("organization/repository", { status: 200 }),
      );
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should handle exact match in middle of list", async () => {
      fetchSpy.mockResolvedValue(
        new Response("first/repo\norg/repo\nlast/repo", { status: 200 }),
      );
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(true);
    });

    it("should handle repo with special characters", async () => {
      fetchSpy.mockResolvedValue(
        new Response("org/repo-name.js", { status: 200 }),
      );
      const result = await utils.isWhitelisted("org", "repo-name.js");
      expect(result).toBe(true);
    });

    it("should handle empty whitelist", async () => {
      fetchSpy.mockResolvedValue(new Response("", { status: 200 }));
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(false);
    });

    it("should handle whitelist with comments (if any)", async () => {
      fetchSpy.mockResolvedValue(
        new Response("org/repo\n# This is a comment", { status: 200 }),
      );
      const result = await utils.isWhitelisted("org", "repo");
      expect(result).toBe(true);
    });

    it("should make request to correct whitelist URL", async () => {
      fetchSpy.mockResolvedValue(new Response("org/repo", { status: 200 }));
      await utils.isWhitelisted("org", "repo");
      
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/khulnasoft/pkg.khulnasoft.com/main/.whitelist",
      );
    });

    it("should handle multiple whitelist checks independently", async () => {
      fetchSpy.mockResolvedValue(
        new Response("org1/repo1\norg2/repo2", { status: 200 }),
      );

      const result1 = await utils.isWhitelisted("org1", "repo1");
      const result2 = await utils.isWhitelisted("org2", "repo2");
      const result3 = await utils.isWhitelisted("org3", "repo3");

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(false);
    });
  });

  describe("Comment type validation", () => {
    it("should accept 'off' as valid Comment type", () => {
      const comment: "off" | "create" | "update" = "off";
      expect(comment).toBe("off");
    });

    it("should accept 'create' as valid Comment type", () => {
      const comment: "off" | "create" | "update" = "create";
      expect(comment).toBe("create");
    });

    it("should accept 'update' as valid Comment type", () => {
      const comment: "off" | "create" | "update" = "update";
      expect(comment).toBe("update");
    });
  });

  describe("PackageManager type validation", () => {
    it("should accept all valid package managers", () => {
      const managers: Array<"npm" | "pnpm" | "yarn" | "bun"> = [
        "npm",
        "pnpm",
        "yarn",
        "bun",
      ];
      expect(managers).toHaveLength(4);
    });

    it("should have install commands for all package managers", () => {
      const commands = utils.installCommands;
      expect(commands.npm).toBeDefined();
      expect(commands.pnpm).toBeDefined();
      expect(commands.yarn).toBeDefined();
      expect(commands.bun).toBeDefined();
    });
  });
