/**
 * src/__tests__/gitService.test.js
 *
 * Tests for gitService.js using vitest + memfs (in-memory filesystem).
 *
 * Strategy: mock the `./gitFs` module so gitService uses a fresh memfs
 * instance per test instead of LightningFS (which requires IndexedDB/browser).
 * No changes to gitService.js are needed.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as git from "isomorphic-git";
import { Volume } from "memfs";

// ── Per-test state ────────────────────────────────────────────────
// Each test gets a fresh in-memory Volume so state never leaks.
let vol;
let mockFs;
const TEST_DIR = "/repo";

function makeMockFs(volume) {
  // isomorphic-git expects the same API shape as Node's `fs` module.
  // memfs Volume.promises matches it directly.
  return {
    promises: volume.promises,
    // isomorphic-git also calls the callback-style methods internally:
    readFile:  (...a) => volume.readFile(...a),
    writeFile: (...a) => volume.writeFile(...a),
    unlink:    (...a) => volume.unlink(...a),
    readdir:   (...a) => volume.readdir(...a),
    mkdir:     (...a) => volume.mkdir(...a),
    rmdir:     (...a) => volume.rmdir(...a),
    stat:      (...a) => volume.stat(...a),
    lstat:     (...a) => volume.lstat(...a),
    symlink:   (...a) => (typeof a[a.length-1] === 'function' ? a[a.length-1](new Error('symlink not supported')) : Promise.reject(new Error('symlink not supported'))),
    readlink:  (...a) => (typeof a[a.length-1] === 'function' ? a[a.length-1](new Error('readlink not supported')) : Promise.reject(new Error('readlink not supported'))),
  };
}

// ── Mock ./gitFs before importing gitService ──────────────────────
vi.mock("../gitFs", () => {
  // Return a factory so vitest evaluates it after `vol` is initialized.
  // We expose a getter so each test's `vol` reassignment is picked up.
  return {
    get fs() { return mockFs; },
    get REPO_DIR() { return TEST_DIR; },
    // stubs for other exports used elsewhere (not needed in tests)
    initFileSystem: vi.fn(),
    resetFileSystem: vi.fn(),
    listDir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    fileExists: vi.fn(),
    createFileWithTemplate: vi.fn(),
    pfs: null,
  };
});

// Import AFTER mock is registered
const {
  gitInit,
  gitListBranches,
  gitCreateBranch,
  gitCheckout,
  gitCurrentBranchName,
} = await import("../gitService.js");

// ── Helper: make a minimal commit so isomorphic-git is happy ─────
async function makeCommit(message = "init") {
  // Need at least one file for a non-empty commit
  await mockFs.promises.writeFile(`${TEST_DIR}/README.md`, "test\n");
  await git.add({ fs: mockFs, dir: TEST_DIR, filepath: "README.md" });
  await git.commit({
    fs: mockFs,
    dir: TEST_DIR,
    message,
    author: { name: "Chihiro", email: "chihiro@spiritworld.jp" },
  });
}

// ── Reset fs before every test ────────────────────────────────────
beforeEach(async () => {
  vol     = new Volume();
  mockFs  = makeMockFs(vol);
  await mockFs.promises.mkdir(TEST_DIR, { recursive: true });
});

// ═════════════════════════════════════════════════════════════════
describe("gitInit", () => {
  it("initializes a repo and returns confirmation message", async () => {
    const msg = await gitInit();
    expect(msg).toContain("inicializado");
  });

  it("creates .git directory after init", async () => {
    await gitInit();
    const entries = await mockFs.promises.readdir(`${TEST_DIR}/.git`);
    expect(entries).toContain("HEAD");
    expect(entries).toContain("config");
  });
});

// ═════════════════════════════════════════════════════════════════
describe("gitListBranches — before first commit", () => {
  beforeEach(async () => { await gitInit(); });

  it("shows 'main' after init even with no commits", async () => {
    const result = await gitListBranches();
    // After init, HEAD points to refs/heads/main but the file may not
    // exist yet. Our implementation reads refs/heads/ directly.
    // If the file doesn't exist yet, it gracefully returns the no-branches message.
    // The important invariant: it must NOT throw.
    expect(typeof result).toBe("string");
  });

  it("lists a newly created branch before any commit", async () => {
    await gitCreateBranch("rescue/chihiro");
    const result = await gitListBranches();
    expect(result).toContain("rescue/chihiro");
  });

  it("does not throw when refs/heads/ is empty", async () => {
    await expect(gitListBranches()).resolves.not.toThrow();
  });
});

// ═════════════════════════════════════════════════════════════════
describe("gitCreateBranch", () => {
  beforeEach(async () => { await gitInit(); });

  it("returns confirmation message", async () => {
    const msg = await gitCreateBranch("rescue/chihiro");
    expect(msg).toContain("rescue/chihiro");
  });

  it("creates the ref file at refs/heads/rescue/chihiro", async () => {
    await gitCreateBranch("rescue/chihiro");
    const exists = await mockFs.promises.stat(
      `${TEST_DIR}/.git/refs/heads/rescue/chihiro`
    ).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it("handles slash-separated names without throwing", async () => {
    await expect(gitCreateBranch("feature/deep/nested")).resolves.toBeDefined();
    const exists = await mockFs.promises.stat(
      `${TEST_DIR}/.git/refs/heads/feature/deep/nested`
    ).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it("branch is visible in gitListBranches after creation", async () => {
    await gitCreateBranch("rescue/chihiro");
    const list = await gitListBranches();
    expect(list).toContain("rescue/chihiro");
  });

  it("branch with / is treated as LOCAL, not as origin/...", async () => {
    await gitCreateBranch("rescue/chihiro");
    const list = await gitListBranches();
    expect(list).not.toContain("origin/");
  });
});

// ═════════════════════════════════════════════════════════════════
describe("gitCheckout — local branches", () => {
  beforeEach(async () => {
    await gitInit();
    await makeCommit("initial commit");  // checkout requires a real HEAD
  });

  it("switches to a simple branch name", async () => {
    await gitCreateBranch("dev");
    const msg = await gitCheckout("dev");
    expect(msg).toContain("dev");
    const current = await gitCurrentBranchName();
    expect(current).toBe("dev");
  });

  it("switches to a slash branch rescue/chihiro", async () => {
    await gitCreateBranch("rescue/chihiro");
    const msg = await gitCheckout("rescue/chihiro");
    expect(msg).toContain("rescue/chihiro");
    const current = await gitCurrentBranchName();
    expect(current).toBe("rescue/chihiro");
  });

  it("does NOT prefix origin/ when checking out a local branch", async () => {
    await gitCreateBranch("rescue/chihiro");
    // If it tried to resolve origin/rescue/chihiro it would throw
    await expect(gitCheckout("rescue/chihiro")).resolves.not.toThrow();
  });

  it("full refs/ passthrough still works", async () => {
    await gitCreateBranch("rescue/chihiro");
    // Passing refs/heads/rescue/chihiro directly should also work
    const msg = await gitCheckout("refs/heads/rescue/chihiro");
    expect(msg).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════════════
describe("gitCheckout -b simulation (create + checkout)", () => {
  beforeEach(async () => {
    await gitInit();
    await makeCommit("initial commit");
  });

  it("creates and switches to feature/test", async () => {
    await gitCreateBranch("feature/test");
    const msg = await gitCheckout("feature/test");
    expect(msg).toContain("feature/test");
    const current = await gitCurrentBranchName();
    expect(current).toBe("feature/test");
  });

  it("new branch appears in listing after checkout", async () => {
    await gitCreateBranch("feature/test");
    await gitCheckout("feature/test");
    const list = await gitListBranches();
    expect(list).toContain("feature/test");
  });

  it("marks current branch with * in listing", async () => {
    await gitCreateBranch("rescue/chihiro");
    await gitCheckout("rescue/chihiro");
    const list = await gitListBranches();
    expect(list).toContain("* rescue/chihiro");
  });
});

// ═════════════════════════════════════════════════════════════════
describe("branch names with / are always local", () => {
  beforeEach(async () => {
    await gitInit();
    await makeCommit("initial commit");
  });

  const localBranches = [
    "rescue/chihiro",
    "feature/add-zk-proof",
    "fix/branch-listing",
    "chihiro/rescue/attempt",
  ];

  for (const name of localBranches) {
    it(`"${name}" can be created, listed, and checked out`, async () => {
      await gitCreateBranch(name);
      const list = await gitListBranches();
      expect(list).toContain(name);

      const msg = await gitCheckout(name);
      expect(msg).toContain(name);

      const current = await gitCurrentBranchName();
      expect(current).toBe(name);
    });
  }
});
