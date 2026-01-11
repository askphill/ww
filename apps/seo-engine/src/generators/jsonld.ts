export function generateJsonLdScript(jsonLd: object): string {
  const jsonString = JSON.stringify(jsonLd, null, 2);

  return `export const jsonLd = ${jsonString};`;
}
