import {
  describe,
  expect,
  it,
} from "vitest";
import {
  passwordCriterionRows,
  passwordStrengthLabel,
  profileEditIsDirty,
  validateAvatarUrl,
  validateNewPassword,
  validatePasswordMatch,
  validateProfileName,
} from "@/utils/profile-validation";

const LONG_NAME = "x".repeat(101);
const LONG_AVATAR = `https://example.com/${"x".repeat(2100)}.png`;

describe("validateProfileName", () => {
  it("accepts names inside the 2–100 band", () => {
    expect(validateProfileName("Ada Lovelace")).toBeNull();
    expect(validateProfileName("  Ada  ")).toBeNull();
    expect(validateProfileName("x".repeat(100))).toBeNull();
  });

  it("rejects names outside the band", () => {
    expect(validateProfileName("A")).toBe("Name must be at least 2 characters.");
    expect(validateProfileName(LONG_NAME)).toBe("Name must be at most 100 characters.");
  });
});

describe("validateAvatarUrl", () => {
  it("treats an empty value as removal (null)", () => {
    expect(validateAvatarUrl("")).toBeNull();
  });

  it("accepts https URLs only", () => {
    expect(validateAvatarUrl("https://avatars.example.com/u/1.png")).toBeNull();
    expect(validateAvatarUrl("http://avatars.example.com/u/1.png")).toBe(
      "Avatar must be a valid https URL.",
    );
    expect(validateAvatarUrl("ftp://avatars.example.com/u/1.png")).toBe(
      "Avatar must be a valid https URL.",
    );
    expect(validateAvatarUrl("not a url")).toBe("Avatar must be a valid https URL.");
  });

  it("caps the avatar field length", () => {
    expect(validateAvatarUrl(LONG_AVATAR)).toBe("Avatar URL is too long.");
  });
});

describe("passwordCriterionRows", () => {
  it("tracks the four mockup checks in order", () => {
    const rows = passwordCriterionRows("Password1!");
    expect(rows.map((row) => row.id)).toEqual(["length", "case", "digit", "special"]);
    expect(rows.every((row) => row.met)).toBe(true);
  });

  it("marks every check unmet for empty input", () => {
    for (const row of passwordCriterionRows("")) {
      expect(row.met).toBe(false);
    }
  });

  it("allows the 128-character ceiling", () => {
    const edge = `A1!${"!".repeat(125)}`;
    expect(edge.length).toBe(128);
    expect(passwordCriterionRows(edge)[0]?.met).toBe(true);
  });
});

describe("validateNewPassword", () => {
  const CURRENT = "Passw0rd!";
  const MESSAGE_REUSE = "New password must be different from your current password.";

  it("skips validation for empty input (gated at submit)", () => {
    expect(validateNewPassword("", CURRENT)).toBeNull();
  });

  it("stores length bounds first", () => {
    expect(validateNewPassword("a1B2", CURRENT)).toBe("Password must be at least 8 characters.");
    expect(validateNewPassword(`${"a1B".repeat(44)}a`, CURRENT)).toBe(
      `Password must be at most 128 characters.`,
    );
  });

  it("rejects reusing the current password", () => {
    expect(validateNewPassword(CURRENT, CURRENT)).toBe(MESSAGE_REUSE);
    expect(validateNewPassword("Different1!", CURRENT)).toBeNull();
  });
});

describe("validatePasswordMatch", () => {
  it("passes silently until both fields have values", () => {
    expect(validatePasswordMatch("a", "a")).toBeNull();
    expect(validatePasswordMatch("a", "")).toBeNull();
  });

  it("flags divergence", () => {
    expect(validatePasswordMatch("a", "b")).toBe("Passwords do not match.");
  });
});

describe("passwordStrengthLabel", () => {
  it("maps criteria counts to weak/fair/strong", () => {
    expect(passwordStrengthLabel(0)).toBe("Weak");
    expect(passwordStrengthLabel(1)).toBe("Weak");
    expect(passwordStrengthLabel(2)).toBe("Fair");
    expect(passwordStrengthLabel(3)).toBe("Strong");
    expect(passwordStrengthLabel(4)).toBe("Strong");
    expect(passwordStrengthLabel(99)).toBe("Strong");
  });
});

describe("profileEditIsDirty", () => {
  it("ignores whitespace-only avatar changes", () => {
    expect(profileEditIsDirty({ name: "Ada", avatarUrl: "" }, { name: "Ada", avatarUrl: "  " })).toBe(
      false,
    );
  });

  it("flags real deltas on name or avatar", () => {
    expect(
      profileEditIsDirty({ name: "Ada", avatarUrl: "" }, { name: "Ada B", avatarUrl: "" }),
    ).toBe(true);
    expect(
      profileEditIsDirty(
        { name: "Ada", avatarUrl: "https://a.png" },
        { name: "Ada", avatarUrl: "https://b.png" },
      ),
    ).toBe(true);
    expect(
      profileEditIsDirty({ name: "Ada", avatarUrl: "" }, { name: "Ada", avatarUrl: "" }),
    ).toBe(false);
  });
});
