import type {
  AdBanner,
  Comment,
  Competition,
  CreatorRank,
  Track,
  UserProfile,
} from "@/types";

const artists = {
  nika: {
    id: "a1",
    name: "نیکا رضایی",
    avatar: "/images/avatars/a1.jpg",
    bio: "آهنگساز هوش مصنوعی و تهیه‌کننده پاپ",
  },
  arman: {
    id: "a2",
    name: "آرمان کاویانی",
    avatar: "/images/avatars/a2.jpg",
    bio: "رپر و ترانه‌سرا با تمرکز روی وکال طبیعی",
  },
  sara: {
    id: "a3",
    name: "سارا مهرگان",
    avatar: "/images/avatars/a3.jpg",
    bio: "سازنده موزیک‌ویدئو با ابزارهای جنریتیو",
  },
  pouya: {
    id: "a4",
    name: "پویا شریفی",
    avatar: "/images/avatars/a4.jpg",
    bio: "فیوژن سنتی و الکترونیک",
  },
  elahe: {
    id: "a5",
    name: "الهه نادری",
    avatar: "/images/avatars/a5.jpg",
    bio: "آهنگساز امبینت و فضاسازی صوتی",
  },
};

const lyricistAvatars: Record<string, string> = {
  "مهسا کریمی": "/images/avatars/a7.jpg",
  "آرمان کاویانی": artists.arman.avatar,
  "کیان رستمی": "/images/avatars/a8.jpg",
  "پویا شریفی": artists.pouya.avatar,
  "نیکا رضایی": artists.nika.avatar,
  "نوید محمدی": "/images/avatars/a6.jpg",
};

export const currentUser: UserProfile = {
  id: "u1",
  name: "نوید محمدی",
  phone: "0912***7843",
  role: "user",
  avatar: "/images/avatars/a6.jpg",
  bio: "علاقه‌مند به موسیقی تولیدی با هوش مصنوعی",
  joinedAt: "۱۴۰۴/۰۸/۱۲",
};

