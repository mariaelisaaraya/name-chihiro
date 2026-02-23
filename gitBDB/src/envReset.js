// src/envReset.js
import { resetFileSystem, initFileSystem } from "./gitFs";
import { resetRemote } from "./githubSim";

// Reinicia repo + GitHub simulado
export async function resetEnvironment() {
  await resetFileSystem();
  await initFileSystem();
  resetRemote();
}
