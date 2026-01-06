export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return '';
  
  let guestId = localStorage.getItem('guestUserId');
  
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guestUserId', guestId);
  }
  
  return guestId;
}

export function getGuestName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('guestUserName');
}

export function setGuestName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('guestUserName', name);
}
