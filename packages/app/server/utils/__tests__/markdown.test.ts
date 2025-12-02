import { describe, it, expect } from "vitest";
import {
  generateCommitPublishMessage,
  generatePullRequestPublishMessage,
  generatePublishUrl,
} from "../markdown";
import type { WorkflowData } from "../../types";

describe("markdown utils", () => {
  const mockWorkflowData: WorkflowData = {
    owner: "testorg",
    repo: "testrepo",
    sha: "1234567890abcdef1234567890abcdef12345678",
    ref: "main",
    actor: 12345,
  };

  describe("generatePublishUrl", () => {
    it("should generate URL with sha base", () => {
      const url = generatePublishUrl(
        "sha",
        "https://pkg.khulnasoft.com",
        "my-package",
        mockWorkflowData,
        false,
      );

      expect(url).toContain("testorg/testrepo/my-package@1234567");
    });

    it("should generate URL with ref base", () => {
      const url = generatePublishUrl(
        "ref",
        "https://pkg.khulnasoft.com",
        "my-package",
        mockWorkflowData,
        false,
      );

      expect(url).toContain("testorg/testrepo/my-package@main");
    });

    it("should generate compact URL when enabled", () => {
      const url = generatePublishUrl(
        "sha",
        "https://pkg.khulnasoft.com",
        "my-package",
        mockWorkflowData,
        true,
      );

      expect(url).toBe("https://pkg.khulnasoft.com/my-package@1234567");
      expect(url).not.toContain("testorg");
      expect(url).not.toContain("testrepo");
    });

    it("should omit repo name when package name matches repo", () => {
      const url = generatePublishUrl(
        "sha",
        "https://pkg.khulnasoft.com",
        "testrepo",
        mockWorkflowData,
        false,
      );

      expect(url).toBe("https://pkg.khulnasoft.com/testorg/testrepo@1234567");
    });

    it("should handle different origins", () => {
      const url = generatePublishUrl(
        "sha",
        "https://example.com",
        "package",
        mockWorkflowData,
        false,
      );

      expect(url).toContain("https://example.com/");
    });

    it("should abbreviate commit hash to 7 characters", () => {
      const url = generatePublishUrl(
        "sha",
        "https://pkg.khulnasoft.com",
        "package",
        mockWorkflowData,
        false,
      );

      expect(url).toContain("@1234567");
      expect(url).not.toContain("1234567890abcdef");
    });
  });

  describe("generateCommitPublishMessage", () => {
    it("should generate message with package install commands", () => {
      const message = generateCommitPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
        ["package-a"],
        mockWorkflowData,
        false,
        "npm",
        false,
      );

      expect(message).toContain("npm i");
      expect(message).toContain("package-a");
    });

    it("should include templates when provided", () => {
      const templates = {
        "template-1": "https://khulnasoft.com/template1",
        default: "https://khulnasoft.com/default",
      };

      const message = generateCommitPublishMessage(
        "https://pkg.khulnasoft.com",
        templates,
        ["package-a"],
        mockWorkflowData,
        false,
        "npm",
        false,
      );

      expect(message).toContain("template-1");
      expect(message).toContain("https://khulnasoft.com/template1");
    });

    it("should support multiple package managers", () => {
      const message = generateCommitPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
        ["package-a"],
        mockWorkflowData,
        false,
        "npm,pnpm,yarn,bun",
        false,
      );

      expect(message).toContain("npm i");
      expect(message).toContain("pnpm add");
      expect(message).toContain("yarn add");
      expect(message).toContain("bun add");
    });

    it("should add .tgz extension for yarn", () => {
      const message = generateCommitPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
        ["package-a"],
        mockWorkflowData,
        false,
        "yarn",
        false,
      );

      expect(message).toContain(".tgz");
      expect(message).toContain("package-a@");
    });

    it("should use bin commands when bin flag is true", () => {
      const message = generateCommitPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
        ["cli-tool"],
        mockWorkflowData,
        false,
        "npm",
        true,
      );

      expect(message).toContain("npx");
      expect(message).not.toContain("npm i");
    });

    it("should create collapsible blocks for more than 4 packages", () => {
      const packages = ["pkg-1", "pkg-2", "pkg-3", "pkg-4", "pkg-5"];
      const message = generateCommitPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
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
      const message = generateCommitPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
        packages,
        mockWorkflowData,
        false,
        "npm",
        false,
      );

      expect(message).not.toContain("<details>");
      expect(message).not.toContain("<summary>");
    });
  });

  describe("generatePullRequestPublishMessage", () => {
    it("should include commit link in message", () => {
      const message = generatePullRequestPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
        ["package-a"],
        mockWorkflowData,
        false,
        false,
        "https://github.com/org/repo/runs/123",
        "npm",
        "sha",
        false,
      );

      expect(message).toContain("_commit:");
      expect(message).toContain("<a href=");
      expect(message).toContain("1234567");
    });

    it("should omit package installation commands when onlyTemplates is true", () => {
      const message = generatePullRequestPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
        ["package-a"],
        mockWorkflowData,
        false,
        true,
        "https://github.com/org/repo/runs/123",
        "npm",
        "ref",
        false,
      );

      expect(message).not.toContain("npm i");
    });

    it("should include package installation commands when onlyTemplates is false", () => {
      const message = generatePullRequestPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
        ["package-a"],
        mockWorkflowData,
        false,
        false,
        "https://github.com/org/repo/runs/123",
        "npm",
        "ref",
        false,
      );

      expect(message).toContain("npm i");
    });

    it("should use ref for URLs when base is ref", () => {
      const message = generatePullRequestPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
        ["package-a"],
        mockWorkflowData,
        false,
        false,
        "https://github.com/org/repo/runs/123",
        "npm",
        "ref",
        false,
      );

      expect(message).toContain("@main");
      expect(message).not.toContain("@1234567");
    });

    it("should use sha for URLs when base is sha", () => {
      const message = generatePullRequestPublishMessage(
        "https://pkg.khulnasoft.com",
        {},
        ["package-a"],
        mockWorkflowData,
        false,
        false,
        "https://github.com/org/repo/runs/123",
        "npm",
        "sha",
        false,
      );

      expect(message).toContain("@1234567");
      expect(message).not.toContain("@main");
    });

    it("should handle multiple templates with collapsible block", () => {
      const templates = {
        "template-1": "https://khulnasoft.com/t1",
        "template-2": "https://khulnasoft.com/t2",
        "template-3": "https://khulnasoft.com/t3",
      };

      const message = generatePullRequestPublishMessage(
        "https://pkg.khulnasoft.com",
        templates,
        ["package-a"],
        mockWorkflowData,
        false,
        false,
        "https://github.com/org/repo/runs/123",
        "npm",
        "ref",
        false,
      );

      expect(message).toContain("<details>");
      expect(message).toContain("More templates");
    });

    it("should show default template when only default exists", () => {
      const templates = {
        default: "https://khulnasoft.com/default",
      };

      const message = generatePullRequestPublishMessage(
        "https://pkg.khulnasoft.com",
        templates,
        ["package-a"],
        mockWorkflowData,
        false,
        false,
        "https://github.com/org/repo/runs/123",
        "npm",
        "ref",
        false,
      );

      expect(message).toContain("Open in StackBlitz");
      expect(message).toContain("https://khulnasoft.com/default");
    });
  });
});