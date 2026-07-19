"use client";

import { UserPlus, UserCheck } from "lucide-react";
import { useLibrary } from "@/components/library/LibraryProvider";

export function ArtistActions({ artistId }: { artistId: string }) {
  const { isFollowing, toggleFollow } = useLibrary();
  const following = isFollowing(artistId);

  return (
    <button
      type="button"
      onClick={() => toggleFollow(artistId)}
      className={following ? "btn btn-ghost" : "btn btn-primary"}
    >
      {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
      {following ? "دنبال می‌کنید" : "دنبال کردن"}
    </button>
  );
}
