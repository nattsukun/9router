# EnixmaRouter upstream maintenance

The fork tracks https://github.com/decolua/9router, branch master.
Codex heartbeat automation `enixmarouter-upstream-sync` runs daily at
09:17 Asia/Bangkok. It fetches upstream in an isolated worktree, validates
tests, build and all three npm audits, then merges only passing changes.
Railway deploys updates to master. This schedule depends on the Codex
automation runtime; it is not a Railway cron or a GitHub Actions schedule.
The old GitHub sync workflow is disabled. Dependabot remains separate.

## Railway target

- Project: bountiful-dream (`e012895b-ad7f-4be6-a6a8-7e0feb2019bc`)
- Environment: production (`f8773ba8-cc46-45ef-8e68-52b67075876f`)
- Service: EnixmaRouter (`f347edd2-667b-481b-9609-1c0736afe063`)
- Source: nattsukun/9router, master, root Dockerfile
- Port: 20128; health: /api/health; persistent volume: /app/data
- Public URL: https://enixmarouter-production.up.railway.app

Use Railway variables for INITIAL_PASSWORD, JWT_SECRET and the randomly
generated ENIXERA_ROUTER_ADMIN_KEY. Never commit or print these values.
The service credential grants provider/combo administration and key listing,
not inference, host tools or settings. Customer key provisioning and usage
budgets explicitly return 503 until Enixera package enforcement is implemented.
Do not advertise package purchases as ready. A fresh service also needs
provider configuration before any live inference can succeed.

## Local validation

Use Node from .nvmrc. Install the application, tests/ and cli/ dependencies
in their respective directories with npm install --ignore-scripts.
Run from the repository root:

```sh
node tests/node_modules/vitest/vitest.mjs run --config tests/vitest.config.js
node node_modules/next/dist/bin/next build --webpack
npm audit --registry=https://registry.npmjs.org
```

Run npm audit inside tests/ and cli/ too. RUN_REAL=1 explicitly enables
live-provider tests; the default suite is not proof of provider availability.
The legacy embeddings.cloud suite requires the optional cloud/ source,
which the current upstream checkout does not include.

## Certificate migration

node-forge was removed from the app and CLI. MITM certificates now use
@peculiar/x509 with Node Web Crypto for signing and Node crypto for reading
existing keys/certificates. Existing PKCS#1 root keys remain supported;
valid installed root certificates are preserved. CA creation and SNI leaf
generation are asynchronous and callers wait before using their results.
Docker explicitly installs the certificate dependencies for the MITM child.

## Historical GitHub Actions limitation

At validation on 2026-10-24, GitHub refused to start run 40082081705:
"The job was not started because your account is locked due to a billing issue."
This no longer blocks the Codex sync schedule or Railway deployment.
The retained GitHub validation workflow is optional and cannot be used as
evidence of passing checks while the account is locked.
