import { BottomNav } from "@/components/bottom-nav";
import { BackgroundMusic } from "@/components/background-music";
import { AudioToggle } from "@/components/audio-toggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AudioToggle />
      <BottomNav />
      <BackgroundMusic />
    </>
  );
}
