#!/usr/bin/env npx tsx
/**
 * Google Search Console OAuth Setup Script
 *
 * Run: npx tsx src/scripts/gsc-auth.ts
 *
 * This script will:
 * 1. Open your browser to authorize access to Google Search Console
 * 2. Start a local server to capture the auth code
 * 3. Exchange the code for a refresh token
 * 4. Print the refresh token for you to add to .env
 */

import { google } from 'googleapis';
import http from 'node:http';
import { URL } from 'node:url';
import open from 'open';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Try app-level .env first, then fall back to root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const REDIRECT_PORT = 3333;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

async function main() {
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('\n❌ Missing credentials!\n');
    console.log('Add these to apps/seo-engine/.env first:\n');
    console.log('  GSC_CLIENT_ID=your-client-id');
    console.log('  GSC_CLIENT_SECRET=your-client-secret\n');
    console.log('Get them from: https://console.cloud.google.com/apis/credentials');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token
  });

  console.log('\n🔐 Google Search Console Authorization\n');
  console.log('Opening browser for authorization...\n');

  // Create server to capture the callback
  const server = http.createServer(async (req, res) => {
    if (!req.url?.startsWith('/callback')) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>❌ Authorization Failed</h1><p>You can close this window.</p>');
      console.error(`\n❌ Authorization failed: ${error}`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>❌ No code received</h1><p>You can close this window.</p>');
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>✅ Authorization Successful!</h1>
            <p>You can close this window and return to the terminal.</p>
          </body>
        </html>
      `);

      console.log('✅ Authorization successful!\n');
      console.log('━'.repeat(50));
      console.log('\nAdd this to your apps/seo-engine/.env file:\n');
      console.log(`GSC_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('\n' + '━'.repeat(50));

      server.close();
      process.exit(0);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h1>❌ Token Exchange Failed</h1><p>Check the terminal for details.</p>');
      console.error('\n❌ Failed to exchange code for token:', err);
      server.close();
      process.exit(1);
    }
  });

  server.listen(REDIRECT_PORT, () => {
    console.log(`Waiting for authorization on port ${REDIRECT_PORT}...\n`);
    open(authUrl);
  });
}

main();
