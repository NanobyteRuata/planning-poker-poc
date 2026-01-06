import { CreateRoomForm } from '@/components/CreateRoomForm';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Planning Poker</h1>
          <p className="text-muted-foreground">Create a room to get started</p>
        </div>
        <CreateRoomForm />
      </div>
    </div>
  );
}
