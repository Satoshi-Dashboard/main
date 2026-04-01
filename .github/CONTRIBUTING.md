# Contributing to Satoshi Dashboard

Thank you for your interest in contributing to Satoshi Dashboard! We value all contributions, whether they are code, documentation, bug reports, or ideas.

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- Git
- Basic knowledge of React and Express (for technical changes)

### Local Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/satoshi-dashboard.git
   cd satoshi-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Fill in the required variables (see Environment Variables section in README)
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

The UI runs on `http://localhost:5173` and the API on `http://localhost:3000`.

## Types of Contributions

### 🐛 Bug Reports
- Check if a similar issue already exists
- Use the bug report issue template
- Include steps to reproduce
- Specify your environment (OS, browser, Node version)
- Attach screenshots or videos if relevant

### ✨ Feature Requests
- Open a Discussion or Issue to propose the feature
- Wait for maintainer feedback
- Once approved, implement and open a PR

### 📚 Documentation
- Improve existing README or guides
- Document new features
- Fix typos or clarity issues
- Translate content to other languages

### 🔍 Code Review
- Review open PRs
- Provide constructive feedback
- Help identify potential issues

## Workflow

### 1. Create a branch
```bash
# For features
git checkout -b feature/short-description

# For bugfixes
git checkout -b bugfix/short-description
```

### 2. Make changes
- Keep changes focused and atomic
- Follow the project's code style
- Run linter: `npm run lint`
- Test locally: `npm run dev`

### 3. Write clear commits
```bash
# Use descriptive messages
git commit -m "feat: add Lightning Network module"
git commit -m "fix: correct volatility calculation"
git commit -m "docs: update installation guide"
```

### 4. Push and create PR
```bash
git push origin feature/your-feature
```

- Fill out the PR template completely
- Link related issues with `closes #123`
- Wait for maintainer review

## Code Style

### Frontend (React/Tailwind)
- Use functional components with hooks
- Type props when possible
- Use descriptive variable and function names
- Keep components under 300 lines
- Use Tailwind for styling (no additional CSS without justification)

### Backend (Express/Node)
- Keep endpoints under `/api/*`
- Validate all input
- Handle errors appropriately
- Use clear logging
- Comment complex logic

### Quality Checks
```bash
# Lint and auto-fix
npm run lint -- --fix

# Build validation
npm run build

# Security check
npm run check:security
```

## Branches

- **main** - Stable production code
- **develop** - Integration branch (if exists)
- **feature/*** - New features
- **bugfix/*** - Bug fixes
- **docs/*** - Documentation changes

## Testing

No automated test suite is currently required, but:
- Test manually with `npm run dev`
- Verify linting passes
- Confirm `npm run build` succeeds
- Test in multiple browsers if UI-related

## Code Review

All PRs require at least one approval. Reviewers check for:
- ✅ Clean, maintainable code
- ✅ Changes focused on the goal
- ✅ Documentation updated if needed
- ✅ No security regressions
- ✅ Consistency with project style

## Communication

- **Issues** - Report bugs, propose features, discuss technical problems
- **Discussions** - Open conversations, ideas, questions
- **Pull Requests** - Implementation of changes

Keep all communication respectful, constructive, and transparent.

## Recognition

- All contributors will be mentioned in the README
- Significant contributions may be featured in releases
- We value consistent community participation

## Code of Conduct

This project adheres to a Code of Conduct (see `CODE_OF_CONDUCT.md`). By participating, you agree to maintain an inclusive, respectful, and professional environment.

## Questions?

- Open a Discussion for general questions
- Check the docs in `.claude/` for internal guides
- Contact maintainers if you need clarification

---

**Thank you for contributing to Satoshi Dashboard!** 🚀
