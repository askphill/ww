/**
 * Unsubscribe Token Utility
 *
 * Generates and verifies signed tokens for secure unsubscribe links.
 * Uses HMAC-SHA256 for signing with the AUTH_SECRET environment variable.
 *
 * Token format: base64(JSON payload).base64(HMAC signature)
 * Payload: { subscriberId, iat (issued at timestamp) }
 */

// Token expires after 1 year (in milliseconds)
const TOKEN_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;

interface UnsubscribeTokenPayload {
  subscriberId: number;
  iat: number; // Issued at (Unix timestamp in seconds)
}

/**
 * Encode a string to URL-safe base64
 */
function base64UrlEncode(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decode URL-safe base64 to string
 */
function base64UrlDecode(data: string): string {
  // Add back padding
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
  // Replace URL-safe characters
  const standard = padded.replace(/-/g, '+').replace(/_/g, '/');
  return atob(standard);
}

/**
 * Create HMAC-SHA256 signature using Web Crypto API
 */
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));

  // Convert to base64
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Verify HMAC-SHA256 signature
 */
async function verifySignature(
  data: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const expectedSignature = await createSignature(data, secret);
  return signature === expectedSignature;
}

/**
 * Generate a signed unsubscribe token for a subscriber
 *
 * @param subscriberId - The subscriber's ID
 * @param secret - The AUTH_SECRET from environment
 * @returns Signed token string
 */
export async function generateUnsubscribeToken(
  subscriberId: number,
  secret: string,
): Promise<string> {
  const payload: UnsubscribeTokenPayload = {
    subscriberId,
    iat: Math.floor(Date.now() / 1000), // Current Unix timestamp in seconds
  };

  const payloadString = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadString);
  const signature = await createSignature(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

/**
 * Verify an unsubscribe token and extract the subscriber ID
 *
 * @param token - The token to verify
 * @param secret - The AUTH_SECRET from environment
 * @returns The subscriber ID if valid
 * @throws Error if token is invalid, expired, or tampered with
 */
export async function verifyUnsubscribeToken(
  token: string,
  secret: string,
): Promise<number> {
  // Split token into parts
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid token format');
  }

  const [encodedPayload, signature] = parts;

  // Verify signature
  const isValid = await verifySignature(encodedPayload, signature, secret);
  if (!isValid) {
    throw new Error('Invalid token signature');
  }

  // Decode and parse payload
  let payload: UnsubscribeTokenPayload;
  try {
    const payloadString = base64UrlDecode(encodedPayload);
    payload = JSON.parse(payloadString) as UnsubscribeTokenPayload;
  } catch {
    throw new Error('Invalid token payload');
  }

  // Validate payload structure
  if (
    typeof payload.subscriberId !== 'number' ||
    typeof payload.iat !== 'number'
  ) {
    throw new Error('Invalid token payload structure');
  }

  // Check expiration (1 year from issue date)
  const issuedAt = payload.iat * 1000; // Convert to milliseconds
  const expiresAt = issuedAt + TOKEN_EXPIRY_MS;
  const now = Date.now();

  if (now > expiresAt) {
    throw new Error('Token has expired');
  }

  return payload.subscriberId;
}

/**
 * Generate an unsubscribe URL for a subscriber
 *
 * @param baseUrl - The base URL (e.g., 'https://studio.wakey.care')
 * @param subscriberId - The subscriber's ID
 * @param secret - The AUTH_SECRET from environment
 * @returns Full unsubscribe URL with signed token
 */
export async function generateUnsubscribeUrl(
  baseUrl: string,
  subscriberId: number,
  secret: string,
): Promise<string> {
  const token = await generateUnsubscribeToken(subscriberId, secret);
  return `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}
