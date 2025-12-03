// SVG imports - using public folder paths as strings since ReactComponent requires bundler processing
// For SVGs to work as React components, they should be in src/assets, but using public paths here


// PNG imports - using public folder paths

const NFT_Banner = "/assets/images/nft-banner.png";

export const SECTIONS = [
  {
    name: "PLAY AK GAMES",
    selectedOption: null,
    options: [
      {
        icon: "/assets/images/Frame (9).svg",
        text: "Casino",
        hasDropdown: true,
        selectedSubOption: null,
        isOpenedDropdown: false,
        sidebarUrl: "/game",
        dropdownOptions: [
          {
            icon: "/assets/images/AK Originals.svg",
            text: "AK Originals",
            sidebarUrl: "/game",
          },
          {
            icon: "/assets/images/Bonus_Battle.svg",
            text: "Bonus Battles",
            sidebarUrl: "/game",
          },
          { icon: "/assets/images/Slots.svg", text: "Slots", sidebarUrl: "/game"},
          { icon: "/assets/images/Hat.svg", text: "Game Shows", sidebarUrl: "/game"},
          {
            icon: "/assets/images/Live Casino.svg",
            text: "Live Casino",
            sidebarUrl: "/game",
          },
          { icon: "/assets/images/Roulette.svg", text: "Roulette", sidebarUrl: "/game/roulette"},
          { icon: "/assets/images/Blackjack.svg", text: "Blackjack", sidebarUrl: "/game"},
          {
            icon: "/assets/images/WithSidebets.svg",
            text: "With Sidebets",
            sidebarUrl: "/game",
          },
          {
            icon: "/assets/images/Challenges.svg",
            text: "With Challenges",
            sidebarUrl: "/game",
          },
          { icon: "/assets/images/Challenges.svg", text: "Challenges", sidebarUrl: "/game"},
          {
            icon: "/assets/images/Rollercoaster.svg",
            text: "Rollercoaster",
            sidebarUrl: "/game",
          },
        ],
      },
      {
        icon: "/assets/images/Frame (10).svg",
        text: "Sports",
        hasDropdown: true,
        selectedSubOption: null,
        isOpenedDropdown: false,
        sidebarUrl: "/sports",
        dropdownOptions: [
          { icon: "/assets/images/MyBets.svg", text: "My Bets", sidebarUrl: "/my-bets" },
        ],
      },
      {
        icon: "/assets/images/Frame (11).svg",
        text: "NFT",
        hasDropdown: true,
        selectedSubOption: null,
        isOpenedDropdown: false,
        sidebarUrl: "/nft",
        dropdownOptions: [
          { icon: "/assets/images/Frame (11).svg", text: "My NFTs", sidebarUrl: "/nft/portfolio" },
          { icon: "/assets/images/NFT_Loans.svg", text: "NFT Loans", sidebarUrl: "/nft/loans" },
          {
            icon: "/assets/images/Marketplace.svg",
            text: "Marketplace",
            sidebarUrl: "/nft/marketplace",
          },
          {
            icon: "/assets/images/NFT_Lootboxes.svg",
            text: "NFT Lootboxes",
            sidebarUrl: "/nft/lootboxes/play",
          },
          {
            icon: "/assets/images/Settings_Tool.svg",
            text: "Manage AKbots",
            sidebarUrl: "/nft/rollbot/portfolio",
          },
          {
            icon: "/assets/images/Settings_Tool.svg",
            text: "Manage Sportsbots",
            sidebarUrl: "/nft/sportsbots/portfolio",
          },
        ],
      },
      {
        icon: "/assets/images/Frame (12).svg",
        text: "Crypto Futures",
        hasDropdown: true,
        selectedSubOption: null,
        isOpenedDropdown: false,
        dropdownOptions: [
          {
            icon: "/assets/images/Frame (11).svg",
            text: "Crypto Futures",
            sidebarUrl: "/nft/portfolio",
          },
        ], // Add dropdown options and sidebarUrl as needed
      },
      {
        icon: "/assets/images/Frame (13).svg",
        text: "Crypto Portfolio",
        hasDropdown: false,
        selectedSubOption: null,
        isOpenedDropdown: false,
        sidebarUrl: "/crypto-portfolio",
      },
      {
        icon: "/assets/images/Frame (14).svg",
        text: "Clans",
        hasDropdown: false,
        selectedSubOption: null,
        isOpenedDropdown: false,
        sidebarUrl: "/clans",
      },
    ],
  },
  {
    name: "OTHER",
    selectedOption: null,
    options: [
      {
        icon: "/assets/images/Frame (15).svg",
        text: "AK Lottery",
        number: "$5.03K",
        count: "64",
        sidebarUrl: "/ak-lottery",
      },
      {
        icon: "/assets/images/svg.svg",
        text: "Jackpot",
        number: "$31.2",
        count: "10",
        sidebarUrl: "/jackpot",
      },
      { icon: "/assets/images/Frame (16).svg", text: "Streams", sidebarUrl: "/streams" },
    ],
  },
  {
    name: "EVENTS",
    selectedOption: null,
    options: [{ icon: "/assets/images/Frame (17).svg", text: "$25K Race", sidebarUrl: "/25k-race" }],
  },
];