export const tracks: Track[] = [
  {
    id: "t1",
    title: "شب‌های تهران",
    type: "audio",
    cover: "/images/covers/t1.jpg",
    mediaUrl: "https://dl.aimelody.ir/audio/2026/07/track-1.mp3",
    artist: artists.nika,
    lyricist: "مهسا کریمی",
    vocalOwner: "نیکا رضایی",
    vocalSource: "ai",
    composer: "نیکا رضایی",
    genre: "پاپ",
    language: "فارسی",
    lyrics: `زیر نور نئون خیابان
قدم می‌زنم با خاطراتت
شب‌های تهران هنوز هم
بوی قهوه‌ت رو دارن

بیا دوباره برگردیم
به همون نیمکت پارک
جایی که دنیا آروم بود
و تو فقط می‌خندیدی`,
    aiTools: ["Suno", "ChatGPT"],
    prompt:
      "Persian pop ballad, warm female vocals, night city atmosphere, nostalgic piano and soft synth pads, mid-tempo",
    description: "قطعه‌ای نوستالژیک درباره شب‌های تهران با وکال گرم و فضای شهری.",
    duration: "۳:۲۴",
    plays: 48210,
    favorites: 3120,
    promoted: true,
    competitionId: "c1",
    createdAt: "۱۴۰۵/۰۴/۲۰",
    ratings: { lyrics: 8.6, melody: 9.1, vocals: 8.9, overall: 9.0, count: 842 },
    status: "approved",
  },
  {
    id: "t2",
    title: "کد و ریتم",
    type: "audio",
    cover: "/images/covers/t2.jpg",
    mediaUrl: "https://dl.aimelody.ir/audio/2026/07/track-2.mp3",
    artist: artists.arman,
    lyricist: "آرمان کاویانی",
    vocalOwner: "آرمان کاویانی",
    vocalSource: "own",
    composer: "آرمان کاویانی",
    genre: "رپ",
    language: "فارسی",
    lyrics: `خط به خط کد می‌نویسم روی زندگی
ریتم می‌کوبه تو سینه مثل ضربان شهر
هوش مصنوعی همکارمه نه رقیب من
ما با هم می‌سازیم فردای روشن`,
    aiTools: ["Suno", "ElevenLabs"],
    prompt: "Persian rap, confident male vocals, boom-bap meets trap, tech culture lyrics",
    description: "رپ تکنولوژیک درباره هم‌زیستی انسان و AI.",
    duration: "۲:۵۸",
    plays: 39100,
    favorites: 2780,
    promoted: false,
    createdAt: "۱۴۰۵/۰۴/۱۸",
    ratings: { lyrics: 9.2, melody: 7.8, vocals: 8.4, overall: 8.5, count: 621 },
    status: "approved",
  },
  {
    id: "t3",
    title: "پرواز در مه",
    type: "video",
    cover: "/images/covers/t3.jpg",
    mediaUrl: "https://dl.aimelody.ir/video/2026/07/parvaz-dar-meh.mp4",
    artist: artists.sara,
    lyricist: "کیان رستمی",
    vocalOwner: "سارا مهرگان",
    vocalSource: "ai",
    composer: "سارا مهرگان",
    genre: "الکترونیک",
    language: "بدون کلام",
    aiTools: ["Runway", "Suno", "Midjourney"],
    prompt: "Cinematic electronic music video, foggy mountains, slow aerial shots, ethereal mood",
    description: "موزیک‌ویدئوی سینمایی با تصاویر جنریتیو و فضای امبینت.",
    duration: "۴:۱۲",
    plays: 52040,
    favorites: 4012,
    promoted: true,
    competitionId: "c2",
    createdAt: "۱۴۰۵/۰۴/۱۵",
    ratings: {
      lyrics: 7.5,
      melody: 8.8,
      vocals: 8.1,
      visual: 9.4,
      overall: 8.9,
      count: 1104,
    },
    status: "approved",
  },
  {
    id: "t4",
    title: "صدا از دل کویر",
    type: "audio",
    cover: "/images/covers/t4.jpg",
    mediaUrl: "https://dl.aimelody.ir/audio/2026/07/track-3.mp3",
    artist: artists.pouya,
    lyricist: "پویا شریفی",
    vocalOwner: "استودیو نوا",
    vocalSource: "licensed",
    composer: "پویا شریفی",
    genre: "سنتی",
    language: "فارسی",
    lyrics: `باد می‌گه قصه‌ی شن‌ها رو
از شب‌های بی‌ستاره
من با تار و هوش مصنوعی
آواز کویر می‌خونم`,
    aiTools: ["Suno", "AIVA"],
    prompt: "Persian traditional fusion, setar and ney textures, desert ambience, modern drums",
    description: "تلفیق سازهای سنتی با تولید هوشمند.",
    duration: "۵:۰۱",
    plays: 22100,
    favorites: 1890,
    promoted: false,
    createdAt: "۱۴۰۵/۰۴/۱۲",
    ratings: { lyrics: 8.9, melody: 9.3, vocals: 9.0, overall: 9.1, count: 390 },
    status: "approved",
  },
  {
    id: "t5",
    title: "پالس نیمه‌شب",
    type: "audio",
    cover: "/images/covers/t5.jpg",
    mediaUrl: "https://dl.aimelody.ir/audio/2026/07/track-4.mp3",
    artist: artists.elahe,
    lyricist: "کیان رستمی",
    vocalOwner: "الهه نادری",
    vocalSource: "ai",
    composer: "الهه نادری",
    genre: "امبینت",
    language: "بدون کلام",
    aiTools: ["Suno", "Stable Audio"],
    prompt: "Dark ambient pulse, late night studio, soft bass, atmospheric pads",
    description: "امبینت عمیق برای گوش دادن در شب.",
    duration: "۶:۲۰",
    plays: 15400,
    favorites: 980,
    promoted: false,
    createdAt: "۱۴۰۵/۰۴/۱۰",
    ratings: { lyrics: 6.2, melody: 8.7, vocals: 7.1, overall: 8.0, count: 210 },
    status: "approved",
  },
  {
    id: "t6",
    title: "آینه شکسته",
    type: "video",
    cover: "/images/covers/t6.jpg",
    mediaUrl: "https://dl.aimelody.ir/video/2026/07/ayene-shekaste.mp4",
    artist: artists.sara,
    lyricist: "مهسا کریمی",
    vocalOwner: "سارا مهرگان",
    vocalSource: "own",
    composer: "سارا مهرگان",
    genre: "راک",
    language: "فارسی",
    lyrics: `آینه شکسته رو به روم
تصویرهایی که دیگه نیستن
با صدای گیتار فریاد می‌زنم
که هنوز زنده‌ام`,
    aiTools: ["Runway", "Suno"],
    prompt: "Alt rock music video, broken mirrors motif, high contrast lighting",
    description: "راک آلترناتیو با تصویرسازی نمادین.",
    duration: "۳:۴۵",
    plays: 28900,
    favorites: 2100,
    promoted: false,
    competitionId: "c1",
    createdAt: "۱۴۰۵/۰۴/۰۸",
    ratings: {
      lyrics: 8.4,
      melody: 8.6,
      vocals: 8.8,
      visual: 8.9,
      overall: 8.7,
      count: 455,
    },
    status: "approved",
  },
  {
    id: "t7",
    title: "خورشید مصنوعی",
    type: "audio",
    cover: "/images/covers/t7.jpg",
    mediaUrl: "https://dl.aimelody.ir/audio/2026/07/track-5.mp3",
    artist: artists.nika,
    lyricist: "نیکا رضایی",
    vocalOwner: "نیکا رضایی",
    vocalSource: "ai",
    composer: "نیکا رضایی",
    genre: "الکترونیک",
    language: "فارسی",
    aiTools: ["Suno"],
    prompt: "Uplifting electronic pop, bright synth leads, hopeful chorus",
    description: "پاپ الکترونیک انرژی‌بخش برای شروع روز.",
    duration: "۳:۱۰",
    plays: 17800,
    favorites: 1204,
    promoted: false,
    createdAt: "۱۴۰۵/۰۴/۰۵",
    ratings: { lyrics: 7.9, melody: 8.5, vocals: 8.2, overall: 8.3, count: 298 },
    status: "approved",
  },
  {
    id: "t8",
    title: "نامه‌ای بدون آدرس",
    type: "audio",
    cover: "/images/covers/t8.jpg",
    mediaUrl: "https://dl.aimelody.ir/audio/2026/07/track-6.mp3",
    artist: artists.arman,
    lyricist: "آرمان کاویانی",
    vocalOwner: "آرمان کاویانی",
    vocalSource: "own",
    composer: "آرمان کاویانی",
    genre: "هیپ‌هاپ",
    language: "فارسی",
    lyrics: `نامه نوشتم بدون آدرس
فرستادم تو باد
شاید برسه به کسی
که هنوز منو یادشه`,
    aiTools: ["Suno", "ChatGPT"],
    prompt: "Emotional hip-hop, storytelling, soft piano loop",
    description: "هیپ‌هاپ روایی با فضای احساسی.",
    duration: "۳:۳۳",
    plays: 12400,
    favorites: 860,
    promoted: false,
    createdAt: "۱۴۰۵/۰۴/۰۲",
    ratings: { lyrics: 9.0, melody: 7.9, vocals: 8.3, overall: 8.4, count: 187 },
    status: "approved",
  },
  {
    id: "t9",
    title: "دموی آزمایشی من",
    type: "audio",
    cover: "/images/covers/t9.jpg",
    mediaUrl: "https://dl.aimelody.ir/audio/2026/07/track-7.mp3",
    artist: {
      id: "u1",
      name: "نوید محمدی",
      avatar: currentUser.avatar,
    },
    lyricist: "نوید محمدی",
    vocalOwner: "نوید محمدی",
    vocalSource: "ai",
    genre: "پاپ",
    language: "فارسی",
    aiTools: ["Suno"],
    description: "اثر ارسال‌شده توسط کاربر فعلی — در انتظار تایید.",
    duration: "۲:۴۰",
    plays: 12,
    favorites: 1,
    promoted: false,
    createdAt: "۱۴۰۵/۰۴/۲۶",
    ratings: { lyrics: 0, melody: 0, vocals: 0, overall: 0, count: 0 },
    status: "pending",
  },
  {
    id: "t10",
    title: "ریتم رد شده",
    type: "audio",
    cover: "/images/covers/t10.jpg",
    mediaUrl: "https://dl.aimelody.ir/audio/2026/07/track-8.mp3",
    artist: {
      id: "u1",
      name: "نوید محمدی",
      avatar: currentUser.avatar,
    },
    lyricist: "نوید محمدی",
    vocalOwner: "نوید محمدی",
    vocalSource: "other",
    genre: "راک",
    language: "فارسی",
    aiTools: ["Suno"],
    description: "این اثر به دلیل کیفیت پایین صدا رد شده است.",
    duration: "۳:۰۵",
    plays: 0,
    favorites: 0,
    promoted: false,
    createdAt: "۱۴۰۵/۰۳/۲۰",
    ratings: { lyrics: 0, melody: 0, vocals: 0, overall: 0, count: 0 },
    status: "rejected",
  },
];

