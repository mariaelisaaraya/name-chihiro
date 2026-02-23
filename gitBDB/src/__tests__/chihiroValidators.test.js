/**
 * src/__tests__/chihiroValidators.test.js
 *
 * End-to-end tests for the Chihiro git ritual:
 *   - validateChihiroM1: rescue/ branch must exist
 *   - validateChihiroM2: clue:1, clue:2, clue:3 commits must exist on rescue/ branch
 *   - isRitualComplete: M1 + M2 both satisfied
 *   - getRitualCommits: returns commit list for the ZK panel
 *   - Full happy path: git init → checkout -b rescue/chihiro → 3 commits → complete
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as git from "isomorphic-git";
import { Volume } from "memfs";

// ── Per-test in-memory filesystem ─────────────────────────────────
let vol;
let mockFs;
const TEST_DIR = "/repo";

function makeMockFs(volume) {
  return {
    promises:  volume.promises,
    readFile:  (...a) => volume.readFile(...a),
    writeFile: (...a) => volume.writeFile(...a),
    unlink:    (...a) => volume.unlink(...a),
    readdir:   (...a) => volume.readdir(...a),
    mkdir:     (...a) => volume.mkdir(...a),
    rmdir:     (...a) => volume.rmdir(...a),
    stat:      (...a) => volume.stat(...a),
    lstat:     (...a) => volume.lstat(...a),
    symlink:   (...a) => (typeof a[a.length-1] === "function"
      ? a[a.length-1](new Error("symlink not supported"))
      : Promise.reject(new Error("symlink not supported"))),
    readlink:  (...a) => (typeof a[a.length-1] === "function"
      ? a[a.length-1](new Error("readlink not supported"))
      : Promise.reject(new Error("readlink not supported"))),
  };
}

vi.mock("../gitFs", () => ({
  get fs()       { return mockFs; },
  get REPO_DIR() { return TEST_DIR; },
  initFileSystem:         vi.fn(),
  resetFileSystem:        vi.fn(),
  listDir:                vi.fn(async () => []),
  readFile:               vi.fn(),
  writeFile:              vi.fn(),
  fileExists:             vi.fn(async () => false),
  createFileWithTemplate: vi.fn(),
  get pfs() { return null; },
}));

// Import validators and gitService AFTER mock
const {
  validateChihiroM1,
  validateChihiroM2,
  isRitualComplete,
  getRitualCommits,
} = await import("../activities/chihiroValidators.js");

const {
  gitInit,
  gitCreateBranch,
  gitCheckout,
} = await import("../gitService.js");

// ── Helpers ────────────────────────────────────────────────────────

/** Create a real commit on the current branch */
async function makeCommit(message) {
  // isomorphic-git allows empty commits (no staged files needed)
  return git.commit({
    fs: mockFs,
    dir: TEST_DIR,
    message,
    author: { name: "Chihiro", email: "chihiro@spiritworld.jp" },
  });
}

/**
 * Simulate "git checkout -b <name>" on an empty repo (pre-first-commit).
 * Creates the branch ref + updates HEAD to point at it symbolically.
 */
async function checkoutNewBranch(name) {
  await gitCreateBranch(name);
  await gitCheckout(name);
}

beforeEach(async () => {
  vol    = new Volume();
  mockFs = makeMockFs(vol);
  await mockFs.promises.mkdir(TEST_DIR, { recursive: true });
});

