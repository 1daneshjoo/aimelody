const fs = require("fs");
let s = fs.readFileSync("src/data/mock.ts", "utf8");

const map = [
  ["photo-1493225457124-a3eb161ffa5f", "/images/covers/t1.jpg"],
  ["photo-1571330735066-03aaa9429d89", "/images/covers/t2.jpg"],
  ["photo-1511379938547-c1f69419868d", "/images/covers/t3.jpg"],
  ["photo-1459749411175-04bf5296774d", "/images/covers/t4.jpg"],
  ["photo-1470225620780-dba8ba36b745", "/images/covers/t5.jpg"],
  ["photo-1514320291840-b9a56d0bb0bc", "/images/covers/t6.jpg"],
  ["photo-1614613535308-eb5fbd3d2c17", "/images/covers/t7.jpg"],
  ["photo-1487180144351-b8472da7d491", "/images/covers/t8.jpg"],
  ["photo-1598488035139-bdbb2231ce04", "/images/covers/t9.jpg"],
  ["photo-1516280440614-6697288d5d38", "/images/covers/t10.jpg"],
  ["photo-1449824913935-59a10b8d2000", "/images/covers/c1.jpg"],
  ["photo-1618005182384-a83a8bd57fbe", "/images/covers/c2.jpg"],
  ["photo-1507838153414-b4b713384a76", "/images/covers/c3.jpg"],
  ["photo-1598653227233-6a063db5986d", "/images/ads/ad1.jpg"],
];

for (const [photoId, local] of map) {
  s = s.replace(
    new RegExp(`https://images\\.unsplash\\.com/${photoId}[^"]*`, "g"),
    local,
  );
}

// ad2 might already be t10 path if same photo was used — force ads
s = s.replace(
  /image:\s*"\/images\/covers\/t10\.jpg"/g,
  'image: "/images/ads/ad2.jpg"',
);

fs.writeFileSync("src/data/mock.ts", s);
console.log("unsplash left:", (s.match(/unsplash/g) || []).length);
console.log("local images:", (s.match(/\/images\//g) || []).length);
