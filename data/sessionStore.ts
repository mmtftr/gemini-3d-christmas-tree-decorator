const SESSION_KEY = 'christmas-tree-session-id';

export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function hasExistingSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(SESSION_KEY) !== null;
}
