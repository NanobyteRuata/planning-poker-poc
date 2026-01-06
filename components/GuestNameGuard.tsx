'use client'

import { useState, useEffect } from 'react';
import { getGuestName, setGuestName, getOrCreateGuestId } from '@/lib/guestUser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface GuestNameGuardProps {
  children: React.ReactNode;
}

export function GuestNameGuard({ children }: GuestNameGuardProps) {
  const [hasName, setHasName] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if guest name exists
    const existingName = getGuestName();
    if (existingName) {
      setHasName(true);
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Ensure guest ID is created
      getOrCreateGuestId();
      // Save guest name
      setGuestName(name.trim());
      setHasName(true);
    } catch (error) {
      console.error('Error setting guest name:', error);
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!hasName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Planning Poker</CardTitle>
            <CardDescription>
              Enter your name to get started. This will be used to identify you in all rooms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Your Name</Label>
                <Input
                  id="guestName"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                  autoFocus
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isSubmitting || !name.trim()}
                className="w-full"
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
