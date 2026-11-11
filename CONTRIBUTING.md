# Contributing to Point of Sales

Thank you for your interest in contributing! 🎉

## Git Workflow

This repository uses **Git Flow** with the following branches:

| Branch | Purpose |
|--------|--------|
| `main` | Production. Updated only through PRs from `development` |
| `development` | Integration. Feature branches are merged via PR |
| `feature/*` | Feature work. Branch from `development`, then open a PR to `development` |
| `fix/*` | Hotfix. Branch from `main`, then open PRs to `main` and `development` |
| `release/*` | Release candidate. Branch from `development`, then merge into `main` |

## How to Contribute

### 1. Clone and Set Up

```bash
git clone https://github.com/abduldaim29/bingo_pos
cd point-of-sales
cp .env.example .env
composer install && PUPPETEER_SKIP_DOWNLOAD=true npm install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
composer run dev
# Once the server is running, open http://localhost:8000.
# On the first installation, the application automatically redirects to /setup.
```

### 2. Create a Feature Branch

```bash
git checkout development
git checkout -b feature/your-feature-name
```

### 3. Work and Commit

Use **Conventional Commits**:

```
feat: add feature X
fix: fix bug Y
docs: update documentation Z
chore: update dependency
refactor: refactor function A
test: add tests for B
```

### 4. Before Opening a Pull Request

Make sure all checks pass:

```bash
vendor/bin/pint                    # PHP formatter
php artisan test                   # All tests pass
npm run build                      # Production build OK
```

### 5. Open a Pull Request

1. Push your branch to GitHub
2. Open a PR to the `development` branch
3. Describe the changes:
   - **What changed**
   - **Why it changed**
   - **How it was tested**
4. Make sure the PR title follows Conventional Commits

### 6. After Opening a PR

- The maintainer will review the PR
- If changes are requested, push them to the same branch
- Once approved, the maintainer will merge the PR

## Development Tips

- Set `tax_rate=0` in `Product::create` within tests to avoid changing the grand total
- Run `php artisan migrate` if a new module does not have its tables yet
- Read `AGENTS.md` for developer command information
- See `docs/` for feature documentation

## Report Bugs

Open a new issue on GitHub using the Bug Report template.

## Request a Feature

Open a new issue on GitHub using the Feature Request template.
