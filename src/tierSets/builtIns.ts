import type { TierSetDefinition } from "@twf/contracts";

export const videoGamesTierSet: TierSetDefinition = {
  id: "video-games-poc",
  title: "Video Games",
  description: "Rank these games.",
  tiers: [
    { id: "S", name: "S" },
    { id: "A", name: "A" },
    { id: "B", name: "B" },
    { id: "C", name: "C" },
    { id: "D", name: "D" },
    { id: "F", name: "F" },
  ],
  items: [
    {
      id: "minecraft",
      name: "Minecraft",
      imageSrc: "/tier-sets/video-games/minecraft.jpg",
    },
    {
      id: "skyrim",
      name: "Skyrim",
      imageSrc: "/tier-sets/video-games/skyrim.jpg",
    },
    {
      id: "zelda-botw",
      name: "Zelda: BOTW",
      imageSrc: "/tier-sets/video-games/zelda-botw.jpg",
    },
    {
      id: "gta-v",
      name: "GTA V",
      imageSrc: "/tier-sets/video-games/gta-v.jpg",
    },
  ],
};
