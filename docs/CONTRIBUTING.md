# Contributing to FlixCapacitor

**Last Updated:** 2025-11-14
**Version:** 0.4.4

---

Thank you for your interest in contributing to FlixCapacitor! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [How to Contribute](#how-to-contribute)
4. [Reporting Bugs](#reporting-bugs)
5. [Suggesting Features](#suggesting-features)
6. [Pull Request Process](#pull-request-process)
7. [Coding Standards](#coding-standards)
8. [Commit Message Guidelines](#commit-message-guidelines)
9. [Testing Requirements](#testing-requirements)
10. [Documentation Requirements](#documentation-requirements)
11. [Code Review Process](#code-review-process)
12. [Community](#community)

---

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Examples of behavior that contributes to a positive environment:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Project maintainers are responsible for clarifying standards of acceptable behavior and will take appropriate and fair corrective action in response to any instances of unacceptable behavior.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Development Environment**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for setup instructions
2. **GitHub Account**: Required for submitting pull requests
3. **Git Knowledge**: Basic understanding of Git workflow
4. **Node.js & npm**: Version 18+ and npm 9+ installed

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork:
git clone https://github.com/YOUR-USERNAME/popcorn-mobile.git
cd popcorn-mobile

# Add upstream remote
git remote add upstream https://github.com/flixcapacitor/popcorn-mobile.git

# Install dependencies
npm install
```

### Create a Branch

```bash
# Create feature branch from main
git checkout -b feature/my-awesome-feature

# Or bugfix branch:
git checkout -b fix/bug-description
```

---

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **Bug Fixes**: Fix existing issues or bugs
2. **New Features**: Add new functionality
3. **Performance Improvements**: Optimize existing code
4. **Documentation**: Improve or add documentation
5. **Tests**: Add or improve test coverage
6. **Refactoring**: Improve code structure without changing behavior
7. **UI/UX Improvements**: Enhance user interface or experience

### First-Time Contributors

Looking for a good first issue? Check out:

- [Good First Issue](https://github.com/flixcapacitor/popcorn-mobile/labels/good%20first%20issue) label
- [Help Wanted](https://github.com/flixcapacitor/popcorn-mobile/labels/help%20wanted) label
- Documentation improvements
- Test coverage improvements

### Before You Start

1. **Check Existing Issues**: Search for similar issues or PRs
2. **Discuss Major Changes**: Open an issue to discuss before starting work on major features
3. **Keep Changes Focused**: One feature/fix per pull request
4. **Follow Conventions**: Adhere to coding standards and commit guidelines

---

## Reporting Bugs

### Before Submitting a Bug Report

- **Check Documentation**: Ensure it's not a configuration issue
- **Search Existing Issues**: Your bug may already be reported
- **Try Latest Version**: Verify the bug exists in the latest release
- **Minimal Reproduction**: Create minimal example that reproduces the issue

### Bug Report Template

```markdown
## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- **Device**: (e.g., Samsung Galaxy S21, Google Pixel 6)
- **Android Version**: (e.g., Android 13)
- **App Version**: (e.g., 0.4.4)
- **Build Type**: (debug or release)

## Screenshots
If applicable, add screenshots to help explain the problem.

## Logs
```
Paste relevant logs from adb logcat or Chrome DevTools
```

## Additional Context
Any other context about the problem.
```

### Submitting the Bug Report

1. Go to [Issues](https://github.com/flixcapacitor/popcorn-mobile/issues/new)
2. Select "Bug Report" template
3. Fill in all sections
4. Add appropriate labels (bug, high-priority, etc.)
5. Submit

---

## Suggesting Features

### Before Submitting a Feature Request

- **Check Roadmap**: See if feature is already planned
- **Search Existing Issues**: Feature may already be requested
- **Consider Scope**: Ensure feature aligns with project goals
- **Think About Users**: How will this benefit most users?

### Feature Request Template

```markdown
## Feature Summary
Brief description of the feature (1-2 sentences).

## Motivation
Why is this feature needed? What problem does it solve?

## Detailed Description
Detailed explanation of the feature and how it should work.

## Use Cases
Examples of how users would use this feature:
1. Use case 1...
2. Use case 2...

## Proposed Implementation
(Optional) Suggest how this could be implemented.

## Alternatives Considered
(Optional) Other approaches you've considered.

## Additional Context
Screenshots, mockups, or examples from other apps.
```

### Submitting the Feature Request

1. Go to [Issues](https://github.com/flixcapacitor/popcorn-mobile/issues/new)
2. Select "Feature Request" template
3. Fill in all sections
4. Add appropriate labels (enhancement, feature-request)
5. Submit

---

## Pull Request Process

### 1. Before Creating a Pull Request

**Ensure Your Code:**

- [ ] Follows [Coding Standards](#coding-standards)
- [ ] Includes tests (if applicable)
- [ ] Updates documentation (if needed)
- [ ] Passes all tests (`npm run test`)
- [ ] Passes type checking (`npm run typecheck`)
- [ ] Passes linting (`npm run lint`)
- [ ] Builds successfully (`npm run build`)

**Verify Your Changes:**

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build the project
npm run build

# Test on device
./build-and-install.sh
```

### 2. Creating the Pull Request

**Pull Request Title:**

Use conventional commit format:

```
feat(favorites): add cloud sync support
fix(player): resolve subtitle loading issue
docs(api): update FavoritesService documentation
refactor(settings): simplify cloud sync logic
perf(player): optimize video buffering
```

**Pull Request Description Template:**

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement

## Related Issues
Fixes #123
Relates to #456

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
Describe how you tested these changes:
- [ ] Unit tests added/updated
- [ ] Manual testing on Android device
- [ ] Tested on multiple devices/OS versions
- [ ] Tested offline functionality
- [ ] Tested cloud sync features (if applicable)

## Screenshots
(If applicable) Add screenshots or screen recordings.

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing tests pass locally
- [ ] Any dependent changes have been merged and published
```

### 3. Submitting the Pull Request

```bash
# Push your branch
git push origin feature/my-awesome-feature

# Create pull request on GitHub
# 1. Go to repository on GitHub
# 2. Click "Pull requests" > "New pull request"
# 3. Select your branch
# 4. Fill in PR template
# 5. Request reviewers (optional)
# 6. Submit
```

### 4. After Submission

**Respond to Feedback:**

- Check for comments from reviewers
- Address all feedback promptly
- Push additional commits if changes are requested
- Mark conversations as resolved when addressed

**Keep Branch Updated:**

```bash
# Fetch latest changes from upstream
git fetch upstream

# Merge main into your branch
git merge upstream/main

# Or rebase (cleaner history):
git rebase upstream/main

# Push updated branch
git push origin feature/my-awesome-feature --force-with-lease
```

### 5. Merging

Once approved:
- Maintainers will merge your PR
- Your branch will be deleted automatically
- You can delete your local branch:

```bash
git checkout main
git pull upstream main
git branch -d feature/my-awesome-feature
```

---

## Coding Standards

### TypeScript

**Use TypeScript for all new code:**

```typescript
// Good: TypeScript with interfaces
interface MovieItem {
  movieId: string;
  title: string;
  year: number;
}

async function addFavorite(movie: MovieItem): Promise<void> {
  // Implementation
}

// Avoid: JavaScript without types
async function addFavorite(movie) {
  // Implementation
}
```

**Use strong typing:**

```typescript
// Good: Explicit types
const movies: MovieItem[] = [];
const result: Result = { success: true };

// Avoid: Using any
const movies: any = [];
const result: any = { success: true };
```

### Code Style

**Follow ESLint configuration:**

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint -- --fix
```

**Use async/await over Promises:**

```typescript
// Good
async function fetchMovie(id: string): Promise<Movie> {
  const response = await fetch(`/api/movies/${id}`);
  const data = await response.json();
  return data;
}

// Avoid
function fetchMovie(id: string): Promise<Movie> {
  return fetch(`/api/movies/${id}`)
    .then(response => response.json());
}
```

**Use template literals:**

```typescript
// Good
const message = `Movie: ${title} (${year})`;

// Avoid
const message = 'Movie: ' + title + ' (' + year + ')';
```

**Use destructuring:**

```typescript
// Good
const { title, year, rating } = movie;

// Avoid
const title = movie.title;
const year = movie.year;
const rating = movie.rating;
```

### Naming Conventions

**Variables and Functions:**

```typescript
// camelCase for variables and functions
const movieTitle = 'Inception';
function getMovieById(id: string) { }

// PascalCase for classes and interfaces
class MovieService { }
interface MovieItem { }

// UPPER_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRIES = 3;
```

**Files:**

```
// kebab-case for file names
movie-list-view.ts
favorites-service.ts
api-client.ts
```

### Comments

**Use JSDoc for public APIs:**

```typescript
/**
 * Add a movie to favorites
 * @param movie - Movie item to add
 * @returns Promise that resolves when favorite is added
 * @throws Error if database operation fails
 */
async function addFavorite(movie: MovieItem): Promise<void> {
  // Implementation
}
```

**Use inline comments for complex logic:**

```typescript
// Calculate movie rating weighted by recency
// Newer ratings have higher weight
const weightedRating = ratings.reduce((acc, rating, index) => {
  const weight = (index + 1) / ratings.length; // Linear weight
  return acc + (rating.score * weight);
}, 0);
```

### Error Handling

**Always handle errors:**

```typescript
// Good: Try-catch with specific error handling
try {
  await FavoritesService.addFavorite(movie);
  showToast('Added to favorites');
} catch (error) {
  console.error('Failed to add favorite:', error);
  showToast('Failed to add favorite. Please try again.');
}

// Avoid: Unhandled promises
FavoritesService.addFavorite(movie); // May fail silently!
```

**Use Result pattern for service methods:**

```typescript
interface Result {
  success: boolean;
  data?: any;
  error?: string;
}

async function addItem(item: LibraryItem): Promise<Result> {
  try {
    const id = await this.db.insert('library_items', item);
    return { success: true, data: id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

---

## Commit Message Guidelines

### Conventional Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring (no functional changes)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, or tooling changes
- **ci**: CI/CD configuration changes

### Commit Scopes

- **favorites**: Favorites service
- **library**: Library service
- **player**: Video player
- **settings**: Settings manager
- **api**: API client (Supabase)
- **ui**: User interface
- **torrent**: Torrent streaming
- **build**: Build system
- **docs**: Documentation

### Examples

```bash
# Feature
git commit -m "feat(favorites): add cloud sync support"

# Bug fix
git commit -m "fix(player): resolve subtitle loading issue"

# Documentation
git commit -m "docs(api): update FavoritesService documentation"

# Refactoring
git commit -m "refactor(settings): simplify cloud sync logic"

# Performance
git commit -m "perf(player): optimize video buffering"

# Breaking change
git commit -m "feat(api)!: redesign authentication flow

BREAKING CHANGE: Authentication now requires email verification"
```

### Commit Message Rules

1. **Subject Line**:
   - Use imperative mood ("add" not "added" or "adds")
   - Don't capitalize first letter
   - No period at the end
   - Maximum 72 characters

2. **Body** (optional):
   - Separate from subject with blank line
   - Explain what and why, not how
   - Wrap at 72 characters

3. **Footer** (optional):
   - Reference issues: `Fixes #123`, `Closes #456`
   - Breaking changes: `BREAKING CHANGE: description`

---

## Testing Requirements

### Unit Tests (Future)

Currently, the project doesn't have comprehensive unit tests. Contributions to add tests are welcome!

**Recommended test framework:**

```bash
npm install --save-dev vitest @vitest/ui @testing-library/dom jsdom
```

**Example test:**

```typescript
import { describe, it, expect } from 'vitest';
import { FavoritesService } from './favorites-service';

describe('FavoritesService', () => {
  it('should add favorite successfully', async () => {
    const movie = { movieId: 'tt1234567', title: 'Inception', year: 2010 };
    await FavoritesService.addFavorite(movie);

    const isFav = await FavoritesService.isFavorite('tt1234567');
    expect(isFav).toBe(true);
  });
});
```

### Manual Testing

**All pull requests must include manual testing:**

1. **Build and Install**:
   ```bash
   npm run build
   ./build-and-install.sh
   ```

2. **Test on Device**:
   - Verify new feature works as expected
   - Test edge cases (offline, low battery, etc.)
   - Ensure existing features still work

3. **Test Multiple Scenarios**:
   - Fresh install
   - Upgrade from previous version
   - With and without cloud sync configured

4. **Document Test Results**:
   Include testing details in PR description

---

## Documentation Requirements

### When to Update Documentation

Documentation must be updated for:

- **New Features**: Add to [API.md](./API.md) and [USER-GUIDE.md](./USER-GUIDE.md)
- **API Changes**: Update [API.md](./API.md)
- **Configuration Changes**: Update [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Breaking Changes**: Update all relevant docs and create migration guide
- **Bug Fixes**: Update [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) if applicable

### Documentation Standards

**Code Comments:**

```typescript
/**
 * Service for managing user favorites
 * Provides local SQLite storage with optional cloud sync via Supabase
 */
class FavoritesService {
  /**
   * Add a movie to favorites
   * @param movie - Movie item to add
   * @returns Promise that resolves when favorite is added
   * @throws Error if database operation fails
   * @example
   * ```typescript
   * await FavoritesService.addFavorite({
   *   movieId: 'tt1234567',
   *   title: 'Inception',
   *   year: 2010
   * });
   * ```
   */
  async addFavorite(movie: MovieItem): Promise<void> {
    // Implementation
  }
}
```

**README Updates:**

- Keep README.md up-to-date with new features
- Update screenshots if UI changes significantly
- Update installation instructions if setup changes

---

## Code Review Process

### For Contributors

**After submitting a PR:**

1. **Wait for automated checks**: CI/CD will run tests and builds
2. **Address review comments**: Respond to all feedback
3. **Push updates**: Additional commits will update the PR
4. **Request re-review**: After addressing all comments
5. **Be patient**: Maintainers will review as soon as possible

**Responding to feedback:**

- **Be respectful**: Reviewers are helping improve your code
- **Ask questions**: If feedback is unclear, ask for clarification
- **Explain decisions**: If you disagree, explain your reasoning politely
- **Mark conversations resolved**: After addressing each comment

### For Reviewers

**Review checklist:**

- [ ] Code follows project conventions
- [ ] Changes are well-documented
- [ ] Tests are included (if applicable)
- [ ] No obvious bugs or security issues
- [ ] Performance impact is acceptable
- [ ] Breaking changes are clearly documented
- [ ] PR description is complete and accurate

**Providing feedback:**

- **Be constructive**: Suggest improvements, don't just criticize
- **Be specific**: Point to exact lines or provide examples
- **Be respectful**: Remember there's a person behind the code
- **Approve when ready**: Don't hold up PRs for minor style issues

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Pull Requests**: Code contributions and reviews

### Getting Help

**If you're stuck:**

1. Check [DEVELOPMENT.md](./DEVELOPMENT.md) for setup issues
2. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common problems
3. Search existing GitHub Issues
4. Ask in GitHub Discussions
5. Open a new issue if problem persists

### Recognition

We appreciate all contributions! Contributors will be:

- Listed in CONTRIBUTORS.md
- Credited in release notes
- Mentioned in commit messages (Co-authored-by)

---

## License

By contributing to FlixCapacitor, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](../LICENSE) file).

---

## Questions?

If you have any questions about contributing, please:

1. Check this document thoroughly
2. Review [DEVELOPMENT.md](./DEVELOPMENT.md)
3. Search existing GitHub Issues
4. Open a new issue with the "question" label

---

**Thank you for contributing to FlixCapacitor!** 🎬🍿

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-14
**Maintained By:** FlixCapacitor Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
