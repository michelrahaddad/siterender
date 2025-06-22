#!/usr/bin/env node
// Simple healthcheck script for Render
const http = require('http');

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

const options = {
  hostname: host,
  port: port,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.error(`Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (error) => {
  console.error(`Health check error: ${error.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();
