export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem('userId');
  
  // Backward compatibility: check for old guestUserId key
  if (!userId) {
    userId = localStorage.getItem('guestUserId');
    if (userId) {
      // Migrate to new key
      localStorage.setItem('userId', userId);
      localStorage.removeItem('guestUserId');
    }
  }
  
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  
  return userId;
}

export function getUserName(): string | null {
  if (typeof window === 'undefined') return null;
  
  let userName = localStorage.getItem('userName');
  
  // Backward compatibility: check for old guestUserName key
  if (!userName) {
    userName = localStorage.getItem('guestUserName');
    if (userName) {
      // Migrate to new key
      localStorage.setItem('userName', userName);
      localStorage.removeItem('guestUserName');
    }
  }
  
  return userName;
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userName', name);
}

export function setUserId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userId', id);
}

export function clearUserData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
}

export function hasUserData(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem('userId') && localStorage.getItem('userName'));
}
