import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete rooms and stories older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTimestamp = Timestamp.fromDate(thirtyDaysAgo);

    let deletedRooms = 0;
    let deletedStories = 0;

    // Query old rooms
    const roomsRef = collection(db, 'rooms');
    const oldRoomsQuery = query(
      roomsRef,
      where('createdAt', '<', cutoffTimestamp)
    );
    const roomsSnapshot = await getDocs(oldRoomsQuery);

    // Process each old room
    for (const roomDoc of roomsSnapshot.docs) {
      const roomId = roomDoc.id;

      // Delete all stories in this room
      const storiesRef = collection(db, 'stories');
      const roomStoriesQuery = query(
        storiesRef,
        where('roomId', '==', roomId)
      );
      const storiesSnapshot = await getDocs(roomStoriesQuery);

      for (const storyDoc of storiesSnapshot.docs) {
        // Delete all votes in this story
        const votesRef = collection(db, 'stories', storyDoc.id, 'votes');
        const votesSnapshot = await getDocs(votesRef);
        
        const votesBatch = writeBatch(db);
        let votesBatchCount = 0;
        
        votesSnapshot.docs.forEach((voteDoc) => {
          votesBatch.delete(voteDoc.ref);
          votesBatchCount++;
        });

        if (votesBatchCount > 0) {
          await votesBatch.commit();
        }

        // Delete the story
        await deleteDoc(storyDoc.ref);
        deletedStories++;
      }

      // Delete all participants in this room
      const participantsRef = collection(db, 'rooms', roomId, 'participants');
      const participantsSnapshot = await getDocs(participantsRef);
      
      const participantsBatch = writeBatch(db);
      let participantsBatchCount = 0;
      
      participantsSnapshot.docs.forEach((participantDoc) => {
        participantsBatch.delete(participantDoc.ref);
        participantsBatchCount++;
      });

      if (participantsBatchCount > 0) {
        await participantsBatch.commit();
      }

      // Delete the room
      await deleteDoc(roomDoc.ref);
      deletedRooms++;
    }

    // Also clean up orphaned stories (stories without a valid room)
    const allStoriesSnapshot = await getDocs(collection(db, 'stories'));
    const allRoomsSnapshot = await getDocs(collection(db, 'rooms'));
    const validRoomIds = new Set(allRoomsSnapshot.docs.map(doc => doc.id));

    let deletedOrphanedStories = 0;
    for (const storyDoc of allStoriesSnapshot.docs) {
      const storyData = storyDoc.data();
      if (!validRoomIds.has(storyData.roomId)) {
        // Delete votes subcollection
        const votesSnapshot = await getDocs(collection(db, 'stories', storyDoc.id, 'votes'));
        const votesBatch = writeBatch(db);
        votesSnapshot.docs.forEach((voteDoc) => {
          votesBatch.delete(voteDoc.ref);
        });
        if (votesSnapshot.docs.length > 0) {
          await votesBatch.commit();
        }

        // Delete orphaned story
        await deleteDoc(storyDoc.ref);
        deletedOrphanedStories++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      stats: {
        deletedRooms,
        deletedStories,
        deletedOrphanedStories,
        cutoffDate: thirtyDaysAgo.toISOString(),
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { 
        error: 'Cleanup failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
