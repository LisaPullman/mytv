import '@testing-library/jest-dom/extend-expect';

// jsdom 环境不带 TextEncoder / WebCrypto,补齐以支持 crypto.subtle 签名类逻辑
// eslint-disable-next-line no-undef
if (typeof globalThis.TextEncoder === 'undefined') {
  // eslint-disable-next-line no-undef
  globalThis.TextEncoder = require('util').TextEncoder;
}
// eslint-disable-next-line no-undef
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  // eslint-disable-next-line no-undef
  globalThis.crypto = require('crypto').webcrypto;
}

// Allow router mocks.
// eslint-disable-next-line no-undef
jest.mock('next/router', () => require('next-router-mock'));