export const competitions: Competition[] = [
  {
    id: "c1",
    title: "بهترین آهنگ با شعر آزاد درباره شهر",
    description:
      "آثاری بسازید که حال‌وهوای زندگی شهری را با شعر آزاد روایت کنند. رأی‌گیری مردمی تا پایان مهلت فعال است.",
    cover: "/images/covers/c1.jpg",
    deadline: "۱۴۰۵/۰۵/۱۵",
    status: "active",
    entriesCount: 86,
    prize: "بنر پروموت ۳۰ روزه + جایزه نقدی",
  },
  {
    id: "c2",
    title: "چالش موزیک‌ویدئو جنریتیو",
    description:
      "بهترین ترکیب صدا و تصویر ساخته‌شده با ابزارهای AI. کیفیت بصری وزن بیشتری در امتیاز دارد.",
    cover: "/images/covers/c2.jpg",
    deadline: "۱۴۰۵/۰۵/۳۰",
    status: "active",
    entriesCount: 42,
    prize: "جایزه نقدی ۵ میلیون تومان + اسپانسرشیپ",
  },
  {
    id: "c3",
    title: "فیوژن سنتی × الکترونیک",
    description: "مسابقه پایان‌یافته فصل قبل؛ برندگان اعلام شده‌اند.",
    cover: "/images/covers/c3.jpg",
    deadline: "۱۴۰۵/۰۲/۲۸",
    status: "ended",
    entriesCount: 120,
    prize: "تندیس AiMelody + پروموت ویژه",
  },
];

