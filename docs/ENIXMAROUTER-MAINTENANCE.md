# EnixmaRouter upstream maintenance

The fork tracks https://github.com/decolua/9router, branch master.
The daily sync runs at 02:17 UTC (09:17 Asia/Bangkok) and can also be
dispatched manually in GitHub Actions.

The sync merges upstream into automation/omnirouter-upstream-sync and opens
one pull request against this fork's master. It skips when master already
contains upstream. Merge conflicts fail the run for manual resolution.
It does not automatically merge or deploy.

Validate EnixmaRouter runs the offline regression suite, production build,
and npm audits for the application, CLI and tests. The sync calls validation
explicitly because pull requests created with GITHUB_TOKEN do not trigger
pull_request workflows. Dependabot proposes dependency updates separately.

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

## GitHub Actions prerequisite

At validation on 2026-10-24, GitHub refused to start run 40082081705:
"The job was not started because your account is locked due to a billing issue."
The account owner must resolve that billing lock before GitHub-hosted
validation or scheduled sync can execute. The workflow files alone do not
prove a successful scheduled run.