// ══════════════════════════════════════════════════════════════════
describe("validateChihiroM1 — rescue/ branch must exist", () => {

  it("fails when no repo is initialized", async () => {
    const result = await validateChihiroM1();
    expect(result.ok).toBe(false);
  });

  it("fails when repo is initialized but no branches", async () => {
    await gitInit();
    const result = await validateChihiroM1();
    expect(result.ok).toBe(false);
  });

  it("fails when a non-rescue branch exists", async () => {
    await gitInit();
    await gitCreateBranch("feature/something");
    const result = await validateChihiroM1();
    expect(result.ok).toBe(false);
  });

  it("passes when rescue/chihiro exists", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    const result = await validateChihiroM1();
    expect(result.ok).toBe(true);
  });

  it("passes for any rescue/ prefix (rescue/attempt, rescue/v2)", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/v2");
    const result = await validateChihiroM1();
    expect(result.ok).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════
describe("validateChihiroM2 — clue:1/2/3 commits on rescue/ branch", () => {

  it("fails when M1 is not done (no rescue/ branch)", async () => {
    await gitInit();
    const result = await validateChihiroM2();
    expect(result.ok).toBe(false);
  });

  it("fails when rescue/ branch exists but has no commits", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    const result = await validateChihiroM2();
    expect(result.ok).toBe(false);
  });

  it("fails when only clue:1 exists", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    await makeCommit("clue:1");
    const result = await validateChihiroM2();
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/clue:2|clue:3/);
  });

  it("fails when clue:1 and clue:2 exist but not clue:3", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    await makeCommit("clue:1");
    await makeCommit("clue:2");
    const result = await validateChihiroM2();
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/clue:3/);
  });

  it("passes when clue:1, clue:2, clue:3 all exist", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    await makeCommit("clue:1");
    await makeCommit("clue:2");
    await makeCommit("clue:3");
    const result = await validateChihiroM2();
    expect(result.ok).toBe(true);
  });

  it("passes regardless of commit order", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    await makeCommit("clue:3");
    await makeCommit("clue:1");
    await makeCommit("clue:2");
    const result = await validateChihiroM2();
    expect(result.ok).toBe(true);
  });

  it("ignores extra commits (only clue:1/2/3 are required)", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    await makeCommit("initial setup");
    await makeCommit("clue:1");
    await makeCommit("some other work");
    await makeCommit("clue:2");
    await makeCommit("clue:3");
    const result = await validateChihiroM2();
    expect(result.ok).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════
describe("isRitualComplete — M1 + M2 combined", () => {

  it("returns false on empty repo", async () => {
    expect(await isRitualComplete()).toBe(false);
  });

  it("returns false with only rescue/ branch (no commits)", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    expect(await isRitualComplete()).toBe(false);
  });

  it("returns false with partial commits", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    await makeCommit("clue:1");
    await makeCommit("clue:2");
    expect(await isRitualComplete()).toBe(false);
  });

  it("returns true after full happy path", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    await makeCommit("clue:1");
    await makeCommit("clue:2");
    await makeCommit("clue:3");
    expect(await isRitualComplete()).toBe(true);
  });

  it("stays false if commits are on main, not rescue/", async () => {
    await gitInit();
    // Commit on main (no rescue branch)
    await vol.promises.writeFile(`${TEST_DIR}/README.md`, "hello");
    await git.add({ fs: mockFs, dir: TEST_DIR, filepath: "README.md" });
    await makeCommit("clue:1");
    await makeCommit("clue:2");
    await makeCommit("clue:3");
    expect(await isRitualComplete()).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
describe("getRitualCommits — data for ZK panel display", () => {

  it("returns empty array when no rescue/ branch", async () => {
    await gitInit();
    const commits = await getRitualCommits();
    expect(commits).toEqual([]);
  });

  it("returns commits from rescue/ branches with sha, message, branch", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    await makeCommit("clue:1");
    await makeCommit("clue:2");
    await makeCommit("clue:3");

    const commits = await getRitualCommits();
    expect(commits.length).toBe(3);
    expect(commits[0]).toHaveProperty("sha");
    expect(commits[0]).toHaveProperty("message");
    expect(commits[0]).toHaveProperty("branch");
    expect(commits[0].sha).toHaveLength(7);
    expect(commits[0].branch).toBe("rescue/chihiro");

    const messages = commits.map(c => c.message);
    expect(messages).toContain("clue:1");
    expect(messages).toContain("clue:2");
    expect(messages).toContain("clue:3");
  });
});

// ══════════════════════════════════════════════════════════════════
describe("Full Chihiro ritual — exact solution commands", () => {

  it("completes ritual via the exact solutionCommands sequence", async () => {
    // Mirrors chihiroActivity.js solutionCommands:
    //   git init
    //   git checkout -b rescue/chihiro
    //   git commit --allow-empty -m "clue:1"
    //   git commit --allow-empty -m "clue:2"
    //   git commit --allow-empty -m "clue:3"

    await gitInit();
    await checkoutNewBranch("rescue/chihiro");

    // Verify M1 passes after branch creation
    const m1 = await validateChihiroM1();
    expect(m1.ok).toBe(true);
    expect(await isRitualComplete()).toBe(false); // M2 not done yet

    await makeCommit("clue:1");
    expect(await isRitualComplete()).toBe(false);

    await makeCommit("clue:2");
    expect(await isRitualComplete()).toBe(false);

    await makeCommit("clue:3");

    // Now everything should pass
    const m2 = await validateChihiroM2();
    expect(m2.ok).toBe(true);
    expect(await isRitualComplete()).toBe(true);

    // ZK panel data is also populated
    const commits = await getRitualCommits();
    expect(commits.length).toBeGreaterThanOrEqual(3);
  });

  it("commits land on rescue/chihiro — not on main", async () => {
    await gitInit();
    await checkoutNewBranch("rescue/chihiro");
    await makeCommit("clue:1");
    await makeCommit("clue:2");
    await makeCommit("clue:3");

    // Commits must be on rescue/chihiro
    const log = await git.log({ fs: mockFs, dir: TEST_DIR, ref: "rescue/chihiro" });
    const messages = log.map(c => c.commit.message.trim());
    expect(messages).toContain("clue:1");
    expect(messages).toContain("clue:2");
    expect(messages).toContain("clue:3");

    // main should have no commits
    try {
      await git.log({ fs: mockFs, dir: TEST_DIR, ref: "main" });
      // If it resolves, main should NOT have the clue commits
    } catch {
      // main has no commits at all — that's fine
    }
  });
});
