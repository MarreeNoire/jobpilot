/**
 * Fonctions utilitaires pour l'authentification côté client
 */

export function getClientToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => 
    cookie.trim().startsWith('jobpilot_token=')
  );
  
  return tokenCookie ? tokenCookie.split('=')[1] : undefined;
}

export function setClientToken(token: string): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `jobpilot_token=${token}; path=/; max-age=604800; SameSite=lax`;
}

export function clearClientToken(): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = 'jobpilot_token=; path=/; max-age=0; SameSite=lax';
}