export const comments: Comment[] = [
  {
    id: "cm1",
    trackId: "t1",
    userName: "مینا",
    avatar: "/images/avatars/a9.jpg",
    body: "وکالش خیلی طبیعیه، حس کردم خواننده واقعی داره می‌خونه.",
    createdAt: "۲ روز پیش",
  },
  {
    id: "cm2",
    trackId: "t1",
    userName: "رضا",
    avatar: "/images/avatars/a8.jpg",
    body: "شعرش ساده و قشنگه. ملودی هم تو ذهن می‌مونه.",
    createdAt: "۳ روز پیش",
  },
  {
    id: "cm3",
    trackId: "t3",
    userName: "آیدا",
    avatar: "/images/avatars/a11.jpg",
    body: "تصاویر ویدئو فوق‌العاده‌ست، مخصوصاً سکانس مه‌آلود.",
    createdAt: "۱ روز پیش",
  },
  {
    id: "cm4",
    trackId: "t2",
    userName: "کسری",
    avatar: "/images/avatars/a10.jpg",
    body: "متن ترانه قوی‌ترین بخششه. فلو هم خوبه.",
    createdAt: "۵ روز پیش",
  },
];

export const ads: AdBanner[] = [
  {
    id: "ad1",
    title: "استودیو صوتی آروان — ۲۰٪ تخفیف سازندگان",
    image: "/images/ads/ad1.jpg",
    href: "#",
    placement: "sidebar",
  },
  {
    id: "ad2",
    title: "دوره پرامپت‌نویسی موسیقی AI",
    image: "/images/ads/ad2.jpg",
    href: "#",
    placement: "inline",
  },
];

export const genres = [
  "همه",
  "پاپ",
  "رپ",
  "سنتی",
  "راک",
  "الکترونیک",
  "هیپ‌هاپ",
  "امبینت",
  "فیوژن",
] as const;

export const favoriteIds = ["t1", "t3", "t4"];

export function getTrackById(id: string) {
  return tracks.find((t) => t.id === id);
}

export function getArtistById(id: string) {
  const fromTrack = getApprovedTracks().find((t) => t.artist.id === id)?.artist;
  return fromTrack;
}

export function getTracksByArtist(artistId: string) {
  return getApprovedTracks().filter((t) => t.artist.id === artistId);
}

export function getAllArtists() {
  const map = new Map<string, (typeof tracks)[0]["artist"]>();
  for (const t of getApprovedTracks()) {
    if (!map.has(t.artist.id)) map.set(t.artist.id, t.artist);
  }
  return [...map.values()];
}

