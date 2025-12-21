import { TierSetDefinition } from "@twf/contracts";

export const VIDEO_GAMES_TIERSET: TierSetDefinition = {
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

export const FAST_FOOD_TIERSET: TierSetDefinition = {
  id: "fast-food-poc",
  title: "Fast Food",
  description: "Rank these chains based on your overall preference.",
  tiers: [
    { id: "GOAT", name: "GOAT" },
    { id: "SOLID", name: "Solid" },
    { id: "MID", name: "Mid" },
    { id: "TRASH", name: "Trash" },
  ],
  items: [
    {
      id: "chickfila",
      name: "Chick-fil-A",
      imageSrc: "/tier-sets/fast-food/chickfila.jpg",
    },
    {
      id: "mcdonalds",
      name: "McDonald's",
      imageSrc: "/tier-sets/fast-food/mcdonalds.jpg",
    },
    {
      id: "wendys",
      name: "Wendy's",
      imageSrc: "/tier-sets/fast-food/wendys.jpg",
    },
    {
      id: "tacobell",
      name: "Taco Bell",
      imageSrc: "/tier-sets/fast-food/tacobell.jpg",
    },
    {
      id: "popeyes",
      name: "Popeyes",
      imageSrc: "/tier-sets/fast-food/popeyes.jpg",
    },
  ],
};

export const GYM_LIFTS_TIERSET: TierSetDefinition = {
  id: "gym-lifts-poc",
  title: "Gym Lifts",
  description: "Rank these lifts by how much you like doing them.",
  tiers: [
    { id: "LOVE", name: "Love It" },
    { id: "LIKE", name: "Like It" },
    { id: "EH", name: "Meh" },
    { id: "HATE", name: "Hate It" },
  ],
  items: [
    {
      id: "bench",
      name: "Bench Press",
      imageSrc: "/tier-sets/gym-lifts/bench.jpg",
    },
    {
      id: "squat",
      name: "Back Squat",
      imageSrc: "/tier-sets/gym-lifts/squat.jpg",
    },
    {
      id: "deadlift",
      name: "Deadlift",
      imageSrc: "/tier-sets/gym-lifts/deadlift.jpg",
    },
    {
      id: "ohp",
      name: "Overhead Press",
      imageSrc: "/tier-sets/gym-lifts/ohp.jpg",
    },
    {
      id: "pullups",
      name: "Pull-Ups",
      imageSrc: "/tier-sets/gym-lifts/pullups.jpg",
    },
    {
      id: "rdl",
      name: "Romanian Deadlift",
      imageSrc: "/tier-sets/gym-lifts/rdl.jpg",
    },
  ],
};
