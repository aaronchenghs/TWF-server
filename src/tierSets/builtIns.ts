import { TierSetDefinition } from "@twf/contracts";

/** This file provides tier set definitions for demonstration/testing purposes. */

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
      name: "Super Mario 64",
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

export const ANIME_TIERSET: TierSetDefinition = {
  id: "anime-poc",
  title: "Anime",
  description: "Rank these shows.",
  tiers: [
    { id: "PEAK", name: "Peak", color: "#E53935" },
    { id: "GREAT", name: "Great", color: "#FB8C00" },
    { id: "GOOD", name: "Good", color: "#FDD835" },
    { id: "OK", name: "Ok", color: "#43A047" },
    { id: "PASS", name: "Pass", color: "#1E88E5" },
  ],
  items: [
    {
      id: "attack-on-titan",
      name: "Attack on Titan",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/7/70/Attack_on_Titan_Series_DVD_cover.jpg",
    },
    {
      id: "one-piece",
      name: "One Piece",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/6/6f/One_Piece%2C_Volume_1.jpg",
    },
    {
      id: "naruto",
      name: "Naruto",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg",
    },
    {
      id: "death-note",
      name: "Death Note",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/6/6f/Death_Note_Vol_1.jpg",
    },
    {
      id: "fullmetal-alchemist-brotherhood",
      name: "FMAB",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/7/7f/Fullmetal_Alchemist_Brotherhood_DVD_box_set_cover.jpg",
    },
    {
      id: "demon-slayer",
      name: "Demon Slayer",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/0/0b/Kimetsu_no_Yaiba%2C_volume_1.jpg",
    },
    {
      id: "jujutsu-kaisen",
      name: "Jujutsu Kaisen",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/4/46/Jujutsu_kaisen.jpg",
    },
    {
      id: "cowboy-bebop",
      name: "Cowboy Bebop",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/7/7c/CowboyBebop.jpg",
    },
  ],
};

export const MOVIES_TIERSET: TierSetDefinition = {
  id: "movies-poc",
  title: "Movies",
  description: "Rank these movies.",
  tiers: [
    { id: "S", name: "S", color: "#E53935" },
    { id: "A", name: "A", color: "#FB8C00" },
    { id: "B", name: "B", color: "#FDD835" },
    { id: "C", name: "C", color: "#43A047" },
    { id: "D", name: "D", color: "#1E88E5" },
    { id: "F", name: "F", color: "#8E24AA" },
  ],
  items: [
    {
      id: "the-godfather",
      name: "The Godfather",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg",
    },
    {
      id: "pulp-fiction",
      name: "Pulp Fiction",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/8/82/Pulp_Fiction_cover.jpg",
    },
    {
      id: "the-dark-knight",
      name: "The Dark Knight",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/8/8a/Dark_Knight.jpg",
    },
    {
      id: "inception",
      name: "Inception",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/7/7f/Inception_ver3.jpg",
    },
    {
      id: "interstellar",
      name: "Interstellar",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg",
    },
    {
      id: "spirited-away",
      name: "Spirited Away",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/d/db/Spirited_Away_Japanese_poster.png",
    },
    {
      id: "parasite",
      name: "Parasite",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png",
    },
    {
      id: "the-matrix",
      name: "The Matrix",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/c/c1/The_Matrix_Poster.jpg",
    },
  ],
};

export const FRUITS_TIERSET: TierSetDefinition = {
  id: "fruits-poc",
  title: "Fruits",
  description: "Rank these fruits.",
  tiers: [
    { id: "FAV", name: "Favorite", color: "#E53935" },
    { id: "GOOD", name: "Good", color: "#FB8C00" },
    { id: "OK", name: "Ok", color: "#FDD835" },
    { id: "NO", name: "No", color: "#1E88E5" },
  ],
  items: [
    {
      id: "apple",
      name: "Apple",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg",
    },
    {
      id: "banana",
      name: "Banana",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg",
    },
    {
      id: "strawberry",
      name: "Strawberry",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/2/29/PerfectStrawberry.jpg",
    },
    {
      id: "orange",
      name: "Orange",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/c/c4/Orange-Fruit-Pieces.jpg",
    },
    {
      id: "pineapple",
      name: "Pineapple",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/c/cb/Pineapple_and_cross_section.jpg",
    },
    {
      id: "mango",
      name: "Mango",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/9/90/Hapus_Mango.jpg",
    },
    {
      id: "watermelon",
      name: "Watermelon",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/4/40/Watermelons.jpg",
    },
    {
      id: "grapes",
      name: "Grapes",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/1/1a/Bunch_of_grapes_%28France%29.jpg",
    },
  ],
};

