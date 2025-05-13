const VALID_PROTOCOLS = ["https:", "http:", "file:", "data:", "package:"];

export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return VALID_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}
