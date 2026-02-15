'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { FolderOpen, History } from 'lucide-react';

interface WelcomeScreenProps {
  onOpenWorkspace: () => void;
  onRestoreWorkspace?: (handle: FileSystemDirectoryHandle) => void;
  recentWorkspaceHandle?: FileSystemDirectoryHandle | null;
  isLoading?: boolean;
}

export function WelcomeScreen({
  onOpenWorkspace,
  onRestoreWorkspace,
  recentWorkspaceHandle,
  isLoading
}: WelcomeScreenProps) {
  return (
    <div className="w-full h-full flex bg-[#1e1e1e]">
      <Card className="w-full h-full bg-black/[0.96] border-0 border-l border-zinc-800 relative overflow-hidden shadow-none rounded-none">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#ec4899" // Pinkish glow for Drona.ai
        />

        <div className="flex h-full flex-col lg:flex-row">
          {/* Left content - Branding & Actions */}
          <div className="flex-1 px-8 py-16 lg:px-16 lg:py-20 relative z-10 flex flex-col justify-center max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-500 tracking-tight mb-2">
              Drona.ai
            </h1>
            <h2 className="text-lg sm:text-xl lg:text-2xl text-pink-500 font-medium mb-6">
              The Socratic CDE.
            </h2>
            <p className="text-neutral-300 text-base lg:text-lg leading-relaxed mb-10">
              Friction where you need it to learn, and seamless flow where you want it to build. <br /><br />
              A cloud development environment that ensures you actually understand the code you paste. Earn your logic.
            </p>

            <div className="flex flex-col gap-4 max-w-sm">
              <button
                onClick={onOpenWorkspace}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FolderOpen size={20} />
                {isLoading ? 'Loading...' : 'Open Workspace'}
              </button>

              {recentWorkspaceHandle && onRestoreWorkspace && (
                <button
                  onClick={() => onRestoreWorkspace(recentWorkspaceHandle)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 px-6 py-3 bg-zinc-900 border border-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <History size={20} className="text-pink-500" />
                  <span className="truncate">Reopen: {recentWorkspaceHandle.name}</span>
                </button>
              )}
            </div>

            {/* Browser compatibility note */}
            {'showDirectoryPicker' in window ? null : (
              <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                <p className="text-xs text-yellow-400">
                  ⚠️ Multi-file workspaces require Chrome or Edge 86+
                </p>
              </div>
            )}
          </div>

          {/* Right content - 3D Scene */}
          <div className="flex-1 relative hidden lg:block min-h-[400px] lg:min-h-0">
            {/* Using a sleek default Spline scene. It renders a cool 3D shape/robot */}
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full scale-110 origin-center"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
