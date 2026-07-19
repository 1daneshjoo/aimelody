export type MediaType = "audio" | "video";
export type UserRole = "guest" | "user" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type Genre =
  | "پاپ"
  | "رپ"
  | "سنتی"
  | "راک"
  | "الکترونیک"
  | "هیپ‌هاپ"
  | "امبینت"
  | "فیوژن";

export type VocalSource = "ai" | "own" | "licensed" | "other";

export interface Ratings {
  lyrics: number;
  melody: number;
  vocals: number;
  visual?: number;
  overall: number;
}

export interface RatingAverages extends Ratings {
  count: number;
}

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
}

export interface PersonCredit {
  name: string;
  avatar?: string;
}

export interface Track {
  id: string;
  title: string;
  type: MediaType;
  cover: string;
  mediaUrl: string;
  artist: Artist;
  lyricist: string;
  vocalOwner: string;
  vocalSource: VocalSource;
  composer?: string;
  genre: string;
  language?: string;
  lyrics?: string;
  aiTools: string[];
  prompt?: string;
  description?: string;
  duration: string;
  plays: number;
  favorites: number;
  promoted: boolean;
  competitionId?: string;
  createdAt: string;
  ratings: RatingAverages;
  status: ApprovalStatus;
}

export interface CreatorRank {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  metricLabel: string;
  metricValue: string;
  score: number;
}

export interface Comment {
  id: string;
  trackId: string;
  userName: string;
  avatar: string;
  body: string;
  createdAt: string;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  cover: string;
  deadline: string;
  status: "active" | "ended" | "upcoming";
  entriesCount: number;
  prize: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar: string;
  bio: string;
  joinedAt: string;
}

export interface AdBanner {
  id: string;
  title: string;
  image: string;
  href: string;
  placement: "sidebar" | "inline" | "preroll";
}

export type ChartPeriod = "day" | "week" | "month" | "all";
export type ChartSort =
  | "overall"
  | "lyrics"
  | "melody"
  | "vocals"
  | "visual"
  | "popular";