const cardsArray = [
  {
    name: "Sweet Bonanza",
    img: "/assets/images/IMAGE (14).png",
    subcategories: ["Evolution", "Original"],
  },
  {
    name: "Wanted Dead or a Wild",
    img: "/assets/images/IMAGE (15).png",
    subcategories: ["Original"],
  },
  {
    name: "Gates of Olympus",
    img: "/assets/images/IMAGE (16).png",
    subcategories: ["Evolution"],
  },
  {
    name: "Fruit Party",
    img: "/assets/images/IMAGE (17).png",
    subcategories: ["Belatra", "Original"],
  },
  {
    name: "Sugar Rush",
    img: "/assets/images/IMAGE (18).png",
    subcategories: ["Evolution", "Belatra"],
  },
  {
    name: "Plinko",
    img: "/assets/images/IMAGE (19).png",
    subcategories: ["Original"],
  },
];

const RouletteCardsArray = [
  {
    name: "MCRC",
    img: "/assets/images/roulette-mcrc.png",
    subcategories: ["MCRC"],
    id: "mcrc",
  },
];

const cardsArray1 = [];
for (let i = 0; i < 5; i++) {
  cardsArray1.push(...cardsArray);
  cardsArray1.push(...cardsArray);
}
export const DATA_CONTENT = {
  categories: [
    {
      name: "Casino",
      subcategories: [
        {
          name: "AK_ORIGINALS",
          cards: cardsArray1,
        },
        {
          name: "SLOTS",
          cards: cardsArray1,
        },
        {
          name: "GAME_SHOWS",
          cards: cardsArray1,
        },
        {
          name: "LIVE_CASINO",
          cards: cardsArray1,
        },
        {
          name: "ROULETTE",
          cards: RouletteCardsArray,
        },
        {
          name: "BLACKJACK",
          cards: cardsArray1,
        },
        {
          name: "WITH_SIDEBETS",
          cards: cardsArray1,
        },
        {
          name: "WITH_CHALLENGES",
          cards: cardsArray1,
        },
        {
          name: "CHALLENGES",
          cards: cardsArray1,
        },
        {
          name: "ROLLERCOASTER",
          cards: cardsArray1,
        },
      ],
    },
    {
      name: "Sports",
      subcategories: [
        {
          name: "SPORTS",
          cards: cardsArray1,
        },
        {
          name: "MY_BETS",
          cards: cardsArray1,
        },
      ],
    },
    {
      name: "Nft",
      subcategories: [
        {
          name: "NFTS",
          cards: cardsArray1,
        },
        {
          name: "NFT_LOANS",
          cards: cardsArray1,
        },
        {
          name: "MARKETPLACE",
          cards: cardsArray1,
        },
        {
          name: "NFT_LOOTBOXES",
          cards: cardsArray1,
        },
        {
          name: "MANAGE_AKBOTS",
          cards: cardsArray1,
        },
        {
          name: "MANAGE_SPORSBOTS",
          cards: cardsArray1,
        },
      ],
    },
  ],
};

export const IMAGES = [
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (19).png",
];

