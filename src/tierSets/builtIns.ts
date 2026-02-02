import { TierSetDefinition } from "@twf/contracts";

const commons = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;

const enwiki = (file: string) =>
  `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;

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
      imageSrc: enwiki("Minecraft_2024_cover_art.png"),
    },
    {
      id: "skyrim",
      name: "Skyrim",
      imageSrc: enwiki("The_Elder_Scrolls_V_Skyrim_cover.png"),
    },
    {
      id: "zelda-botw",
      name: "Zelda: BOTW",
      imageSrc: enwiki("The_Legend_of_Zelda_Breath_of_the_Wild.jpg"),
    },
    {
      id: "gta-v",
      name: "GTA V",
      imageSrc: enwiki("Grand_Theft_Auto_V.png"),
    },
    {
      id: "fortnite",
      name: "Fortnite",
      imageSrc: commons("Fortnite.png"),
    },
    {
      id: "pac-man",
      name: "Pac-Man",
      imageSrc: commons("Original_PacMan.svg"),
    },
    {
      id: "tetris",
      name: "Tetris",
      imageSrc: commons("Tetris_logo.png"),
    },
    {
      id: "super-mario-64",
      name: "Super Mario 64",
      imageSrc: commons("Super_Mario_64_logo.png"),
    },
    {
      id: "elden-ring",
      name: "Elden Ring",
      imageSrc: enwiki("Elden_Ring_Box_art.jpg"),
    },
    {
      id: "red-dead-redemption-2",
      name: "Red Dead Redemption 2",
      imageSrc: enwiki("Red_Dead_Redemption_II.jpg"),
    },
    {
      id: "portal-2",
      name: "Portal 2",
      imageSrc: commons("Portal_2_Official_Logo.png"),
    },
    {
      id: "witcher-3",
      name: "The Witcher 3: Wild Hunt",
      imageSrc: enwiki("Witcher_3_cover_art.jpg"),
    },
    {
      id: "halo-combat-evolved",
      name: "Halo: Combat Evolved",
      imageSrc: enwiki("Halo - Combat Evolved (XBox version - box art).jpg"),
    },
    {
      id: "smash-ultimate",
      name: "Super Smash Bros. Ultimate",
      imageSrc: commons("Super_Smash_Bros._Ultimate_logo.svg"),
    },
    {
      id: "super-mario-odyssey",
      name: "Super Mario Odyssey",
      imageSrc: commons("Super_Mario_logo.svg"),
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
      name: "Chick‑fil‑A",
      imageSrc: commons("Chick-fil-A_Logo.svg"),
    },
    {
      id: "mcdonalds",
      name: "McDonald's",
      imageSrc: commons("McDonald's_Golden_Arches.svg"),
    },
    {
      id: "wendys",
      name: "Wendy's",
      imageSrc: commons("Wendy's_logo_2012.svg"),
    },
    {
      id: "tacobell",
      name: "Taco Bell",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/b/b7/Taco_Bell_2023.svg",
    },
    {
      id: "popeyes",
      name: "Popeyes",
      imageSrc: commons("Popeyes_Logo_2020.svg"),
    },
    {
      id: "burger-king",
      name: "Burger King",
      imageSrc: commons("Burger_King_2020.svg"),
    },
    {
      id: "kfc",
      name: "KFC",
      imageSrc: commons("KFC_Logo.svg"),
    },
    {
      id: "subway",
      name: "Subway",
      imageSrc: commons("Subway_2016_logo.svg"),
    },
    {
      id: "dominos",
      name: "Domino's",
      imageSrc: commons("Domino's_pizza_logo.svg"),
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
      imageSrc: commons("Bench-press-2.png"),
    },
    {
      id: "squat",
      name: "Back Squat",
      imageSrc: commons(
        "Woman_doing_squat_workout_in_gym_with_barbell,_back_view.jpg",
      ),
    },
    {
      id: "deadlift",
      name: "Deadlift",
      imageSrc: commons("Dead-lifts-2-2.png"),
    },
    {
      id: "ohp",
      name: "Overhead Press",
      imageSrc: commons("Dumbbell-shoulder-press-1.png"),
    },
    {
      id: "pullups",
      name: "Pull-Ups",
      imageSrc: commons("Pull_ups_1.svg"),
    },
    {
      id: "rdl",
      name: "Romanian Deadlift",
      imageSrc: commons("Romanian-deadlift-1.png"),
    },
    {
      id: "row",
      name: "Bent-Over Row",
      imageSrc: commons("Barbell_row.jpg"),
    },
    {
      id: "lunges",
      name: "Lunges",
      imageSrc: commons("Lunges-2.png"),
    },
    {
      id: "bicep-curl",
      name: "Bicep Curl",
      imageSrc: commons("Biceps-curl-1.png"),
    },
    {
      id: "tricep-dip",
      name: "Tricep Dip",
      imageSrc: commons("Bench-dips-1.png"),
    },
    {
      id: "leg-press",
      name: "Leg Press",
      imageSrc: commons("Leg-press-1-1024x670.png"),
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
        "https://upload.wikimedia.org/wikipedia/en/d/d6/Shingeki_no_Kyojin_manga_volume_1.jpg",
    },
    {
      id: "one-piece",
      name: "One Piece",
      imageSrc: enwiki("One_Piece,_Volume_1.jpg"),
    },
    {
      id: "naruto",
      name: "Naruto",
      imageSrc: enwiki("NarutoCoverTankobon1.jpg"),
    },
    {
      id: "death-note",
      name: "Death Note",
      imageSrc: enwiki("Death_Note_Vol_1.jpg"),
    },
    {
      id: "fullmetal-alchemist-brotherhood",
      name: "FMAB",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/f/f1/Fullmetal_Alchemist_Brotherhood_logo.svg",
    },
    {
      id: "demon-slayer",
      name: "Demon Slayer",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/0/09/Demon_Slayer_-_Kimetsu_no_Yaiba%2C_volume_1.jpg",
    },
    {
      id: "jujutsu-kaisen",
      name: "Jujutsu Kaisen",
      imageSrc: enwiki("Jujutsu_kaisen.jpg"),
    },
    {
      id: "cowboy-bebop",
      name: "Cowboy Bebop",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/a/a9/Cowboy_Bebop_key_visual.jpg",
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
      imageSrc: enwiki("Godfather_ver1.jpg"),
    },
    {
      id: "pulp-fiction",
      name: "Pulp Fiction",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg",
    },
    {
      id: "the-dark-knight",
      name: "The Dark Knight",
      imageSrc: enwiki("Dark_Knight.jpg"),
    },
    {
      id: "inception",
      name: "Inception",
      imageSrc: enwiki("Inception_ver3.jpg"),
    },
    {
      id: "interstellar",
      name: "Interstellar",
      imageSrc: enwiki("Interstellar_film_poster.jpg"),
    },
    {
      id: "spirited-away",
      name: "Spirited Away",
      imageSrc: enwiki("Spirited_Away_Japanese_poster.png"),
    },
    {
      id: "parasite",
      name: "Parasite",
      imageSrc: enwiki("Parasite_(2019_film).png"),
    },
    {
      id: "the-matrix",
      name: "The Matrix",
      imageSrc: "https://upload.wikimedia.org/wikipedia/en/d/db/The_Matrix.png",
    },
    {
      id: "fight-club",
      name: "Fight Club",
      imageSrc: enwiki("Fight_Club_poster.jpg"),
    },
    {
      id: "forrest-gump",
      name: "Forrest Gump",
      imageSrc: enwiki("Forrest_Gump_poster.jpg"),
    },
    {
      id: "the-shawshank-redemption",
      name: "The Shawshank Redemption",
      imageSrc: enwiki("ShawshankRedemptionMoviePoster.jpg"),
    },
    {
      id: "goodfellas",
      name: "Goodfellas",
      imageSrc: enwiki("Goodfellas.jpg"),
    },
    {
      id: "the-lord-of-the-rings-return-of-the-king",
      name: "The Lord of the Rings: The Return of the King",
      imageSrc: enwiki(
        "The_Lord_of_the_Rings_The_Return_of_the_King_(2003_film).jpg",
      ),
    },
    {
      id: "gladiator",
      name: "Gladiator",
      imageSrc: enwiki("Gladiator_(2000_film_poster).png"),
    },
    {
      id: "whiplash",
      name: "Whiplash",
      imageSrc: enwiki("Whiplash_poster.jpg"),
    },
    {
      id: "the-social-network",
      name: "The Social Network",
      imageSrc: enwiki("The_Social_Network_film_poster.png"),
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
      imageSrc: commons("Red_Apple.jpg"),
    },
    {
      id: "banana",
      name: "Banana",
      imageSrc: commons("Banana-Single.jpg"),
    },
    {
      id: "strawberry",
      name: "Strawberry",
      imageSrc: commons("PerfectStrawberry.jpg"),
    },
    {
      id: "orange",
      name: "Orange",
      imageSrc: commons("Orange-Fruit-Pieces.jpg"),
    },
    {
      id: "pineapple",
      name: "Pineapple",
      imageSrc: commons("Pineapple_and_cross_section.jpg"),
    },
    {
      id: "mango",
      name: "Mango",
      imageSrc: commons("Hapus_Mango.jpg"),
    },
    {
      id: "watermelon",
      name: "Watermelon",
      imageSrc: commons("Watermelons.jpg"),
    },
    {
      id: "grapes",
      name: "Grapes",
      imageSrc:
        "https://upload.wikimedia.org/wikipedia/commons/5/5e/Wine_grapes03.jpg",
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
      imageSrc: commons("Tesla_Model_3_parked,_front_driver_side.jpg"),
    },
    {
      id: "toyota-supra",
      name: "Toyota Supra",
      imageSrc: commons("2020_Toyota_GR_Supra_3.0_(UK)_front.jpg"),
    },
    {
      id: "honda-civic",
      name: "Honda Civic",
      imageSrc: commons("2018_Honda_Civic_SR_VTEC_CVT_1.0_Front.jpg"),
    },
    {
      id: "ford-mustang",
      name: "Ford Mustang",
      imageSrc: commons("2018_Ford_Mustang_GT_5.0.jpg"),
    },
    {
      id: "toyota-corolla",
      name: "Toyota Corolla",
      imageSrc: commons(
        "2019_Toyota_Corolla_Icon_Tech_VVT-i_Hybrid_1.8_Front.jpg",
      ),
    },
    {
      id: "bmw-m3",
      name: "BMW M3",
      imageSrc: commons("2018_BMW_M3_Competition_Package_(41507142782).jpg"),
    },
    {
      id: "jeep-wrangler",
      name: "Jeep Wrangler",
      imageSrc: commons(
        "2018_Jeep_Wrangler_Sahara_Unlimited,_front_3.17.18.jpg",
      ),
    },
    {
      id: "porsche-911",
      name: "Porsche 911",
      imageSrc: commons("2019_Porsche_911_Carrera_4S_S-A_3.0_Front.jpg"),
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
    { id: "japan", name: "Japan", imageSrc: commons("Flag_of_Japan.svg") },
    { id: "france", name: "France", imageSrc: commons("Flag_of_France.svg") },
    { id: "italy", name: "Italy", imageSrc: commons("Flag_of_Italy.svg") },
    { id: "brazil", name: "Brazil", imageSrc: commons("Flag_of_Brazil.svg") },
    {
      id: "taiwan",
      name: "Taiwan",
      imageSrc: commons("Flag_of_the_Republic_of_China.svg"),
    },
    { id: "mexico", name: "Mexico", imageSrc: commons("Flag_of_Mexico.svg") },
    { id: "canada", name: "Canada", imageSrc: commons("Flag_of_Canada.svg") },
    {
      id: "south-korea",
      name: "South Korea",
      imageSrc: commons("Flag_of_South_Korea.svg"),
    },

    // +20 more countries (Commons filenames)
    {
      id: "united-states",
      name: "United States",
      imageSrc: commons("Flag_of_the_United_States.svg"),
    },
    {
      id: "united-kingdom",
      name: "United Kingdom",
      imageSrc: commons("Flag_of_the_United_Kingdom.svg"),
    },
    { id: "spain", name: "Spain", imageSrc: commons("Flag_of_Spain.svg") },
    {
      id: "germany",
      name: "Germany",
      imageSrc: commons("Flag_of_Germany.svg"),
    },
    {
      id: "portugal",
      name: "Portugal",
      imageSrc: commons("Flag_of_Portugal.svg"),
    },
    {
      id: "netherlands",
      name: "Netherlands",
      imageSrc: commons("Flag_of_the_Netherlands.svg"),
    },
    {
      id: "switzerland",
      name: "Switzerland",
      imageSrc: commons("Flag_of_Switzerland.svg"),
    },
    { id: "sweden", name: "Sweden", imageSrc: commons("Flag_of_Sweden.svg") },
    { id: "norway", name: "Norway", imageSrc: commons("Flag_of_Norway.svg") },
    {
      id: "finland",
      name: "Finland",
      imageSrc: commons("Flag_of_Finland.svg"),
    },
    {
      id: "australia",
      name: "Australia",
      imageSrc: commons("Flag_of_Australia.svg"),
    },
    {
      id: "new-zealand",
      name: "New Zealand",
      imageSrc: commons("Flag_of_New_Zealand.svg"),
    },
    { id: "india", name: "India", imageSrc: commons("Flag_of_India.svg") },
    {
      id: "china",
      name: "China",
      imageSrc: commons("Flag_of_the_People's_Republic_of_China.svg"),
    },
    {
      id: "thailand",
      name: "Thailand",
      imageSrc: commons("Flag_of_Thailand.svg"),
    },
    {
      id: "vietnam",
      name: "Vietnam",
      imageSrc: commons("Flag_of_Vietnam.svg"),
    },
    {
      id: "indonesia",
      name: "Indonesia",
      imageSrc: commons("Flag_of_Indonesia.svg"),
    },
    {
      id: "philippines",
      name: "Philippines",
      imageSrc: commons("Flag_of_the_Philippines.svg"),
    },
    {
      id: "south-africa",
      name: "South Africa",
      imageSrc: commons("Flag_of_South_Africa.svg"),
    },
    {
      id: "argentina",
      name: "Argentina",
      imageSrc: commons("Flag_of_Argentina.svg"),
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
      imageSrc: commons("Typescript.svg"),
    },
    {
      id: "javascript",
      name: "JavaScript",
      imageSrc: commons("JavaScript-logo.png"),
    },
    {
      id: "python",
      name: "Python",
      imageSrc: commons("Python-logo-notext.svg"),
    },
    { id: "csharp", name: "C%23", imageSrc: commons("Logo_C_sharp.svg") },
    {
      id: "java",
      name: "Java",
      imageSrc: enwiki("Java_programming_language_logo.svg"),
    },
    { id: "go", name: "Go", imageSrc: commons("Go_Logo_Blue.svg") },
    {
      id: "rust",
      name: "Rust",
      imageSrc: commons("Rust_programming_language_black_logo.svg"),
    },
    { id: "kotlin", name: "Kotlin", imageSrc: commons("Kotlin_Icon.png") },
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
    { id: "red", name: "Red", imageSrc: commons("Solid_red.png") },
    { id: "orange", name: "Orange", imageSrc: commons("Solid_orange.png") },
    { id: "yellow", name: "Yellow", imageSrc: commons("Solid_yellow.png") },
    { id: "green", name: "Green", imageSrc: commons("Solid_green.png") },
    { id: "blue", name: "Blue", imageSrc: commons("Solid_blue.png") },
    { id: "purple", name: "Purple", imageSrc: commons("Solid_purple.png") },
    { id: "pink", name: "Pink", imageSrc: commons("Solid_pink.png") },
    { id: "teal", name: "Teal", imageSrc: commons("Solid_teal.png") },
    { id: "black", name: "Black", imageSrc: commons("Solid_black.png") },
    { id: "white", name: "White", imageSrc: commons("Solid_white.png") },
    { id: "gray", name: "Gray", imageSrc: commons("Solid_grey.png") },
    { id: "brown", name: "Brown", imageSrc: commons("Solid_brown.png") },
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
      imageSrc: commons("Mercury_in_true_color.jpg"),
    },
    { id: "venus", name: "Venus", imageSrc: commons("Venus-real_color.jpg") },
    {
      id: "earth",
      name: "Earth",
      imageSrc: commons("The_Earth_seen_from_Apollo_17.jpg"),
    },
    {
      id: "mars",
      name: "Mars",
      imageSrc: commons("OSIRIS_Mars_true_color.jpg"),
    },
    { id: "jupiter", name: "Jupiter", imageSrc: commons("Jupiter.jpg") },
    {
      id: "saturn",
      name: "Saturn",
      imageSrc: commons("Saturn_during_Equinox.jpg"),
    },
    { id: "uranus", name: "Uranus", imageSrc: commons("Uranus2.jpg") },
    { id: "neptune", name: "Neptune", imageSrc: commons("Neptune_Full.jpg") },
    {
      id: "pluto",
      name: "Pluto",
      imageSrc: commons("Nh-pluto-in-true-color_2x_JPEG-edit-frame.jpg"),
    },
    { id: "moon", name: "Moon", imageSrc: commons("FullMoon2010.jpg") },
    {
      id: "ceres",
      name: "Ceres",
      imageSrc: commons("Ceres_-_RC3_-_Haulani_Crater_(22381131691).jpg"),
    },
    {
      id: "io",
      name: "Io",
      imageSrc: commons("Io_highest_resolution_true_color.jpg"),
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
      imageSrc: commons("A_small_cup_of_coffee.JPG"),
    },
    {
      id: "latte",
      name: "Latte",
      imageSrc: commons("Caffè_Latte_at_Pulse_Cafe.jpg"),
    },
    {
      id: "cappuccino",
      name: "Cappuccino",
      imageSrc: commons("Cappuccino_at_Sightglass_Coffee.jpg"),
    },
    {
      id: "americano",
      name: "Americano",
      imageSrc: commons("Caffè_Americano.JPG"),
    },
    {
      id: "cold-brew",
      name: "Cold Brew",
      imageSrc: commons("Iced_coffee_in_glass.jpg"),
    },
    {
      id: "mocha",
      name: "Mocha",
      imageSrc: commons("Mocaccino-Coffee.jpg"),
    },
    { id: "tea", name: "Tea", imageSrc: commons("Black_tea.jpg") },
  ],
};

export const US_NATIONAL_PARKS_25_TIERSET: TierSetDefinition = {
  id: "us-national-parks-25-poc",
  title: "US National Parks (25)",
  description: "Rank these national parks.",
  tiers: [
    { id: "S", name: "S", color: "#E53935" },
    { id: "A", name: "A", color: "#FB8C00" },
    { id: "B", name: "B", color: "#FDD835" },
    { id: "C", name: "C", color: "#43A047" },
    { id: "D", name: "D", color: "#1E88E5" },
  ],
  items: [
    {
      id: "yosemite",
      name: "Yosemite",
      imageSrc: commons("Yosemitefalls.jpg"),
    },
    {
      id: "grand-canyon",
      name: "Grand Canyon",
      imageSrc: commons("Grand_Canyon_view_from_Pima_Point_2010.jpg"),
    },
    {
      id: "yellowstone",
      name: "Yellowstone",
      imageSrc: commons("Morning_Glory_Pool.jpg"),
    },
    {
      id: "zion",
      name: "Zion",
      imageSrc: commons("Zion_angels_landing_view.jpg"),
    },
    {
      id: "bryce-canyon",
      name: "Bryce Canyon",
      imageSrc: commons("Bryce_Canyon_Amphitheater.jpg"),
    },
    { id: "arches", name: "Arches", imageSrc: commons("Delicatearch1.jpg") },
    {
      id: "rocky-mountain",
      name: "Rocky Mountain",
      imageSrc: commons("Bierstadt_Lake_RMNP.jpg"),
    },
    {
      id: "glacier",
      name: "Glacier",
      imageSrc: commons(
        "St_Mary_Lake_&_Wild_Goose_Island,_Glacier_National_Park.jpg",
      ),
    },
    {
      id: "olympic",
      name: "Olympic",
      imageSrc: commons("Hoh_Rain_Forest,_Olympic_National_Park.jpg"),
    },
    {
      id: "rainier",
      name: "Mount Rainier",
      imageSrc: commons("Mount_Rainier_from_west.jpg"),
    },
    {
      id: "grand-teton",
      name: "Grand Teton",
      imageSrc: commons("Teton_Range_from_Schwabacher_Landing.jpg"),
    },
    {
      id: "acadia",
      name: "Acadia",
      imageSrc: commons("Bass_Harbor_Head_Light_Station_2016.jpg"),
    },
    {
      id: "everglades",
      name: "Everglades",
      imageSrc: commons("Everglades_National_Park,_florida.jpg"),
    },
    {
      id: "great-smoky-mountains",
      name: "Great Smoky Mountains",
      imageSrc: commons(
        "Great_Smoky_Mountains_National_Park,_Tennessee,_USA.jpg",
      ),
    },
    {
      id: "shenandoah",
      name: "Shenandoah",
      imageSrc: commons("Shenandoah_National_Park_Skyline_Drive.jpg"),
    },
    {
      id: "death-valley",
      name: "Death Valley",
      imageSrc: commons("Mesquite_Sand_Dunes_in_Death_Valley.jpg"),
    },
    {
      id: "joshua-tree",
      name: "Joshua Tree",
      imageSrc: commons("Joshua_Tree_01.jpg"),
    },
    {
      id: "sequoia",
      name: "Sequoia",
      imageSrc: commons("General_Sherman_Tree.jpg"),
    },
    {
      id: "kings-canyon",
      name: "Kings Canyon",
      imageSrc: commons("Kings_Canyon_National_Park.jpg"),
    },
    {
      id: "redwood",
      name: "Redwood",
      imageSrc: commons("Redwood_National_Park_fog_in_the_forest.jpg"),
    },
    {
      id: "canyonlands",
      name: "Canyonlands",
      imageSrc: commons("Canyonlands_National_Park,_Island_in_the_Sky.jpg"),
    },
    {
      id: "capitol-reef",
      name: "Capitol Reef",
      imageSrc: commons("Capitol_Reef_National_Park_3.jpg"),
    },
    {
      id: "great-sand-dunes",
      name: "Great Sand Dunes",
      imageSrc: commons("Great_Sand_Dunes_National_Park_and_Preserve.jpg"),
    },
    { id: "badlands", name: "Badlands", imageSrc: commons("BadlandsView.jpg") },
    {
      id: "denali",
      name: "Denali",
      imageSrc: commons("Denali_Mt_McKinley.jpg"),
    },
  ],
};

export const TIERSET_PRESETS: TierSetDefinition[] = [
  US_NATIONAL_PARKS_25_TIERSET,
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
