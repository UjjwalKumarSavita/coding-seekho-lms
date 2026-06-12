# LLC World Frontend

Private learning platform for Little Long Concept.

## Run locally

1. Start the Spring Boot backend on port `8080`.
2. In this folder run:

```powershell
npm.cmd install
npm.cmd start
```

The app opens at `http://localhost:3000`.

Copy `.env.example` to `.env` only when the API URL differs from the default.

## Accounts

Students can self-register. Create the initial administrator through the
backend bootstrap environment variables, then assign teacher and administrator
roles from the administration workspace.

## Verification

```powershell
npm.cmd run build
$env:CI='true'; npm.cmd test -- --watchAll=false
```