export function searchCatalog(query: string) {
  const q = query.trim();
  if (!q) {
    return { tracks: [] as typeof tracks, artists: [] as ReturnType<typeof getAllArtists>, genres: [] as string[] };
  }
  const trackHits = getApprovedTracks().filter(
    (t) =>
      t.title.includes(q) ||
      t.artist.name.includes(q) ||
      t.genre.includes(q) ||
      t.lyricist.includes(q),
  );
  const artists = getAllArtists().filter((a) => a.name.includes(q) || a.bio?.includes(q));
  const genres = [...new Set(getApprovedTracks().map((t) => t.genre))].filter((g) =>
    g.includes(q),
  );
  return { tracks: trackHits.slice(0, 8), artists: artists.slice(0, 5), genres: genres.slice(0, 5) };
}

export function getCommentsByTrack(trackId: string) {
  return comments.filter((c) => c.trackId === trackId);
}

export function getCompetitionById(id: string) {
  return competitions.find((c) => c.id === id);
}

export function getApprovedTracks() {
  return tracks.filter((t) => t.status === "approved");
}

export function getPromotedTracks() {
  return getApprovedTracks().filter((t) => t.promoted);
}

export function getUserTracks(userId: string) {
  return tracks.filter((t) => t.artist.id === userId);
}

export function sortTracks(
  list: Track[],
  sort: "overall" | "lyrics" | "melody" | "vocals" | "visual" | "popular",
) {
  return [...list].sort((a, b) => {
    if (sort === "popular") return b.plays - a.plays;
    if (sort === "visual") {
      return (b.ratings.visual ?? 0) - (a.ratings.visual ?? 0);
    }
    return b.ratings[sort] - a.ratings[sort];
  });
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n);
}

export function getTopCreators(): CreatorRank[] {
  const map = new Map<
    string,
    { id: string; name: string; avatar: string; bio?: string; sum: number; count: number }
  >();

  for (const t of getApprovedTracks()) {
    const prev = map.get(t.artist.id);
    if (prev) {
      prev.sum += t.ratings.overall;
      prev.count += 1;
    } else {
      map.set(t.artist.id, {
        id: t.artist.id,
        name: t.artist.name,
        avatar: t.artist.avatar,
        bio: t.artist.bio,
        sum: t.ratings.overall,
        count: 1,
      });
    }
  }

  return [...map.values()]
    .map((c) => {
      const avg = c.sum / c.count;
      return {
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        bio: c.bio,
        metricLabel: "میانگین امتیاز",
        metricValue: avg.toFixed(1),
        score: avg,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function getTopLyricists(): CreatorRank[] {
  const map = new Map<
    string,
    { name: string; avatar: string; sum: number; count: number }
  >();

  for (const t of getApprovedTracks()) {
    if (!t.lyricist) continue;
    const prev = map.get(t.lyricist);
    const avatar = lyricistAvatars[t.lyricist] ?? t.artist.avatar;
    if (prev) {
      prev.sum += t.ratings.lyrics;
      prev.count += 1;
    } else {
      map.set(t.lyricist, {
        name: t.lyricist,
        avatar,
        sum: t.ratings.lyrics,
        count: 1,
      });
    }
  }

  return [...map.entries()]
    .map(([id, c]) => {
      const avg = c.sum / c.count;
      return {
        id,
        name: c.name,
        avatar: c.avatar,
        metricLabel: "میانگین شعر",
        metricValue: avg.toFixed(1),
        score: avg,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function getMostProlificCreators(): CreatorRank[] {
  const map = new Map<
    string,
    { id: string; name: string; avatar: string; bio?: string; count: number }
  >();

  for (const t of getApprovedTracks()) {
    const prev = map.get(t.artist.id);
    if (prev) prev.count += 1;
    else {
      map.set(t.artist.id, {
        id: t.artist.id,
        name: t.artist.name,
        avatar: t.artist.avatar,
        bio: t.artist.bio,
        count: 1,
      });
    }
  }

  return [...map.values()]
    .map((c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      bio: c.bio,
      metricLabel: "تعداد اثر",
      metricValue: formatNumber(c.count),
      score: c.count,
    }))
    .sort((a, b) => b.score - a.score);
}

export function vocalSourceLabel(source: Track["vocalSource"]) {
  switch (source) {
    case "ai":
      return "تولیدشده با AI";
    case "own":
      return "صدای خودم / ضبط شخصی";
    case "licensed":
      return "لایسنس‌شده";
    default:
      return "سایر";
  }
}

