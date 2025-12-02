import { describe, it, expect } from "vitest";
import type { WorkflowData, PullRequestData, Cursor, WebhookDebugData } from "./types";

describe("Server Types", () => {
  describe("WorkflowData", () => {
    it("should have all required fields", () => {
      const data: WorkflowData = {
        owner: "khulnasoft",
        repo: "pkg.khulnasoft.com",
        sha: "abc1234567890",
        ref: "main",
      };

      expect(data.owner).toBe("khulnasoft");
      expect(data.repo).toBe("pkg.khulnasoft.com");
      expect(data.sha).toBe("abc1234567890");
      expect(data.ref).toBe("main");
    });

    it("should handle branch refs", () => {
      const data: WorkflowData = {
        owner: "owner",
        repo: "repo",
        sha: "sha123",
        ref: "feature/new-feature",
      };

      expect(data.ref).toBe("feature/new-feature");
    });

    it("should handle PR merge refs", () => {
      const data: WorkflowData = {
        owner: "owner",
        repo: "repo",
        sha: "sha123",
        ref: "123/merge",
      };

      expect(data.ref).toBe("123/merge");
    });

    it("should handle tag refs", () => {
      const data: WorkflowData = {
        owner: "owner",
        repo: "repo",
        sha: "sha123",
        ref: "v1.0.0",
      };

      expect(data.ref).toBe("v1.0.0");
    });
  });

  describe("PullRequestData", () => {
    it("should have full_name and ref", () => {
      const data: PullRequestData = {
        full_name: "owner/repo",
        ref: "feature-branch",
      };

      expect(data.full_name).toBe("owner/repo");
      expect(data.ref).toBe("feature-branch");
    });

    it("should handle organization/repo format", () => {
      const data: PullRequestData = {
        full_name: "khulnasoft/pkg.khulnasoft.com",
        ref: "main",
      };

      expect(data.full_name).toContain("/");
      const [owner, repo] = data.full_name.split("/");
      expect(owner).toBe("khulnasoft");
      expect(repo).toBe("pkg.khulnasoft.com");
    });
  });

  describe("Cursor", () => {
    it("should have timestamp and sha", () => {
      const cursor: Cursor = {
        timestamp: Date.now(),
        sha: "abc1234567890",
      };

      expect(cursor.timestamp).toBeGreaterThan(0);
      expect(cursor.sha).toHaveLength(13);
    });

    it("should allow different timestamp formats", () => {
      const cursor1: Cursor = {
        timestamp: 1000000000000,
        sha: "sha1",
      };

      const cursor2: Cursor = {
        timestamp: Date.now(),
        sha: "sha2",
      };

      expect(cursor1.timestamp).toBeLessThan(cursor2.timestamp);
    });

    it("should handle abbreviated SHAs", () => {
      const cursor: Cursor = {
        timestamp: Date.now(),
        sha: "abc1234",
      };

      expect(cursor.sha).toHaveLength(7);
    });

    it("should handle full SHAs", () => {
      const cursor: Cursor = {
        timestamp: Date.now(),
        sha: "abc1234567890def1234567890abcdef12345678",
      };

      expect(cursor.sha).toHaveLength(40);
    });
  });

  describe("WebhookDebugData", () => {
    it("should have all required fields", () => {
      const data: WebhookDebugData = {
        webhookAction: "synchronize",
        originalHeadBranch: "feature-branch",
        originalHeadRepository: "owner/repo",
        originalRepositoryFullName: "owner/repo",
        isPullRequest: true,
        prNumber: 123,
        prNumberType: "number",
        isNewPullRequest: false,
        isOldPullRequest: true,
        prKey: "owner:repo:123",
        oldPrDataHash: "hash123",
        lookupKey: "key123",
        finalWorkflowData: {
          owner: "owner",
          repo: "repo",
          sha: "sha123",
          ref: "123/merge",
        },
      };

      expect(data.webhookAction).toBe("synchronize");
      expect(data.isPullRequest).toBe(true);
      expect(data.prNumber).toBe(123);
      expect(data.finalWorkflowData.owner).toBe("owner");
    });

    it("should handle null values for optional fields", () => {
      const data: WebhookDebugData = {
        webhookAction: "push",
        originalHeadBranch: null,
        originalHeadRepository: null,
        originalRepositoryFullName: null,
        isPullRequest: false,
        prNumber: null,
        prNumberType: "null",
        isNewPullRequest: false,
        isOldPullRequest: false,
        prKey: "",
        oldPrDataHash: "",
        lookupKey: "",
        finalWorkflowData: {
          owner: "owner",
          repo: "repo",
          sha: "sha123",
          ref: "main",
        },
      };

      expect(data.originalHeadBranch).toBeNull();
      expect(data.originalHeadRepository).toBeNull();
      expect(data.prNumber).toBeNull();
      expect(data.isPullRequest).toBe(false);
    });

    it("should track PR lifecycle flags", () => {
      const newPR: WebhookDebugData = {
        webhookAction: "opened",
        originalHeadBranch: "feature",
        originalHeadRepository: "owner/repo",
        originalRepositoryFullName: "owner/repo",
        isPullRequest: true,
        prNumber: 1,
        prNumberType: "number",
        isNewPullRequest: true,
        isOldPullRequest: false,
        prKey: "key",
        oldPrDataHash: "",
        lookupKey: "lookup",
        finalWorkflowData: {
          owner: "owner",
          repo: "repo",
          sha: "sha",
          ref: "1/merge",
        },
      };

      expect(newPR.isNewPullRequest).toBe(true);
      expect(newPR.isOldPullRequest).toBe(false);
    });

    it("should handle different webhook actions", () => {
      const actions = [
        "opened",
        "synchronize",
        "reopened",
        "closed",
        "push",
        "workflow_run",
      ];

      actions.forEach((action) => {
        const data: WebhookDebugData = {
          webhookAction: action,
          originalHeadBranch: null,
          originalHeadRepository: null,
          originalRepositoryFullName: null,
          isPullRequest: action !== "push" && action !== "workflow_run",
          prNumber: null,
          prNumberType: "null",
          isNewPullRequest: false,
          isOldPullRequest: false,
          prKey: "",
          oldPrDataHash: "",
          lookupKey: "",
          finalWorkflowData: {
            owner: "owner",
            repo: "repo",
            sha: "sha",
            ref: "ref",
          },
        };

        expect(data.webhookAction).toBe(action);
      });
    });

    it("should construct PR keys correctly", () => {
      const data: WebhookDebugData = {
        webhookAction: "opened",
        originalHeadBranch: "feature",
        originalHeadRepository: "owner/repo",
        originalRepositoryFullName: "owner/repo",
        isPullRequest: true,
        prNumber: 456,
        prNumberType: "number",
        isNewPullRequest: true,
        isOldPullRequest: false,
        prKey: "owner:repo:456",
        oldPrDataHash: "hash456",
        lookupKey: "lookup456",
        finalWorkflowData: {
          owner: "owner",
          repo: "repo",
          sha: "sha456",
          ref: "456/merge",
        },
      };

      expect(data.prKey).toContain(":");
      const parts = data.prKey.split(":");
      expect(parts).toHaveLength(3);
      expect(parts[2]).toBe("456");
    });
  });

  describe("Type relationships", () => {
    it("should nest WorkflowData in WebhookDebugData", () => {
      const workflowData: WorkflowData = {
        owner: "khulnasoft",
        repo: "pkg.khulnasoft.com",
        sha: "abc123",
        ref: "main",
      };

      const debugData: WebhookDebugData = {
        webhookAction: "push",
        originalHeadBranch: null,
        originalHeadRepository: null,
        originalRepositoryFullName: null,
        isPullRequest: false,
        prNumber: null,
        prNumberType: "null",
        isNewPullRequest: false,
        isOldPullRequest: false,
        prKey: "",
        oldPrDataHash: "",
        lookupKey: "",
        finalWorkflowData: workflowData,
      };

      expect(debugData.finalWorkflowData).toEqual(workflowData);
    });

    it("should handle cursor with workflow SHA", () => {
      const workflowData: WorkflowData = {
        owner: "owner",
        repo: "repo",
        sha: "fullsha1234567890",
        ref: "main",
      };

      const cursor: Cursor = {
        timestamp: Date.now(),
        sha: workflowData.sha,
      };

      expect(cursor.sha).toBe(workflowData.sha);
    });
  });
});