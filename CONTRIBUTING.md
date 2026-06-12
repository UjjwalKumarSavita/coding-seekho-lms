# Contributing to Coding Seekho LMS

## Branches

- `main` contains stable product checkpoints.
- `dev` is the integration branch for completed work.
- Create `feature/<short-name>` from `dev` for features.
- Create `fix/<short-name>` from `dev` for bug fixes.

## Workflow

```powershell
git switch dev
git pull
git switch -c feature/meeting-reminders
```

Make focused commits while developing:

```text
feat: add scheduled meeting reminders
fix: allow LAN frontend origins in development
test: cover student batch authorization
docs: explain local SMTP configuration
```

Push the branch and open a pull request into `dev`. Run the backend tests,
frontend tests, and frontend production build before requesting review.

Merge `dev` into `main` only for a tested release checkpoint.

## Commit Rules

- Keep one logical change per commit.
- Use an imperative conventional prefix such as `feat`, `fix`, `test`, `docs`,
  `refactor`, or `chore`.
- Never commit passwords, tokens, real `.env` files, uploaded student files, or
  generated build output.
- Do not manufacture old history. Commit meaningful changes as they happen.

