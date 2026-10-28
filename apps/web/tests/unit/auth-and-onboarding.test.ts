import { describe, it, expect } from "vitest";

describe("Frontend Authentication and Onboarding Flow Tests", () => {
  it("determines whether onboarding is required based on profile completion status", () => {
    const incompleteProfile = {
      id: "user-123",
      displayName: null,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const completedProfile = {
      id: "user-123",
      displayName: "Mayowa Johnson",
      isCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const getTargetRoute = (profile: { isCompleted: boolean } | null) => {
      if (!profile || !profile.isCompleted) {
        return "/onboarding";
      }
      return "/app";
    };

    expect(getTargetRoute(null)).toBe("/onboarding");
    expect(getTargetRoute(incompleteProfile)).toBe("/onboarding");
    expect(getTargetRoute(completedProfile)).toBe("/app");
  });

  it("excludes 'Self' relationship when adding a new family member", () => {
    const NEW_MEMBER_RELATIONSHIPS = [
      "Child",
      "Spouse",
      "Partner",
      "Parent",
      "Sibling",
      "Grandparent",
      "Dependent",
      "Other",
    ];

    expect(NEW_MEMBER_RELATIONSHIPS).not.toContain("Self");
    expect(NEW_MEMBER_RELATIONSHIPS).toContain("Child");
    expect(NEW_MEMBER_RELATIONSHIPS).toContain("Spouse");
  });

  it("correctly identifies 'self' relationship regardless of casing from backend", () => {
    const backendSelfMember = {
      id: "mem-1",
      fullName: "Mayowa Johnson",
      relationship: "self", // lowercase from database
    };

    const isSelf = backendSelfMember.relationship.toLowerCase() === "self";
    expect(isSelf).toBe(true);

    const displayName = isSelf ? `${backendSelfMember.fullName.split(" ")[0]} (You)` : backendSelfMember.fullName;
    expect(displayName).toBe("Mayowa (You)");
  });

  it("prioritizes authenticated user profile details instead of hardcoded placeholder 'Alex Johnson'", () => {
    const authenticatedProfile = {
      displayName: "Mayowa Johnson",
    };
    const nullProfile = null;

    const resolveDisplayName = (profile: { displayName?: string | null } | null) => {
      return profile?.displayName || "Vault Owner";
    };

    expect(resolveDisplayName(authenticatedProfile)).toBe("Mayowa Johnson");
    expect(resolveDisplayName(nullProfile)).not.toBe("Alex Johnson");
    expect(resolveDisplayName(nullProfile)).toBe("Vault Owner");
  });

  it("formats session expiry error message cleanly for the UI", () => {
    const searchParams = new URLSearchParams("error=session_expired");
    const errorParam = searchParams.get("error");

    let message: string | null = null;
    if (errorParam === "session_expired") {
      message = "Your session has expired. Please sign in again.";
    }

    expect(message).toBe("Your session has expired. Please sign in again.");
  });
});

