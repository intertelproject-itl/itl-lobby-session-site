export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1] ?? ''));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  const exp = payload?.exp;
  return typeof exp !== 'number' || Date.now() >= exp * 1000;
}
