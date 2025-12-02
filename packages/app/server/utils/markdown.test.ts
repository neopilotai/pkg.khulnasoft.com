import { describe, it, expect } from "vitest";
import {
  generateCommitPublishMessage,
  generatePullRequestPublishMessage,
  generatePublishUrl,
} from "./markdown";
import type { WorkflowData } from "../types";
import { abbreviateCommitHash } from "@pkg-khulnasoft/utils";

describe("Markdown Utils", () => {
  const mockWorkflowData: WorkflowData = {
    owner: "khulnasoft",
    repo: "test-repo",
    sha: "abc1234567890def",
    ref: "main",
  };

  const origin = "https://pkg.khulnasoft.com";

  describe("generatePublishUrl", () => {
    it("should generate URL with SHA for base='sha'", () => {
      const url = generatePublishUrl("sha", origin, "my-package", mockWorkflowData, false);
      const abbreviatedSha = abbreviateCommitHash(mockWorkflowData.sha);

      expect(url).toContain(mockWorkflowData.owner);
      expect(url).toContain(mockWorkflowData.repo);
      expect(url).toContain("my-package");
      expect(url).toContain(abbreviatedSha);
    });

    it("should generate URL with ref for base='ref'", () => {
      const url = generatePublishUrl("ref", origin, "my-package", mockWorkflowData, false);

      expect(url).toContain(mockWorkflowData.owner);
      expect(url).toContain(mockWorkflowData.repo);
      expect(url).toContain("my-package");
      expect(url).toContain(mockWorkflowData.ref);
    });

    it("should generate compact URL when compact=true", () => {
      const url = generatePublishUrl("sha", origin, "my-package", mockWorkflowData, true);
      const abbreviatedSha = abbreviateCommitHash(mockWorkflowData.sha);

      expect(url).toBe(`${origin}/my-package@${abbreviatedSha}`);
      expect(url).not.toContain(mockWorkflowData.owner);
      expect(url).not.toContain(mockWorkflowData.repo);
    });

    it("should generate shorter URL when package name equals repo name", () => {
      const dataWithMatchingRepo: WorkflowData = {
        ...mockWorkflowData,
        repo: "my-package",
      };

      const url = generatePublishUrl("sha", origin, "my-package", dataWithMatchingRepo, false);
      const abbreviatedSha = abbreviateCommitHash(dataWithMatchingRepo.sha);

      expect(url).toBe(`${origin}/${dataWithMatchingRepo.owner}/my-package@${abbreviatedSha}`);
    });

    it("should handle scoped package names", () => {
      const url = generatePublishUrl("sha", origin, "@scope/package", mockWorkflowData, false);

      expect(url).toContain("@scope/package");
    });

    it("should abbreviate SHA correctly", () => {
      const url = generatePublishUrl("sha", origin, "my-package", mockWorkflowData, false);
      const fullSha = mockWorkflowData.sha;
      const abbreviatedSha = abbreviateCommitHash(fullSha);

      expect(abbreviatedSha).toHaveLength(7);
      expect(url).toContain(abbreviatedSha);
      expect(url).not.toContain(fullSha);
    });

    it("should use full ref name when base='ref'", () => {
      const dataWithBranch: WorkflowData = {
        ...mockWorkflowData,
        ref: "feature/my-feature",
      };

      const url = generatePublishUrl("ref", origin, "my-package", dataWithBranch, false);

      expect(url).toContain("feature/my-feature");
    });

    it("should handle PR refs correctly", () => {
      const dataWithPR: WorkflowData = {
        ...mockWorkflowData,
        ref: "123/merge",
      };

      const url = generatePublishUrl("ref", origin, "my-package", dataWithPR, false);

      expect(url).toContain("123/merge");
    });
  });

  describe("generateCommitPublishMessage", () => {
    it("should generate message with install commands", () => {
      const packages = ["package-a"];
      const templates = {};
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "npm",
        false,
      );

      expect(message).toContain("npm i");
    });

    it("should include package URL", () => {
      const packages = ["package-a"];
      const templates = {};
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "npm",
        false,
      );

      expect(message).toContain("pkg.khulnasoft.com");
      expect(message).toContain("package-a");
    });

    it("should support multiple package managers", () => {
      const packages = ["package-a"];
      const templates = {};
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "npm,pnpm,yarn",
        false,
      );

      expect(message).toContain("npm i");
      expect(message).toContain("pnpm add");
      expect(message).toContain("yarn add");
    });

    it("should create collapsible blocks for more than 4 packages", () => {
      const packages = ["pkg-1", "pkg-2", "pkg-3", "pkg-4", "pkg-5"];
      const templates = {};
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "npm",
        false,
      );

      expect(message).toContain("<details>");
      expect(message).toContain("<summary>");
      expect(message).toContain("</details>");
    });

    it("should not create collapsible blocks for 4 or fewer packages", () => {
      const packages = ["pkg-1", "pkg-2", "pkg-3", "pkg-4"];
      const templates = {};
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "npm",
        false,
      );

      expect(message).not.toContain("<details>");
    });

    it("should include templates section when templates provided", () => {
      const packages = ["package-a"];
      const templates = {
        "template-a": "https://stackblitz.com/github/owner/repo/tree/abc123/template-a",
      };
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "npm",
        false,
      );

      expect(message).toContain("template-a");
      expect(message).toContain("stackblitz.com");
    });

    it("should show default template link when only default exists", () => {
      const packages = ["package-a"];
      const templates = {
        default: "https://stackblitz.com/github/owner/repo/tree/abc123",
      };
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "npm",
        false,
      );

      expect(message).toContain("Open in StackBlitz");
      expect(message).toContain(templates.default);
    });

    it("should append .tgz for yarn package manager", () => {
      const packages = ["package-a"];
      const templates = {};
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "yarn",
        false,
      );

      expect(message).toContain(".tgz");
    });

    it("should use npx for bin packages with npm", () => {
      const packages = ["cli-package"];
      const templates = {};
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "npm",
        true,
      );

      expect(message).toContain("npx");
      expect(message).not.toContain("npm i");
    });

    it("should use pnpm dlx for bin packages with pnpm", () => {
      const packages = ["cli-package"];
      const templates = {};
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "pnpm",
        true,
      );

      expect(message).toContain("pnpm dlx");
    });

    it("should use bunx for bin packages with bun", () => {
      const packages = ["cli-package"];
      const templates = {};
      const message = generateCommitPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        "bun",
        true,
      );

      expect(message).toContain("bunx");
    });
  });

  describe("generatePullRequestPublishMessage", () => {
    const checkRunUrl = "https://github.com/owner/repo/actions/runs/123";

    it("should generate message with commit link", () => {
      const packages = ["package-a"];
      const templates = {};
      const message = generatePullRequestPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        false,
        checkRunUrl,
        "npm",
        "sha",
        false,
      );

      const abbreviatedSha = abbreviateCommitHash(mockWorkflowData.sha);
      expect(message).toContain("commit:");
      expect(message).toContain(abbreviatedSha);
      expect(message).toContain(checkRunUrl);
    });

    it("should include install commands", () => {
      const packages = ["package-a"];
      const templates = {};
      const message = generatePullRequestPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        false,
        checkRunUrl,
        "npm",
        "sha",
        false,
      );

      expect(message).toContain("npm i");
    });

    it("should omit install commands when onlyTemplates=true", () => {
      const packages = ["package-a"];
      const templates = {};
      const message = generatePullRequestPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        true,
        checkRunUrl,
        "npm",
        "sha",
        false,
      );

      expect(message).not.toContain("npm i");
      expect(message).toContain("commit:");
    });

    it("should support base='ref'", () => {
      const packages = ["package-a"];
      const templates = {};
      const message = generatePullRequestPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        false,
        checkRunUrl,
        "npm",
        "ref",
        false,
      );

      expect(message).toContain(mockWorkflowData.ref);
    });

    it("should create collapsible blocks for more than 4 packages", () => {
      const packages = ["pkg-1", "pkg-2", "pkg-3", "pkg-4", "pkg-5"];
      const templates = {};
      const message = generatePullRequestPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        false,
        checkRunUrl,
        "npm",
        "sha",
        false,
      );

      expect(message).toContain("<details>");
      expect(message).toContain("<summary>");
    });

    it("should handle multiple package managers", () => {
      const packages = ["package-a"];
      const templates = {};
      const message = generatePullRequestPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        false,
        checkRunUrl,
        "npm,bun",
        "sha",
        false,
      );

      expect(message).toContain("npm i");
      expect(message).toContain("bun add");
    });

    it("should include templates with collapsible section for many templates", () => {
      const packages = ["package-a"];
      const templates = {
        "template-1": "https://stackblitz.com/1",
        "template-2": "https://stackblitz.com/2",
        "template-3": "https://stackblitz.com/3",
      };
      const message = generatePullRequestPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        false,
        checkRunUrl,
        "npm",
        "sha",
        false,
      );

      expect(message).toContain("More templates");
      expect(message).toContain("<details>");
    });

    it("should show templates inline for 2 or fewer templates", () => {
      const packages = ["package-a"];
      const templates = {
        "template-1": "https://stackblitz.com/1",
        "template-2": "https://stackblitz.com/2",
      };
      const message = generatePullRequestPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        false,
        false,
        checkRunUrl,
        "npm",
        "sha",
        false,
      );

      expect(message).toContain("template-1");
      expect(message).toContain("template-2");
      expect(message).not.toContain("More templates");
    });

    it("should handle compact URLs", () => {
      const packages = ["package-a"];
      const templates = {};
      const message = generatePullRequestPublishMessage(
        origin,
        templates,
        packages,
        mockWorkflowData,
        true,
        false,
        checkRunUrl,
        "npm",
        "sha",
        false,
      );

      expect(message).toContain("pkg.khulnasoft.com");
      expect(message).not.toContain("/khulnasoft/test-repo/");
    });
  });
});