"use client";

import { UserPlus, UserCheck } from "lucide-react";
import { useLibrary } from "@/components/library/LibraryProvider";
import { cn } from "@/lib/utils";

export function ArtistActions({
  artistId,
  className,
}: {
  artistId: string;
  className?: string;
}) {
  const { isFollowing, toggleFollow } = useLibrary();
  const following = isFollowing(artistId);

  return (
    <button
      type="button"
      onClick={() => toggleFollow(artistId)}
      className={cn(following ? "btn btn-ghost" : "btn btn-primary", className)}
    >
      {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
      {following ? "دنبال می‌کنید" : "دنبال کردن"}
    </button>
  );
}