const originalData = [
  {
    imgSrc: "/assets/images/IMAGE (8).png",
    cartIconSrc: "/assets/images/IMAGE (12).png",
    username: "landice",
    price: "500.00",
  },
  {
    imgSrc: "/assets/images/IMAGE (2).png",
    cartIconSrc: "/assets/images/IMAGE (4).png",
    username: "Hidden",
    price: "320.00",
  },
  {
    imgSrc: "/assets/images/IMAGE (6).png",
    cartIconSrc: "/assets/images/IMAGE (11).png",
    username: "QSharp",
    price: "521.96",
  },
  {
    imgSrc: "/assets/images/IMAGE (5).png",
    cartIconSrc: "/assets/images/IMAGE (10).png",
    username: "staymelo7",
    price: "161.06",
  },
  {
    imgSrc: "/assets/images/IMAGE (9).png",
    cartIconSrc: "/assets/images/IMAGE (13).png",
    username: "Melody👀🎵",
    price: "29.30",
  },
  {
    imgSrc: "/assets/images/IMAGE (5).png",
    cartIconSrc: "/assets/images/IMAGE (10).png",
    username: "staymelo7",
    price: "161.06",
  },
  {
    imgSrc: "/assets/images/IMAGE (9).png",
    cartIconSrc: "/assets/images/IMAGE (13).png",
    username: "Melody👀🎵",
    price: "29.30",
  },
  {
    imgSrc: "/assets/images/IMAGE (8).png",
    cartIconSrc: "/assets/images/IMAGE (12).png",
    username: "landice",
    price: "500.00",
  },
  {
    imgSrc: "/assets/images/IMAGE (2).png",
    cartIconSrc: "/assets/images/IMAGE (4).png",
    username: "Hidden",
    price: "320.00",
  },
  {
    imgSrc: "/assets/images/IMAGE (6).png",
    cartIconSrc: "/assets/images/IMAGE (11).png",
    username: "QSharp",
    price: "521.96",
  },
  {
    imgSrc: "/assets/images/IMAGE (5).png",
    cartIconSrc: "/assets/images/IMAGE (10).png",
    username: "staymelo7",
    price: "161.06",
  },
  {
    imgSrc: "/assets/images/IMAGE (9).png",
    cartIconSrc: "/assets/images/IMAGE (13).png",
    username: "Melody👀🎵",
    price: "29.30",
  },
  {
    imgSrc: "/assets/images/IMAGE (5).png",
    cartIconSrc: "/assets/images/IMAGE (10).png",
    username: "staymelo7",
    price: "161.06",
  },
  {
    imgSrc: "/assets/images/IMAGE (9).png",
    cartIconSrc: "/assets/images/IMAGE (13).png",
    username: "Melody👀🎵",
    price: "29.30",
  },
];

// Define the options
const options = ["Live", "Month", "Week", "Day"] as const;

// Define the type for winner card data
interface WinnerCardData {
  imgSrc: string;
  cartIconSrc: string;
  username: string;
  price: string;
}

// Initialize the WINNER_CARDS object with proper typing
export const WINNER_CARDS: Record<string, WinnerCardData[]> = {};

// Populate WINNER_CARDS with the randomized data for each option
for (const option of options) {
  const shuffledData = [...originalData].sort(() => Math.random() - 0.5);

  WINNER_CARDS[option] = [...shuffledData];
}

export const DAILY_BONUSES = {
  Day: [
    {
      imageSrc: "/assets/images/IMAGE (33).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (34).png",
      title: "Aj9",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (35).png",
      title: "hellomotto",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (33).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (34).png",
      title: "Aj9",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (35).png",
      title: "hellomotto",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (33).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (34).png",
      title: "Aj9",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (35).png",
      title: "hellomotto",
      amount: "$11,393.27",
    },
  ],
  Week: [
    {
      imageSrc: "/assets/images/IMAGE (36).png",
      title: "theoneforus",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (37).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (38).png",
      title: "Phil9077",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (33).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (34).png",
      title: "Aj9",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (35).png",
      title: "hellomotto",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (36).png",
      title: "theoneforus",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (37).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (38).png",
      title: "Phil9077",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (33).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (34).png",
      title: "Aj9",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (35).png",
      title: "hellomotto",
      amount: "$11,393.27",
    },
  ],
  Month: [
    {
      imageSrc: "/assets/images/IMAGE (36).png",
      title: "theoneforus",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (37).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (38).png",
      title: "Phil9077",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (36).png",
      title: "theoneforus",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (37).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (38).png",
      title: "Phil9077",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (36).png",
      title: "theoneforus",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (37).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (38).png",
      title: "Phil9077",
      amount: "$11,393.27",
    },
  ],
  All: [
    {
      imageSrc: "/assets/images/IMAGE (33).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (34).png",
      title: "Aj9",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (35).png",
      title: "hellomotto",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (36).png",
      title: "theoneforus",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (37).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (38).png",
      title: "Phil9077",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (33).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (34).png",
      title: "Aj9",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (35).png",
      title: "hellomotto",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (36).png",
      title: "theoneforus",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (37).png",
      title: "Hidden",
      amount: "$11,393.27",
    },
    {
      imageSrc: "/assets/images/IMAGE (38).png",
      title: "Phil9077",
      amount: "$11,393.27",
    },
  ],
};

