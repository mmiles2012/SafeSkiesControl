// Polyfill for TextEncoder/TextDecoder in Jest (Node < 18)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
// Set a dummy DATABASE_URL for backend tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/testdb';
// Polyfill fetch for Neon serverless
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch');
}
// Mock ws module for WebSocketServer
jest.mock('ws', () => ({
  WebSocketServer: function() { return { on: () => {}, close: () => {} }; },
  Server: function() { return { on: () => {}, close: () => {} }; }
}));
