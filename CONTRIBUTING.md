# Contributing to FlixCapacitor

Thank you for your interest in contributing to FlixCapacitor! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

**In summary:**
- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions
- Respect privacy and legal boundaries

## How Can I Contribute?

### Reporting Bugs

Found a bug? Please help us fix it!

1. **Check existing issues:** Search [GitHub Issues](https://github.com/tribixbite/FlixCapacitor/issues) to avoid duplicates
2. **Use bug report template:** Fill out all required fields
3. **Provide details:**
   - Device model and Android version
   - App version (Settings > About)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/logs if possible

**Priority Guidelines:**
- **P0 (Critical):** App crashes, data loss, security issues
- **P1 (High):** Core feature broken, no workaround
- **P2 (Medium):** Feature partially broken, workaround available
- **P3 (Low):** UI glitch, cosmetic, edge case

### Suggesting Features

Have an idea? We'd love to hear it!

1. **Check existing requests:** Search issues labeled `enhancement`
2. **Use feature request template:** Describe the problem and proposed solution
3. **Provide context:** Why is this feature valuable? Who benefits?
4. **Include examples:** Screenshots, mockups, or similar features in other apps

### Contributing Code

Ready to code? Here's how:

1. **Pick an issue:** Look for issues labeled `good first issue` or `help wanted`
2. **Comment on the issue:** Let us know you're working on it
3. **Fork the repository:** Create your own fork
4. **Create a branch:** Use descriptive branch names (e.g., `fix/video-player-crash`)
5. **Make changes:** Follow our coding standards
6. **Test thoroughly:** Write tests, manual testing
7. **Submit pull request:** Use our PR template

### Contributing Documentation

Documentation contributions are highly valued!

- **User guides:** Improve USER-GUIDE.md
- **API docs:** Document public APIs
- **Code comments:** Add explanatory comments
- **Examples:** Create usage examples
- **Translations:** Help translate (future)

### Beta Testing

Join our beta testing program! See [BETA-TESTING.md](BETA-TESTING.md) for details.

## Development Setup

### Prerequisites

**Required:**
- **Android Device:** Physical device or emulator (API 24+)
- **Android Studio:** Latest stable version
- **Node.js:** v18+ (LTS recommended)
- **npm:** v9+ (comes with Node.js)
- **Git:** Latest version
- **JDK:** v17 (for Android development)

**Optional:**
- **ADB:** For device testing (comes with Android Studio)
- **Termux:** For ARM64 development (advanced)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tribixbite/FlixCapacitor.git
   cd FlixCapacitor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials (optional for local dev)
   ```

4. **Build web assets:**
   ```bash
   npm run build
   ```

5. **Sync to Android:**
   ```bash
   npx cap sync android
   ```

6. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```
   Or manually open `android/` folder in Android Studio

7. **Run on device/emulator:**
   - Click "Run" in Android Studio
   - Or use: `./build-and-install.sh` (if on Termux)

### Development Mode

For faster development with hot reload:

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Open Android Studio and run app
# The app will connect to dev server at localhost:5173
```

**Note:** Some features (torrent streaming, native plugins) require a full build.

## Development Workflow

### Branch Strategy

We use **Git Flow** branching model:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features (branch from `develop`)
- `fix/*` - Bug fixes (branch from `develop` or `main`)
- `hotfix/*` - Critical production fixes (branch from `main`)
- `release/*` - Release preparation (branch from `develop`)

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature
# ... make changes ...

# Commit your work
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name

# Create pull request to develop branch
```

### Creating a Bug Fix Branch

```bash
# For non-critical bugs (branch from develop)
git checkout develop
git pull origin develop
git checkout -b fix/bug-description

# For critical bugs (branch from main)
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-description

# Make your fix, commit, push, and create PR
```

## Coding Standards

### TypeScript Style

**Use TypeScript** for all new code:

```typescript
// ✅ Good: Type annotations
interface Movie {
  id: string;
  title: string;
  year: number;
}

function getMovie(id: string): Promise<Movie> {
  // ...
}

// ❌ Bad: No types
function getMovie(id) {
  // ...
}
```

**Prefer `const` and `let`** over `var`:

```typescript
// ✅ Good
const API_URL = 'https://api.example.com';
let currentMovie: Movie | null = null;

// ❌ Bad
var API_URL = 'https://api.example.com';
var currentMovie;
```

**Use async/await** instead of Promise chains:

```typescript
// ✅ Good
async function fetchMovie(id: string): Promise<Movie> {
  try {
    const response = await fetch(`/api/movies/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch movie:', error);
    throw error;
  }
}

// ❌ Bad
function fetchMovie(id) {
  return fetch(`/api/movies/${id}`)
    .then(response => response.json())
    .catch(error => {
      console.error('Failed to fetch movie:', error);
      throw error;
    });
}
```

### Code Organization

**Follow existing structure:**

```
src/
  app/
    lib/          # Core business logic
    models/       # Data models
    views/        # Backbone views
    templates/    # HTML templates
  config/         # Configuration files
  styles/         # CSS/SCSS files
  main.ts         # App entry point
```

**One responsibility per file:**

```typescript
// ✅ Good: Focused file
// video-player.ts - Only video player logic

// ❌ Bad: Multiple responsibilities
// utils.ts - Video player + HTTP client + Date formatting
```

### Naming Conventions

**Files:**
- `kebab-case.ts` for source files
- `PascalCase.ts` for class files (if needed)
- `camelCase.ts` for utility files

**Variables:**
- `camelCase` for variables and functions
- `PascalCase` for classes and interfaces
- `SCREAMING_SNAKE_CASE` for constants

```typescript
// ✅ Good
const movieTitle = 'Inception';
const API_KEY = 'abc123';

interface MovieData {
  // ...
}

class VideoPlayer {
  // ...
}

function playMovie(movie: MovieData): void {
  // ...
}

// ❌ Bad
const MovieTitle = 'Inception';  // Should be camelCase
const api_key = 'abc123';        // Should be SCREAMING_SNAKE_CASE
interface movieData {            // Should be PascalCase
  // ...
}
```

### Comments

**Use JSDoc** for public APIs:

```typescript
/**
 * Fetches movie metadata from TMDB API
 *
 * @param id - TMDB movie ID
 * @param includeImages - Whether to fetch images (default: false)
 * @returns Promise resolving to movie metadata
 * @throws {APIError} If API request fails
 *
 * @example
 * const movie = await fetchMovieMetadata('12345');
 * console.log(movie.title);
 */
async function fetchMovieMetadata(
  id: string,
  includeImages = false
): Promise<MovieMetadata> {
  // ...
}
```

**Explain "why", not "what":**

```typescript
// ✅ Good: Explains reasoning
// Stop stream before showing picker to prevent race condition
// where user cancels picker but old stream continues
await this.stopStream();

// ❌ Bad: States the obvious
// Stop the stream
await this.stopStream();
```

### Error Handling

**Always handle errors:**

```typescript
// ✅ Good: Comprehensive error handling
try {
  const movie = await fetchMovieMetadata(id);
  displayMovie(movie);
} catch (error) {
  if (error instanceof NetworkError) {
    showToast('Network error. Please check your connection.');
  } else if (error instanceof NotFoundError) {
    showToast('Movie not found.');
  } else {
    showToast('An error occurred. Please try again.');
    captureException(error); // Report to Sentry
  }
}

// ❌ Bad: Silent failure
try {
  const movie = await fetchMovieMetadata(id);
  displayMovie(movie);
} catch (error) {
  // Empty catch block
}
```

### Performance

**Avoid unnecessary re-renders:**

```typescript
// ✅ Good: Cache results
const cachedMovies = new Map<string, Movie>();

function getMovie(id: string): Movie | undefined {
  if (cachedMovies.has(id)) {
    return cachedMovies.get(id);
  }
  // Fetch and cache
}

// ❌ Bad: Fetch every time
function getMovie(id: string): Movie {
  return fetch(`/api/movies/${id}`).then(/* ... */);
}
```

**Debounce expensive operations:**

```typescript
// ✅ Good: Debounced search
const debouncedSearch = debounce(async (query: string) => {
  const results = await searchMovies(query);
  displayResults(results);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});

// ❌ Bad: Search on every keystroke
searchInput.addEventListener('input', async (e) => {
  const results = await searchMovies(e.target.value);
  displayResults(results);
});
```

## Commit Guidelines

We follow **Conventional Commits** specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature/fix)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

**Scope:** (optional)
- `player`: Video player
- `library`: Library management
- `sync`: Cloud sync
- `ui`: User interface
- `build`: Build system
- `deps`: Dependencies

**Examples:**

```bash
# Feature
git commit -m "feat(player): add playback speed control"

# Bug fix
git commit -m "fix(sync): resolve conflict when editing same item on multiple devices"

# Documentation
git commit -m "docs: update CONTRIBUTING.md with TypeScript examples"

# Refactoring
git commit -m "refactor(library): extract database queries to separate module"

# Breaking change
git commit -m "feat(api): redesign torrent streaming API

BREAKING CHANGE: TorrentStreamer.start() now returns Promise<StreamInfo> instead of void"
```

### Commit Best Practices

**Do:**
- Write clear, descriptive messages
- Keep commits focused (one logical change)
- Reference issue numbers (e.g., "fixes #123")
- Use present tense ("add feature" not "added feature")

**Don't:**
- Commit commented-out code
- Commit console.log() debugging statements
- Make commits with "WIP" or "fix" as the message
- Include multiple unrelated changes in one commit

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Tested on device/emulator
- [ ] Branch is up to date with base branch

### PR Title

Use same format as commit messages:

```
feat(player): add playback speed control
fix(sync): resolve conflict handling
docs: update user guide with cloud sync instructions
```

### PR Description

**Use the template** provided. Include:

1. **What:** Brief description of changes
2. **Why:** Motivation and context
3. **How:** Technical implementation details (if complex)
4. **Testing:** How you tested the changes
5. **Screenshots:** Before/after (for UI changes)
6. **Related Issues:** Link to issues (e.g., "Closes #123")

**Example:**

```markdown
## What
Adds playback speed control to video player (0.5x, 1.0x, 1.5x, 2.0x)

## Why
Requested by multiple users in #234. Useful for lectures, podcasts, slow-motion analysis.

## How
- Added speed selector UI to player controls
- Updated VideoPlayer class with setPlaybackSpeed() method
- Persists selected speed in preferences

## Testing
- Tested on Pixel 8 (Android 14)
- Tested all speed options (0.5x - 2.0x)
- Verified speed persists across app restarts
- No audio distortion at 2.0x

## Screenshots
[Before and after screenshots]

Closes #234
```

### Review Process

1. **Automated checks:** CI/CD runs tests and linters
2. **Code review:** Maintainer reviews code
3. **Feedback:** Address review comments
4. **Approval:** PR approved by maintainer
5. **Merge:** Squash and merge to base branch

**Expect:**
- Constructive feedback
- Requests for changes
- Multiple review rounds (normal!)

**Timeline:**
- Initial review: 2-3 days
- Follow-up: 1-2 days
- Merge: After approval

## Testing Guidelines

### Unit Tests

**Write tests for:**
- Core business logic
- Utility functions
- Data transformations
- Edge cases

**Example:**

```typescript
// video-player.test.ts
import { VideoPlayer } from './video-player';

describe('VideoPlayer', () => {
  let player: VideoPlayer;

  beforeEach(() => {
    player = new VideoPlayer();
  });

  it('should start playback', async () => {
    await player.play('video-url');
    expect(player.isPlaying()).toBe(true);
  });

  it('should handle invalid URL', async () => {
    await expect(player.play('')).rejects.toThrow('Invalid URL');
  });
});
```

**Run tests:**

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Manual Testing

**Required for all PRs:**

1. **Build and install:**
   ```bash
   npm run build
   npx cap sync android
   # Install on device
   ```

2. **Test happy path:**
   - Feature works as expected
   - No crashes or errors

3. **Test edge cases:**
   - Empty states
   - Error conditions
   - Slow network
   - Low storage

4. **Test on multiple devices:**
   - High-end and low-end devices
   - Different Android versions
   - Different screen sizes

**Checklist:**
- [ ] Feature works correctly
- [ ] No crashes or ANRs
- [ ] No performance degradation
- [ ] No visual glitches
- [ ] Tested on 2+ devices

## Documentation

### Code Documentation

**Document:**
- Public APIs (JSDoc)
- Complex algorithms (inline comments)
- Non-obvious decisions (why, not what)
- TODO/FIXME with context

### User Documentation

**Update when:**
- Adding new features
- Changing existing behavior
- Adding settings/preferences

**Files:**
- `USER-GUIDE.md` - End-user documentation
- `TESTING.md` - Testing instructions
- `BUILD-RELEASE.md` - Build instructions

### Architecture Documentation

**Update when:**
- Changing architecture
- Adding new modules
- Refactoring major components

**Location:**
- `docs/` folder (if exists)
- Inline code comments
- PR descriptions

## Community

### Communication Channels

**GitHub:**
- Issues: Bug reports, feature requests
- Discussions: Q&A, ideas, general discussion
- Pull Requests: Code contributions

**Discord:** (if available)
- #general - General discussion
- #development - Development questions
- #beta-testing - Beta tester discussions
- #feedback - Feature feedback

**Email:**
- Development: dev@flixcapacitor.app
- Beta: beta@flixcapacitor.app
- Support: support@flixcapacitor.app

### Getting Help

**Before asking:**
1. Search existing issues/discussions
2. Check documentation (USER-GUIDE.md, TESTING.md)
3. Read error messages carefully

**When asking:**
- Be specific and detailed
- Include error messages/logs
- Share code snippets (use code blocks)
- Describe what you've tried

### Recognition

**Contributors will be:**
- Listed in CONTRIBUTORS.md (if created)
- Credited in release notes
- Mentioned in project README
- Thanked publicly (if desired)

## Thank You!

Thank you for contributing to FlixCapacitor! Every contribution, no matter how small, helps make the project better.

Questions? Reach out:
- GitHub Discussions
- Email: dev@flixcapacitor.app
- Discord: [invite link]

Happy coding! 🚀

---

**Last Updated:** 2025-11-14
**Version:** 1.0.0
**Maintained by:** FlixCapacitor Team
