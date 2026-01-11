import { TierSetDefinition } from "@twf/contracts";

/** This file provides three tier set definitions for demonstration purposes. */

export const VIDEO_GAMES_TIERSET: TierSetDefinition = {
  id: "video-games-poc",
  title: "Video Games",
  description: "Rank these games.",
  tiers: [
    { id: "S", name: "S", color: "#E53935" },
    { id: "A", name: "A", color: "#FB8C00" },
    { id: "B", name: "B", color: "#FDD835" },
    { id: "C", name: "C", color: "#43A047" },
    { id: "D", name: "D", color: "#1E88E5" },
  ],
  items: [
    {
      id: "minecraft",
      name: "Minecraft",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/b/b6/Minecraft_2024_cover_art.png",
    },
    {
      id: "skyrim",
      name: "Skyrim",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/1/15/The_Elder_Scrolls_V_Skyrim_cover.png",
    },
    {
      id: "zelda-botw",
      name: "Zelda: BOTW",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg",
    },
    {
      id: "gta-v",
      name: "GTA V",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png",
    },
    {
      id: "fortnite",
      name: "Fortnite",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/3/36/Fortnite.png",
    },
    {
      id: "pac-man",
      name: "Pac-Man",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Original_PacMan.svg/500px-Original_PacMan.svg.png",
    },
    {
      id: "tetris",
      name: "Tetris",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/4/46/Tetris_logo.png",
    },
    {
      id: "super-mario-64",
      name: "Super Mario 64",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/4/44/Super_Mario_64_logo.png",
    },
  ],
};

export const FAST_FOOD_TIERSET: TierSetDefinition = {
  id: "fast-food-poc",
  title: "Fast Food",
  description: "Rank these chains based on your overall preference.",
  tiers: [
    { id: "GOAT", name: "GOAT", color: "#E53935" },
    { id: "SOLID", name: "Solid", color: "#FB8C00" },
    { id: "MID", name: "Mid", color: "#FDD835" },
    { id: "TRASH", name: "Trash", color: "#43A047" },
  ],
  items: [
    {
      id: "chickfila",
      name: "Chick-fil-A",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/0e/Chick-fil-a.jpg",
    },
    {
      id: "mcdonalds",
      name: "McDonald's",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/McDonald%27s_logo.svg/1014px-McDonald%27s_logo.svg.png",
    },
    {
      id: "wendys",
      name: "Wendy's",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Wendy%27s_logo_2012.svg/1280px-Wendy%27s_logo_2012.svg.png",
    },
    {
      id: "tacobell",
      name: "Taco Bell",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Taco_Bell_%2850323181546%29.jpg/1280px-Taco_Bell_%2850323181546%29.jpg",
    },
    {
      id: "popeyes",
      name: "Popeyes",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Popeyes_Logo_2020.svg/1280px-Popeyes_Logo_2020.svg.png",
    },
    {
      id: "burger-king",
      name: "Burger King",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/2/2e/Burger_King_logo_2020.png",
    },
    {
      id: "kfc",
      name: "KFC",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/b/b8/KFC_logo.png",
    },
    {
      id: "subway",
      name: "Subway",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Subway_2016_logo.svg/960px-Subway_2016_logo.svg.png",
    },
    {
      id: "dominos",
      name: "Domino's",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Domino%27s_pizza_logo.svg/960px-Domino%27s_pizza_logo.svg.png",
    },
  ],
};

export const GYM_LIFTS_TIERSET: TierSetDefinition = {
  id: "gym-lifts-poc",
  title: "Gym Lifts",
  description: "Rank these lifts by how much you like doing them.",
  tiers: [
    { id: "LOVE", name: "Love It", color: "#E53935" },
    { id: "LIKE", name: "Like It", color: "#FB8C00" },
    { id: "EH", name: "Meh", color: "#FDD835" },
    { id: "HATE", name: "Hate It", color: "#1E88E5" },
  ],
  items: [
    {
      id: "bench",
      name: "Bench Press",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/f/f7/Bench-press-2.png",
    },
    {
      id: "squat",
      name: "Back Squat",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Woman_doing_squat_workout_in_gym_with_barbell,_back_view.jpg/960px-Woman_doing_squat_workout_in_gym_with_barbell,_back_view.jpg",
    },
    {
      id: "deadlift",
      name: "Deadlift",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/1/1f/Dead-lifts-2-2.png",
    },
    {
      id: "ohp",
      name: "Overhead Press",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/1/15/Dumbbell-shoulder-press-1.png",
    },
    {
      id: "pullups",
      name: "Pull-Ups",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Pull_ups_1.svg/960px-Pull_ups_1.svg.png",
    },
    {
      id: "rdl",
      name: "Romanian Deadlift",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/e/e8/Romanian-deadlift-1.png",
    },
    {
      id: "row",
      name: "Bent-Over Row",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Barbell_row.jpg/960px-Barbell_row.jpg",
    },
    {
      id: "lunges",
      name: "Lunges",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Lunges-2.png/900px-Lunges-2.png",
    },
    {
      id: "bicep-curl",
      name: "Bicep Curl",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/7/7f/Biceps-curl-1.png",
    },
    {
      id: "tricep-dip",
      name: "Tricep Dip",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/d/d0/Bench-dips-1.png",
    },
    {
      id: "leg-press",
      name: "Leg Press",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/0c/Leg-press-1-1024x670.png",
    },
  ],
};