export const CARS_TIERSET: TierSetDefinition = {
  id: "cars-poc",
  title: "Cars",
  description: "Rank these cars.",
  tiers: [
    { id: "DREAM", name: "Dream", color: "#E53935" },
    { id: "WANT", name: "Want", color: "#FB8C00" },
    { id: "OK", name: "Ok", color: "#FDD835" },
    { id: "PASS", name: "Pass", color: "#43A047" },
    { id: "NO", name: "No", color: "#1E88E5" },
  ],
  items: [
    {
      id: "tesla-model-3",
      name: "Tesla Model 3",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/5/58/Tesla_Model_3_parked%2C_front_driver_side.jpg",
    },
    {
      id: "toyota-supra",
      name: "Toyota Supra",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/0b/2020_Toyota_GR_Supra_3.0_%28UK%29_front.jpg",
    },
    {
      id: "honda-civic",
      name: "Honda Civic",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/1/11/2018_Honda_Civic_SR_VTEC_CVT_1.0_Front.jpg",
    },
    {
      id: "ford-mustang",
      name: "Ford Mustang",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/7/7b/2018_Ford_Mustang_GT_5.0.jpg",
    },
    {
      id: "toyota-corolla",
      name: "Toyota Corolla",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/9/9e/2019_Toyota_Corolla_Icon_Tech_VVT-i_Hybrid_1.8_Front.jpg",
    },
    {
      id: "bmw-m3",
      name: "BMW M3",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/4/4b/2018_BMW_M3_Competition_Package_%2841507142782%29.jpg",
    },
    {
      id: "jeep-wrangler",
      name: "Jeep Wrangler",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/8/8f/2018_Jeep_Wrangler_Sahara_Unlimited%2C_front_3.17.18.jpg",
    },
    {
      id: "porsche-911",
      name: "Porsche 911",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/0f/2019_Porsche_911_Carrera_4S_S-A_3.0_Front.jpg",
    },
  ],
};

export const COUNTRIES_TIERSET: TierSetDefinition = {
  id: "countries-poc",
  title: "Countries",
  description: "Rank these places to visit.",
  tiers: [
    { id: "MUST", name: "Must Visit", color: "#E53935" },
    { id: "SOON", name: "Soon", color: "#FB8C00" },
    { id: "SOMEDAY", name: "Someday", color: "#FDD835" },
    { id: "NO", name: "No", color: "#1E88E5" },
  ],
  items: [
    {
      id: "japan",
      name: "Japan",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/9/9e/Flag_of_Japan.svg",
    },
    {
      id: "france",
      name: "France",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/c/c3/Flag_of_France.svg",
    },
    {
      id: "italy",
      name: "Italy",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/0/03/Flag_of_Italy.svg",
    },
    {
      id: "brazil",
      name: "Brazil",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/0/05/Flag_of_Brazil.svg",
    },
    {
      id: "taiwan",
      name: "Taiwan",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/7/72/Flag_of_the_Republic_of_China.svg",
    },
    {
      id: "mexico",
      name: "Mexico",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/f/fc/Flag_of_Mexico.svg",
    },
    {
      id: "canada",
      name: "Canada",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/c/cf/Flag_of_Canada.svg",
    },
    {
      id: "south-korea",
      name: "South Korea",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/09/Flag_of_South_Korea.svg",
    },
  ],
};

export const PROGRAMMING_LANGUAGES_TIERSET: TierSetDefinition = {
  id: "programming-languages-poc",
  title: "Programming Languages",
  description: "Rank these languages.",
  tiers: [
    { id: "GOAT", name: "GOAT", color: "#E53935" },
    { id: "SOLID", name: "Solid", color: "#FB8C00" },
    { id: "MID", name: "Mid", color: "#FDD835" },
    { id: "NAH", name: "Nah", color: "#1E88E5" },
  ],
  items: [
    {
      id: "typescript",
      name: "TypeScript",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/f/f5/Typescript.svg",
    },
    {
      id: "javascript",
      name: "JavaScript",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png",
    },
    {
      id: "python",
      name: "Python",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg",
    },
    {
      id: "csharp",
      name: "C%23",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/b/bd/Logo_C_sharp.svg",
    },
    {
      id: "java",
      name: "Java",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/3/30/Java_programming_language_logo.svg",
    },
    {
      id: "go",
      name: "Go",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/05/Go_Logo_Blue.svg",
    },
    {
      id: "rust",
      name: "Rust",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/d/d5/Rust_programming_language_black_logo.svg",
    },
    {
      id: "kotlin",
      name: "Kotlin",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/7/74/Kotlin_Icon.png",
    },
  ],
};

