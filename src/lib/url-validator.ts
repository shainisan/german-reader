import { lookup } from 'dns/promises';

// Block private, loopback, link-local, and metadata IP ranges
const BLOCKED_IP_PATTERNS = [
  /^127\./, // Loopback
  /^10\./, // Private class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private class B
  /^192\.168\./, // Private class C
  /^169\.254\./, // Link-local / cloud metadata
  /^0\./, // Current network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // Carrier-grade NAT
  /^::1$/, // IPv6 loopback
  /^fc00:/, // IPv6 private
  /^fe80:/, // IPv6 link-local
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.internal',
];

export async function validateUrl(url: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL';
  }

  // Only allow HTTPS
  if (parsed.protocol !== 'https:') {
    return 'Only HTTPS URLs are allowed';
  }

  // Block known dangerous hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return 'This hostname is not allowed';
  }

  // Resolve hostname and check IP
  try {
    const { address } = await lookup(hostname);
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(address)) {
        return 'This URL points to a restricted network address';
      }
    }
  } catch {
    return 'Could not resolve hostname';
  }

  return null; // Valid
}