export const ACCOUNT_DROPDOWN_OPTIONS = [
  {
    label: "Profile",
    route: "/account/profile",
    icon: "/assets/modelImages/Frame (6).svg",
    altText: "user",
  },
  {
    label: "Balances",
    route: "/account/balances",
    icon: "/assets/modelImages/Frame (7).svg",
    altText: "bag",
  },
  {
    label: "Referrals",
    route: "/account/referrals/codes",
    icon: "/assets/modelImages/Frame (8).svg",
    altText: "flaw",
  },
  {
    label: "Deposits",
    route: "/account/deposits/ALL",
    icon: "/assets/modelImages/Frame (9).svg",
    altText: "build",
  },
  {
    label: "Withdrawals",
    route: "/account/withdrawals/ALL",
    icon: "/assets/modelImages/Frame (9).svg",
    altText: "build",
  },
  {
    label: "Settings",
    route: "/account/settings",
    icon: "/assets/modelImages/Frame (11).svg",
    altText: "gear",
  },
];

export const BUTTONS_MY_BETS = [
  { label: "All", url: "#" },
  { label: "Open Bets", url: "#" },
  { label: "Won", url: "#" },
  { label: "Lost", url: "#" },
  { label: "Cashed Out", url: "#" },
  { label: "Canceled", url: "#" },
  { label: "Refund", url: "#" },
];

export const BUTTONS_NFT_MAIN = [
  { label: "Lobby", url: "/nft" },
  { label: "AK bots V1", url: "/nft/lobby/rollbots" },
  { label: "Sports AK bots", url: "/nft/lobby/sportsbots" },
];

export const BUTTONS_MANAGE_ROLLBOTS = [
  { label: "Portfolio", url: "/nft/rollbot/portfolio" },
  { label: "Marketplace", url: "/nft/rollbot/marketplace" },
  { label: "Staked", url: "/nft/rollbot/staked" },
  { label: "Profile", url: "/nft/rollbot/profile" },
];

export const BUTTONS_MANAGE_SPORTSBOTS = [
  { label: "Portfolio", url: "/nft/sportsbots/portfolio" },
  { label: "Marketplace", url: "/nft/sportsbots/marketplace" },
  { label: "Claimed", url: "/nft/sportsbots/claimed" },
];

export const BUTTONS_MY_NFTs = [
  { label: "Portfolio", url: "/nft/portfolio" },
  { label: "Loans", url: "/nft/my-loans" },
  { label: "External", url: "/nft/external" },
];

export const BUTTONS_NFT_MARKETPLACE = [
  { label: "For Sale", url: "/nft/marketplace" },
  { label: "My Sales", url: "/nft/marketplace/my-sales" },
  { label: "My Purchases", url: "/nft/marketplace/my-purchases" },
  { label: "NFT Box", url: "/nft/marketplace/box" },
];

export const BUTTONS_NFT_LOOTBOXES = [
  { label: "Play", url: "/nft/lootboxes/play" },
  { label: "My Lootboxes", url: "/nft/lootboxes/manage" },
];

export const NFT_BANNER_OPTIONS = [
  {
    title: "LOAN YOUR NFTs FOR INSTANT USD,",
    color: "rgb(114, 242, 56)",
    buttonText: "Get Loans",
    image: NFT_Banner,
    url: "/nft/loans",
  },
  {
    title: "STAKE NFTS AND CASH FOR A CHANCE TO WIN THE JACKPOT!",
    color: "rgb(255, 232, 26)",
    buttonText: "Play Jackpot",
    image: NFT_Banner,
    url: "/jackpot",
  },
];

