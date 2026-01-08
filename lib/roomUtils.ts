import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function deleteRoom(roomId: string): Promise<void> {
  try {
    // Delete all stories in this room
    const storiesRef = collection(db, 'stories');
    const roomStoriesQuery = query(storiesRef, where('roomId', '==', roomId));
    const storiesSnapshot = await getDocs(roomStoriesQuery);

    for (const storyDoc of storiesSnapshot.docs) {
      // Delete all votes for this story
      const votesRef = collection(db, 'votes');
      const votesQuery = query(votesRef, where('storyId', '==', storyDoc.id));
      const votesSnapshot = await getDocs(votesQuery);

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
    await deleteDoc(doc(db, 'rooms', roomId));
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}
