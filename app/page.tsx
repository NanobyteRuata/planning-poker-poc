import { CreateRoomForm } from '@/components/CreateRoomForm';
import { UserRoomsList } from '@/components/UserRoomsList';
import { UserMenu } from '@/components/UserMenu';
import { InfoIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen p-4">
      <div className="absolute top-4 right-4">
        <UserMenu />
      </div>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Planning Poker</h1>
            <p className="text-muted-foreground">Create a room to get started</p>
          </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
          <InfoIcon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Rooms are automatically deleted after 30 days of creation to keep the system clean.
          </p>
        </div>
          <CreateRoomForm />
          <UserRoomsList />
        </div>
      </div>
    </div>
  );
}