// Create an object with the information
export const sharedNFTData = {
  detailsContainerInfo: {
    nftImageSrc:
      "https://sportsbot.rollbot.com/pics/694ea6487fada6b225d344b4abe82d28.webp",
    subtitle: "Sports Rollbots",
    price: "$743",
    title: "#7356 Darts",
    moreInfoLink:
      "https://rollbit.com/nft/eth:0x1de7abda2d73a01aa8dca505bdcb773841211daf/7356",
    openSeaLink:
      "https://opensea.io/assets/ethereum/0x1de7abda2d73a01aa8dca505bdcb773841211daf/7356",
    authorLink: "https://opensea.io/0x772d8d6e4a4a5251d7a174e3f60e3f954b386af0",
    authorName: "Rollbots",
    descriptionPart1:
      "**OWNER COUNT and TRADED VOLUME:** The owner count and volume traded displayed on OpenSea is not entirely accurate. Majority of trading and utility staking happens on.",
    descriptionLink: {
      name: "Rollbot.com",
      link: "https://rollbot.com",
    },
    descriptionPart2: ". Total holder count is more than 4,000.",
    descriptionPart3:
      "A collection of 10,000 unique robots generated algorithmically using over 600 traits with proof of ownership on the Ethereum blockchain and a focus on utility. Inspired by Rollbit's first NFT project and other popular utility NFT projects, Sports Rollbots are based on the ERC-721 standard that underlies most digital collectible and utility projects.",
    descriptionPart4:
      "Each Rollbot is a sports-themed piece of digital art that doubles up as a personalised VIP membership for Rollbit's new sportsbook. Own a part of Rollbit's sportsbook and enjoy the perks!",
    prices: ["$749", "$1.22K", "$1.99K"],
  },
  stats: [
    { title: "Profit Share", value: "$14.61" },
    { title: "Max Free Bet", value: "$50" },
    { title: "Max Combo Boost", value: "109%" },
  ],
  traits: [
    { title: "Dart", value: "Green Pattern Dart" },
    { title: "Quiver", value: "ETH Pattern Quiver" },
    { title: "T-Shirt", value: "Green & Purple T-Shirt" },
    { title: "Background", value: "Orange" },
    { title: "Body", value: "Electric Space Skin" },
    { title: "Eyes", value: "VR Eyes" },
    { title: "Sport", value: "Darts" },
    { title: "Teeth", value: "Silver Lips Mouth" },
  ],
  collection: {
    bannerImageSrc:
      "https://i.seadn.io/gae/57kEC5ISf2rx0C289XRZai0sIbsyKELEskI4tRWkEh8ZcTDZZaVfo8lcybI3jmKCaalzGV3PF6z2V7Fooam99Ef2HYQs-3Grt56srw?w=500&amp;auto=format",
    nftImageSrc:
      "https://i.seadn.io/gae/vY0sat6irhxODPlVqkFbKpwwfvTttLmwa4jj8WfNyLK8s0R7aY_3IgXd38Zb54GA1yKxEXZ0bufRBllQAy_y0mzelIk27A6RaOx22A?w=500&amp;auto=format",
    collectionName: "Sports Rollbots",
    authorLink: "https://opensea.io/0x772d8d6e4a4a5251d7a174e3f60e3f954b386af0",
  },
  links: [
    {
      text: "More Info",
      link: "https://rollbit.com/nft/eth:0x1de7abda2d73a01aa8dca505bdcb773841211daf/7356",
    },
    {
      text: "OpenSea",
      link: "https://opensea.io/assets/ethereum/0x1de7abda2d73a01aa8dca505bdcb773841211daf/7356",
    },
    {
      text: "Browse Marketplace",
      link: "https://rollbit.com/nft/eth:0x1de7abda2d73a01aa8dca505bdcb773841211daf",
    },
    {
      text: "OpenSea",
      link: "https://opensea.io/collection/sportsbots",
    },
  ],
};

