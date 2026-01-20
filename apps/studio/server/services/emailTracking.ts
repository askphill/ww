/**
 * Email Tracking Service
 *
 * Handles click and open tracking for email campaigns.
 * - Wraps links with tracking redirects
 * - Appends tracking pixel for open tracking
 * - Adds UTM parameters to destination URLs
 */

export interface TrackingOptions {
  baseUrl: string; // e.g., 'https://studio.wakey.care'
  emailSendId: number;
  campaignId: number;
}

/**
 * Add UTM parameters to a URL for campaign attribution
 */
function addUtmParameters(url: string, campaignId: number): string {
  try {
    const urlObj = new URL(url);

    // Only add UTM parameters to external URLs (not our tracking URLs)
    if (!urlObj.pathname.includes('/api/email/track/')) {
      urlObj.searchParams.set('utm_source', 'wakey_email');
      urlObj.searchParams.set('utm_medium', 'email');
      urlObj.searchParams.set('utm_campaign', String(campaignId));
    }

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Wrap a URL with click tracking
 * Format: https://studio.wakey.care/api/email/track/click?eid={{emailSendId}}&url={{encodedUrl}}
 */
function wrapLinkWithTracking(href: string, options: TrackingOptions): string {
  // Skip tracking for unsubscribe links (they should work even without tracking)
  if (href.includes('unsubscribe') || href === '#') {
    return href;
  }

  // Skip mailto: and tel: links
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  // Skip already-tracked links
  if (href.includes('/api/email/track/')) {
    return href;
  }

  // Add UTM parameters to the destination URL
  const urlWithUtm = addUtmParameters(href, options.campaignId);

  // Create the tracking URL
  const trackingUrl = new URL(`${options.baseUrl}/api/email/track/click`);
  trackingUrl.searchParams.set('eid', String(options.emailSendId));
  trackingUrl.searchParams.set('url', urlWithUtm);

  return trackingUrl.toString();
}

/**
 * Regex to match href attributes in HTML
 * Captures: href="url" or href='url'
 */
const HREF_REGEX = /href=["']([^"']+)["']/gi;

/**
 * Wrap all links in HTML with click tracking
 */
export function addClickTracking(
  html: string,
  options: TrackingOptions,
): string {
  return html.replace(HREF_REGEX, (match, href: string) => {
    const trackedUrl = wrapLinkWithTracking(href, options);
    return `href="${trackedUrl}"`;
  });
}

/**
 * Generate the 1x1 transparent tracking pixel URL
 */
export function getTrackingPixelUrl(
  baseUrl: string,
  emailSendId: number,
): string {
  return `${baseUrl}/api/email/track/open?eid=${emailSendId}`;
}

/**
 * Add open tracking pixel to email HTML
 * Appends a 1x1 transparent pixel before </body>
 */
export function addOpenTrackingPixel(
  html: string,
  baseUrl: string,
  emailSendId: number,
): string {
  const pixelUrl = getTrackingPixelUrl(baseUrl, emailSendId);
  const pixelImg = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;

  // Insert before </body> if exists, otherwise append to end
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixelImg}</body>`);
  }

  return html + pixelImg;
}

/**
 * Apply all tracking (clicks + open pixel) to email HTML
 */
export function applyEmailTracking(
  html: string,
  options: TrackingOptions,
): string {
  // Add click tracking to all links
  let trackedHtml = addClickTracking(html, options);

  // Add open tracking pixel
  trackedHtml = addOpenTrackingPixel(
    trackedHtml,
    options.baseUrl,
    options.emailSendId,
  );

  return trackedHtml;
}
