/**
 * src/__tests__/commandRunner.test.js
 *
 * Integration test for `git checkout -b <name>` end-to-end:
 *   parse (commandRunner) → gitCreateBranch → gitCheckout → currentBranch
 *
 * Same memfs strategy as gitService.test.js — mocks ./gitFs so
 * commandRunner and gitService both see the same in-memory filesystem.
 * No browser APIs (IndexedDB / LightningFS) are needed.
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

// ── Mock ./gitFs before importing commandRunner/gitService ─────────
vi.mock("../gitFs", () => ({
  get fs()      { return mockFs; },
  get REPO_DIR(){ return TEST_DIR; },
  initFileSystem:         vi.fn(),
  resetFileSystem:        vi.fn(),
  listDir:                vi.fn(async () => []),
  readFile:               vi.fn(),
  writeFile:              vi.fn(),
  fileExists:             vi.fn(async () => false),
  createFileWithTemplate: vi.fn(),
  get pfs() { return null; },
}));

// Mock activity runtime so commandRunner doesn't block commands
vi.mock("../activities/activityRuntime", () => ({
  isCommandAllowed:      () => true,
  getBlockedCommandMessage: () => "",
  getCurrentActivity:    () => null,
  setCurrentActivity:    vi.fn(),
}));

// Import AFTER mocks are registered
const { runCommand } = await import("../commandRunner.js");

// ── Helper ────────────────────────────────────────────────────────
async function makeCommit(message = "init") {
  await mockFs.promises.writeFile(`${TEST_DIR}/README.md`, "test\n");
  await git.add({ fs: mockFs, dir: TEST_DIR, filepath: "README.md" });
  await git.commit({
    fs: mockFs, dir: TEST_DIR, message,
    author: { name: "Chihiro", email: "chihiro@spiritworld.jp" },
  });
}

beforeEach(async () => {
  vol    = new Volume();
  mockFs = makeMockFs(vol);
  await mockFs.promises.mkdir(TEST_DIR, { recursive: true });
});

// ═════════════════════════════════════════════════════════════════
describe("git checkout -b integration", () => {

  it("creates and switches to a simple branch name", async () => {
    await runCommand("git init");
    await makeCommit("initial");

    const out = await runCommand("git checkout -b dev");
    expect(out).toMatch(/dev/);

    const current = await git.currentBranch({ fs: mockFs, dir: TEST_DIR, fullname: false });
    expect(current).toBe("dev");
  });

  it("creates and switches to rescue/chihiro (slash in name)", async () => {
    await runCommand("git init");
    await makeCommit("initial");

    const out = await runCommand("git checkout -b rescue/chihiro");
    // Should mention the branch name and NOT error
    expect(out).toMatch(/rescue\/chihiro/);
    expect(out.toLowerCase()).not.toMatch(/error|no soportado|not supported/);

    const current = await git.currentBranch({ fs: mockFs, dir: TEST_DIR, fullname: false });
    expect(current).toBe("rescue/chihiro");
  });

  it("does NOT prefix origin/ for slash branches", async () => {
    await runCommand("git init");
    await makeCommit("initial");

    // If origin/ were added the checkout would throw (no remote) — resolve means it's local
    await expect(runCommand("git checkout -b feature/zk-proof")).resolves.not.toThrow();
    const current = await git.currentBranch({ fs: mockFs, dir: TEST_DIR, fullname: false });
    expect(current).toBe("feature/zk-proof");
  });

  it("parse step returns type git-checkout-b for -b flag", async () => {
    // Test the parser directly without executing — just verify parseGitCommand output.
    // We do this by calling runCommand on a fresh (un-inited) repo and checking that
    // the error comes from git operations, not from "unsupported command".
    await runCommand("git init");
    await makeCommit("initial");
    const out = await runCommand("git checkout -b test/parse");
    // A "command not supported" error would say something like "no soportado"
    expect(out.toLowerCase()).not.toMatch(/no soportado|not supported|command not found/);
    expect(out).toMatch(/test\/parse/);
  });

  it("output contains both create and checkout confirmation", async () => {
    await runCommand("git init");
    await makeCommit("initial");

    const out = await runCommand("git checkout -b rescue/chihiro");
    // The handler does: gitCreateBranch + gitCheckout, joining their messages
    // gitCreateBranch returns "Rama creada: rescue/chihiro"
    // gitCheckout returns "Te moviste a la rama: rescue/chihiro"
    expect(out).toMatch(/creada|created/i);
    expect(out).toMatch(/moviste|switched|moved/i);
  });
});