export const NFTS_DATA = [
  {
    imageSrc: "/assets/images/IMAGE (10).png",
    title: "Golden Grizzly",
    subTitle: "AKbots",
    amount: "$5.88K",
    buttonText: "OPEN FOR $20",
    prices: [3.66, 6.07, 10.1],
    currentPrice: 4.1,
    hasPercentageText: true,
    id: "eh4ff4sd-44s-asd-1",
    ...sharedNFTData,
    detailsContainerInfo: {
      ...sharedNFTData.detailsContainerInfo,
      nftImageSrc: "/assets/images/IMAGE (10).png",
      title: "Golden Grizzly",
      subtitle: "AKbots",
      prices: ["$3.66k", "$6.07K", "$10.1K"],
    },
  },
  {
    imageSrc: "/assets/images/IMAGE (10).png",
    title: "Golden Grizzly",
    subTitle: "AKbots",
    amount: "$5.88K",
    buttonText: "OPEN FOR $20",
    prices: [3.66, 6.07, 10.1],
    currentPrice: 8.9,
    hasPercentageText: false,
    id: "eh4ff4sd-44s-asd-2",
    ...sharedNFTData,
    detailsContainerInfo: {
      ...sharedNFTData.detailsContainerInfo,
      nftImageSrc: "/assets/images/IMAGE (10).png",
      title: "Golden Grizzly",
      subtitle: "AKbots",
      prices: ["$3.66k", "$6.07K", "$10.1K"],
    },
  },
  {
    imageSrc: "/assets/images/IMAGE (10).png",
    title: "Golden Grizzly",
    subTitle: "Sports AKbots",
    amount: "$9.88K",
    buttonText: "OPEN FOR $35.6",
    prices: [3.66, 6.07, 10.1],
    currentPrice: 9.7,
    hasPercentageText: true,
    id: "eh4ff4sd-44s-asd-3",
    ...sharedNFTData,
    detailsContainerInfo: {
      ...sharedNFTData.detailsContainerInfo,
      nftImageSrc: "/assets/images/IMAGE (10).png",
      title: "Golden Grizzly",
      subtitle: "Sports AKbots",
      prices: ["$3.66k", "$6.07K", "$10.1K"],
    },
  },
  {
    imageSrc: "/assets/images/IMAGE (10).png",
    title: "Bored Ape Yacht Club #4848",
    subTitle: "Bored Ape Yacht Club",
    amount: "$490",
    buttonText: "OPEN FOR $20",
    prices: [3.66, 6.07, 10.1],
    currentPrice: 3.8,
    hasPercentageText: false,
    id: "eh4ff4sd-44s-asd-4",
    ...sharedNFTData,
    detailsContainerInfo: {
      ...sharedNFTData.detailsContainerInfo,
      nftImageSrc: "/assets/images/IMAGE (10).png",
      title: "Bored Ape Yacht Club #4848",
      subtitle: "Bored Ape Yacht Club",
      prices: ["$3.66k", "$6.07K", "$10.1K"],
    },
  },
  {
    imageSrc: "/assets/images/IMAGE (10).png",
    title: "POLITICS IS BULLSHIT #34",
    subTitle: "AKbots",
    amount: "$700K",
    buttonText: "OPEN FOR $99",
    prices: [3.66, 6.07, 10.1],
    currentPrice: 8.9,
    hasPercentageText: true,
    id: "eh4ff4sd-44s-asd-5",
    ...sharedNFTData,
    detailsContainerInfo: {
      ...sharedNFTData.detailsContainerInfo,
      nftImageSrc: "/assets/images/IMAGE (10).png",
      title: "POLITICS IS BULLSHIT #34",
      subtitle: "AKbots",
      prices: ["$3.66k", "$6.07K", "$10.1K"],
    },
  },
  {
    imageSrc: "/assets/images/IMAGE (10).png",
    title: "Golden Grizzly",
    subTitle: "Sports AKbots",
    amount: "$9.88K",
    buttonText: "OPEN FOR $35.6",
    prices: [3.66, 6.07, 10.1],
    currentPrice: 3.66,
    hasPercentageText: false,
    id: "eh4ff4sd-44s-asd-6",
    ...sharedNFTData,
    detailsContainerInfo: {
      ...sharedNFTData.detailsContainerInfo,
      nftImageSrc: "/assets/images/IMAGE (10).png",
      title: "Golden Grizzly",
      subtitle: "Sports AKbots",
      prices: ["$3.66k", "$6.07K", "$10.1K"],
    },
  },
  {
    imageSrc: "/assets/images/IMAGE (10).png",
    title: "Bored Ape Yacht Club #4848",
    subTitle: "Bored Ape Yacht Club",
    amount: "$490",
    buttonText: "OPEN FOR $20",
    prices: [3.66, 6.07, 10.1],
    currentPrice: 9.4,
    hasPercentageText: false,
    id: "eh4ff4sd-44s-asd-7",
    ...sharedNFTData,
    detailsContainerInfo: {
      ...sharedNFTData.detailsContainerInfo,
      nftImageSrc: "/assets/images/IMAGE (10).png",
      title: "Bored Ape Yacht Club #4848",
      subtitle: "Bored Ape Yacht Club",
      prices: ["$3.66k", "$6.07K", "$10.1K"],
    },
  },
];
