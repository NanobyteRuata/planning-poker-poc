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
import { Checkbox } from '@/components/ui/checkbox';
import { useSession } from 'next-auth/react';
import { ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

interface StoryWorkflowControlProps {
  story: Story;
  isCreator: boolean;
}

export function StoryWorkflowControl({ story, isCreator }: StoryWorkflowControlProps) {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [storyPoints, setStoryPoints] = useState<string>('');
  const [updateJira, setUpdateJira] = useState(true);
  const [jiraUpdateStatus, setJiraUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [jiraError, setJiraError] = useState<string>('');

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
    setJiraUpdateStatus('idle');
    setJiraError('');

    try {
      await updateDoc(doc(db, 'stories', story.id), {
        currentStep: 'complete',
        status: 'completed',
        storyPoint: points,
      });

      if (updateJira && story.ticketId && story.jiraCloudId && session?.accessToken) {
        try {
          const response = await fetch('/api/jira/update-story-points', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              issueKey: story.ticketId,
              storyPoints: points,
              cloudId: story.jiraCloudId,
              addComment: true,
            }),
          });

          if (response.ok) {
            setJiraUpdateStatus('success');
          } else {
            const error = await response.json();
            setJiraUpdateStatus('error');
            setJiraError(error.error || 'Failed to update Jira');
          }
        } catch (jiraError) {
          console.error('Error updating Jira:', jiraError);
          setJiraUpdateStatus('error');
          setJiraError('Failed to connect to Jira');
        }
      }
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
              
              {story.ticketId && story.jiraCloudId && session?.accessToken && (
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                  <Checkbox
                    id="updateJira"
                    checked={updateJira}
                    onCheckedChange={(checked) => setUpdateJira(checked as boolean)}
                    disabled={isUpdating}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="updateJira"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Update Jira ticket {story.ticketId}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Story points will be synced to Jira
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {jiraUpdateStatus === 'success' && (
                <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-md text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Jira ticket updated successfully
                </div>
              )}

              {jiraUpdateStatus === 'error' && (
                <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {jiraError}
                </div>
              )}

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
            {story.ticketId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span>Linked to Jira: {story.ticketId}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
