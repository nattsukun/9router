import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { X509Certificate, createPrivateKey } from "node:crypto";
import tls from "node:tls";

const require = createRequire(import.meta.url);
const originalDataDir = process.env.DATA_DIR;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "enixma-cert-"));
let ca;
beforeAll(() => {
  process.env.DATA_DIR = dir;
  ca = require("../../src/mitm/cert/rootCA.js");
});
afterAll(() => {
  if (originalDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = originalDataDir;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("MITM certificates backed by Node Web Crypto", () => {
  it("generates a CA and signed server certificates accepted by Node TLS", async () => {
    const [paths, same] = await Promise.all([ca.generateRootCA(), ca.generateRootCA()]);
    expect(paths).toEqual(same);
    const pem = fs.readFileSync(paths.cert, "utf8");
    const root = new X509Certificate(pem);
    expect(root.ca).toBe(true);
    expect(root.verify(root.publicKey)).toBe(true);
    expect(ca.isCertExpired(paths.cert)).toBe(false);
    const loaded = ca.loadRootCA();
    const first = await ca.generateLeafCert("example.test", loaded);
    const second = await ca.generateLeafCert("example.test", loaded);
    const leaf = new X509Certificate(first.cert);
    expect(leaf.verify(root.publicKey)).toBe(true);
    expect(leaf.ca).toBe(false);
    expect(leaf.checkHost("example.test")).toBe("example.test");
    expect(leaf.checkHost("api.example.test")).toBe("*.example.test");
    expect(leaf.checkHost("unrelated.test")).toBeUndefined();
    expect(leaf.serialNumber).not.toBe(new X509Certificate(second.cert).serialNumber);
    expect(leaf.checkPrivateKey(createPrivateKey(first.key))).toBe(true);
    expect(() => tls.createSecureContext({ ...first, ca: pem })).not.toThrow();
    await ca.generateRootCA();
    expect(fs.readFileSync(paths.cert, "utf8")).toBe(pem);
  });

  it("loads legacy PKCS#1 root keys without changing the installed certificate", async () => {
    const originalCert = fs.readFileSync(ca.ROOT_CA_CERT_PATH, "utf8");
    const legacyKey = ca.loadRootCA().key.export({ format: "pem", type: "pkcs1" });
    fs.writeFileSync(ca.ROOT_CA_KEY_PATH, legacyKey);
    await ca.generateRootCA();
    const leaf = await ca.generateLeafCert("legacy.test", ca.loadRootCA());
    expect(new X509Certificate(leaf.cert).verify(new X509Certificate(originalCert).publicKey)).toBe(true);
    expect(fs.readFileSync(ca.ROOT_CA_CERT_PATH, "utf8")).toBe(originalCert);
  });

  it("fails closed for invalid certs and hostile DNS subjects", async () => {
    expect(ca.isCertExpired(path.join(dir, "missing.crt"))).toBe(true);
    for (const domain of ["", "test,CN=evil", "a\n.test", "-bad.test", "*.test"]) {
      await expect(ca.generateLeafCert(domain, ca.loadRootCA())).rejects.toThrow("Invalid certificate DNS name");
    }
  });
});
