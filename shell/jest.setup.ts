// Extends Jest's expect() with DOM matchers (toBeInTheDocument, etc.)
import "@testing-library/jest-dom";

// jsdom lacks a full Web Crypto (crypto.subtle) and TextEncoder/atob in some
// setups. Polyfill from Node so client-side crypto (RSA-OAEP via Web Crypto)
// can be unit-tested deterministically.
import { webcrypto } from "node:crypto";
import { TextEncoder, TextDecoder } from "node:util";

if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}
if (typeof globalThis.TextEncoder === "undefined") {
  // @ts-expect-error — align Node's TextEncoder with the DOM type for tests.
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  // @ts-expect-error — align Node's TextDecoder with the DOM type for tests.
  globalThis.TextDecoder = TextDecoder;
}
if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (b64: string) => Buffer.from(b64, "base64").toString("binary");
}
if (typeof globalThis.btoa === "undefined") {
  globalThis.btoa = (s: string) => Buffer.from(s, "binary").toString("base64");
}