export const COLORS_8_TIERS_TIERSET: TierSetDefinition = {
  id: "colors-8-tiers-poc",
  title: "Colors (8 tiers)",
  description: "Rank these colors.",
  tiers: [
    { id: "S", name: "S", color: "#E53935" },
    { id: "A", name: "A", color: "#FB8C00" },
    { id: "B", name: "B", color: "#FDD835" },
    { id: "C", name: "C", color: "#43A047" },
    { id: "D", name: "D", color: "#1E88E5" },
    { id: "E", name: "E", color: "#5E35B1" },
    { id: "F", name: "F", color: "#8E24AA" },
    { id: "G", name: "G", color: "#546E7A" },
  ],
  items: [
    {
      id: "red",
      name: "Red",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/6/6e/Solid_red.png",
    },
    {
      id: "orange",
      name: "Orange",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/4/49/Solid_orange.png",
    },
    {
      id: "yellow",
      name: "Yellow",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/6/6b/Solid_yellow.png",
    },
    {
      id: "green",
      name: "Green",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/1/14/Solid_green.png",
    },
    {
      id: "blue",
      name: "Blue",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/0b/Solid_blue.png",
    },
    {
      id: "purple",
      name: "Purple",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/9/9b/Solid_purple.png",
    },
    {
      id: "pink",
      name: "Pink",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/9/9a/Solid_pink.png",
    },
    {
      id: "teal",
      name: "Teal",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/3/32/Solid_teal.png",
    },
    {
      id: "black",
      name: "Black",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/3/3f/Solid_black.png",
    },
    {
      id: "white",
      name: "White",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/4/48/Solid_white.png",
    },
    {
      id: "gray",
      name: "Gray",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/8/8d/Solid_grey.png",
    },
    {
      id: "brown",
      name: "Brown",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/0f/Solid_brown.png",
    },
  ],
};

export const PLANETS_9_TIERS_TIERSET: TierSetDefinition = {
  id: "planets-9-tiers-poc",
  title: "Planets (9 tiers)",
  description: "Rank these space bodies.",
  tiers: [
    { id: "S", name: "S", color: "#E53935" },
    { id: "A", name: "A", color: "#FB8C00" },
    { id: "B", name: "B", color: "#FDD835" },
    { id: "C", name: "C", color: "#43A047" },
    { id: "D", name: "D", color: "#1E88E5" },
    { id: "E", name: "E", color: "#3949AB" },
    { id: "F", name: "F", color: "#8E24AA" },
    { id: "G", name: "G", color: "#546E7A" },
    { id: "H", name: "H", color: "#6D4C41" },
  ],
  items: [
    {
      id: "mercury",
      name: "Mercury",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg",
    },
    {
      id: "venus",
      name: "Venus",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg",
    },
    {
      id: "earth",
      name: "Earth",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg",
    },
    {
      id: "mars",
      name: "Mars",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg",
    },
    {
      id: "jupiter",
      name: "Jupiter",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg",
    },
    {
      id: "saturn",
      name: "Saturn",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg",
    },
    {
      id: "uranus",
      name: "Uranus",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg",
    },
    {
      id: "neptune",
      name: "Neptune",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg",
    },
    {
      id: "pluto",
      name: "Pluto",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/2/2a/Nh-pluto-in-true-color_2x_JPEG-edit-frame.jpg",
    },
    {
      id: "moon",
      name: "Moon",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg",
    },
    {
      id: "ceres",
      name: "Ceres",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/5/5b/Ceres_-_RC3_-_Haulani_Crater_%2822381131691%29.jpg",
    },
    {
      id: "io",
      name: "Io",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/7/7b/Io_highest_resolution_true_color.jpg",
    },
  ],
};

export const COFFEE_3_TIERS_TIERSET: TierSetDefinition = {
  id: "coffee-3-tiers-poc",
  title: "Coffee (3 tiers)",
  description: "Fast tier list for drink choices.",
  tiers: [
    { id: "LOVE", name: "Love", color: "#E53935" },
    { id: "OK", name: "Ok", color: "#FDD835" },
    { id: "NO", name: "No", color: "#1E88E5" },
  ],
  items: [
    {
      id: "espresso",
      name: "Espresso",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG",
    },
    {
      id: "latte",
      name: "Latte",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/7/7c/Caff%C3%A8_Latte_at_Pulse_Cafe.jpg",
    },
    {
      id: "cappuccino",
      name: "Cappuccino",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/c/c8/Cappuccino_at_Sightglass_Coffee.jpg",
    },
    {
      id: "americano",
      name: "Americano",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/02/Caff%C3%A8_Americano.JPG",
    },
    {
      id: "cold-brew",
      name: "Cold Brew",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/9/9c/Iced_coffee_in_glass.jpg",
    },
    {
      id: "mocha",
      name: "Mocha",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/f/f6/Mocaccino-Coffee.jpg",
    },
    {
      id: "tea",
      name: "Tea",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/0/04/Black_tea.jpg",
    },
  ],
};

export const TIERSET_PRESETS: TierSetDefinition[] = [
  VIDEO_GAMES_TIERSET,
  FAST_FOOD_TIERSET,
  GYM_LIFTS_TIERSET,
  ANIME_TIERSET,
  MOVIES_TIERSET,
  FRUITS_TIERSET,
  CARS_TIERSET,
  COUNTRIES_TIERSET,
  PROGRAMMING_LANGUAGES_TIERSET,
  COLORS_8_TIERS_TIERSET,
  PLANETS_9_TIERS_TIERSET,
  COFFEE_3_TIERS_TIERSET,
];
