'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Vote } from "@/types/story";

interface VoteResultsProps {
  votes: Vote[];
  isRevealed: boolean;
}

export function VoteResults({ votes, isRevealed }: VoteResultsProps) {
  if (!isRevealed || votes.length === 0) {
    return null;
  }

  const voteCounts = votes.reduce(
    (acc, vote) => {
      const point = vote.point.toString();
      if (!acc[point]) {
        acc[point] = {
          point: vote.point,
          count: 0,
          voters: [],
        };
      }
      acc[point].count++;
      acc[point].voters.push(vote.voterName);
      return acc;
    },
    {} as Record<
      string,
      {
        point: number | string;
        count: number;
        voters: string[];
      }
    >
  );

  const sortedVotes = Object.values(voteCounts).sort((a, b) => {
    if (a.point === "?") return 1;
    if (b.point === "?") return -1;
    const aNum = typeof a.point === "number" ? a.point : parseFloat(a.point);
    const bNum = typeof b.point === "number" ? b.point : parseFloat(b.point);
    return bNum - aNum;
  });

  const maxCount = Math.max(...sortedVotes.map((v) => v.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {sortedVotes.map((voteData) => (
            <div key={voteData.point} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-bold">
                    {voteData.point}{" "}
                    {voteData.point === 1 ? "point" : "points"}
                  </Badge>
                  <span className="text-muted-foreground">
                    {voteData.count} {voteData.count === 1 ? "vote" : "votes"}
                  </span>
                </div>
              </div>
              <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary/80 rounded-lg transition-all"
                  style={{
                    width: `${(voteData.count / maxCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
