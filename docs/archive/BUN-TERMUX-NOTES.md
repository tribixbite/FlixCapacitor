# Bun on Termux - Compatibility Notes

## Summary
Bun v1.2.20 is installed on this system but **cannot be fully used** due to Termux Android ARM64 compatibility limitations.

## Issue Details

### Attempted: Bun Dependency Installation
- **Command:** `bun install`
- **Result:** Failed with 566 permission errors (EACCES)
- **Error Pattern:**
  ```
  EACCES: Permission denied while installing <package>
  ```
- **Root Cause:** Bun's package installation process is incompatible with Termux's filesystem restrictions on Android

### Attempted: Bun Script Execution
- **Command:** `bun run build`, `bun x vite`
- **Result:** Failed with internal error
- **Error:**
  ```
  error loading current directory
  error: An internal error occurred (CouldntReadCurrentDirectory)
  ```
- **Root Cause:** Bun's directory access syscalls are incompatible with Termux environment

### Attempted: Bun-on-Termux Tools
- **Tools Found:** `buno` and `grun` (bun-on-termux project tools)
- **Result:** `buno` binary cannot execute, `grun` requires special configuration
- **Status:** Not fully functional

## Current Solution

**Continue using npm for this project.** npm works perfectly in Termux and has no compatibility issues.

## Configuration
- `package.json` updated with `"packageManager": "npm@10.9.2"` to explicitly document the package manager
- All scripts remain using npm/node/npx commands

## References
- Bun-on-Termux Project: https://github.com/tribixbite/bun-on-termux
- Bun Version: 1.2.20
- Termux: Android ARM64
- Node Version: (installed via Termux)
- npm Version: 10.9.2

## Future Consideration
If Bun improves Termux compatibility in future versions, revisit this decision. For now, npm provides a stable, fully-functional development environment.
