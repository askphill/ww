import type {EmailSection} from '../types';
import {
  renderHeaderHtml,
  renderHeroHtml,
  renderImageHtml,
  renderProductGridHtml,
  renderTextBlockHtml,
  renderImageTextSplitHtml,
  renderCtaButtonHtml,
  renderFooterHtml,
} from './sectionRenderers';

function renderSection(section: EmailSection): string {
  switch (section.type) {
    case 'header':
      return renderHeaderHtml(section.config);
    case 'hero':
      return renderHeroHtml(section.config);
    case 'image':
      return renderImageHtml(section.config);
    case 'product_grid':
      return renderProductGridHtml(section.config);
    case 'text_block':
      return renderTextBlockHtml(section.config);
    case 'image_text_split':
      return renderImageTextSplitHtml(section.config);
    case 'cta_button':
      return renderCtaButtonHtml(section.config);
    case 'footer':
      return renderFooterHtml(section.config);
    default:
      return '';
  }
}

export function renderToEmail(sections: EmailSection[]): string {
  const sectionsHtml = sections.map(renderSection).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff;">
          <tr>
            <td>
${sectionsHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
