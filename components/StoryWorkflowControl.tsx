'use client'

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Story, StoryStep } from '@/types/story';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StoryWorkflowControlProps {
  story: Story;
  isCreator: boolean;
}

export function StoryWorkflowControl({ story, isCreator }: StoryWorkflowControlProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [storyPoints, setStoryPoints] = useState<string>('');

  const stepLabels: Record<StoryStep, string> = {
    overview: 'Overview',
    voting: 'Voting',
    reveal: 'Reveal Cards',
    complete: 'Complete',
  };

  const stepDescriptions: Record<StoryStep, string> = {
    overview: 'Participants are viewing the story details',
    voting: 'Participants are voting on this story',
    reveal: 'Votes have been revealed to all participants',
    complete: 'Story has been completed',
  };

  const handleStepChange = async (newStep: StoryStep) => {
    setIsUpdating(true);
    try {
      const updates: any = { currentStep: newStep };
      
      if (newStep === 'reveal') {
        updates.votesRevealed = true;
      }
      
      await updateDoc(doc(db, 'stories', story.id), updates);
    } catch (error) {
      console.error('Error updating step:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const points = parseInt(storyPoints);
    if (isNaN(points) || points < 0) return;

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'stories', story.id), {
        currentStep: 'complete',
        status: 'completed',
        storyPoint: points,
      });
    } catch (error) {
      console.error('Error completing story:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isCreator) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Step</CardTitle>
            <Badge variant="secondary">{stepLabels[story.currentStep]}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {stepDescriptions[story.currentStep]}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Current Step:</span>
          <Badge variant="secondary">{stepLabels[story.currentStep]}</Badge>
        </div>

        {story.currentStep === 'overview' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Participants are viewing the story details. Start voting when ready.
            </p>
            <Button
              onClick={() => handleStepChange('voting')}
              disabled={isUpdating}
              className="w-full"
            >
              Start Voting
            </Button>
          </div>
        )}

        {story.currentStep === 'voting' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Participants are voting. Reveal cards when everyone has voted.
            </p>
            <Button
              onClick={() => handleStepChange('reveal')}
              disabled={isUpdating}
              className="w-full"
            >
              Reveal Cards
            </Button>
          </div>
        )}

        {story.currentStep === 'reveal' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Cards have been revealed. Enter final story points to complete.
            </p>
            <form onSubmit={handleComplete} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="storyPoints">Final Story Points</Label>
                <Input
                  id="storyPoints"
                  type="number"
                  min="0"
                  placeholder="Enter points"
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  disabled={isUpdating}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isUpdating || !storyPoints}
                className="w-full"
              >
                {isUpdating ? 'Completing...' : 'Complete Story'}
              </Button>
            </form>
          </div>
        )}

        {story.currentStep === 'complete' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Story has been completed with {story.storyPoint} points.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
