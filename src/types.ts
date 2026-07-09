/**
 * types.ts — TypeScript type definitions for The Legend of Zelda: The Minish Cap save files.
 *
 * Derived from:
 *   include/save.h   — SaveFile, SaveHeader, KinstoneSave structs
 *   include/item.h   — Item enum
 *   include/player.h — Stats, PlayerRoomStatus, PlayerSkill, SpawnType
 *   include/flags.h  — Flag enums, local flag bank offsets
 *   include/area.h   — AreaId enum
 *   include/kinstone.h — KinstoneId enum
 */

// ---------------------------------------------------------------------------
// Item enum — mirrors include/item.h
// ---------------------------------------------------------------------------

/**
 * All item IDs used by The Minish Cap.
 * The `inventory` field of a SaveSlot stores a 2-bit value for each ID in the
 * range 0x00–0x75.  IDs above 0x75 (KINSTONE_RED etc.) are used only in drop
 * tables and are never stored in the save inventory.
 */
export enum Item {
  None                = 0x00,
  SmithSword          = 0x01, // Smith's Sword (starting weapon)
  GreenSword          = 0x02, // White Sword
  RedSword            = 0x03, // White Sword + Earth Element
  BlueSword           = 0x04, // White Sword + all 4 elements
  UnusedSword         = 0x05,
  FourSword           = 0x06, // Four Sword
  Bombs               = 0x07,
  RemoteBombs         = 0x08,
  Bow                 = 0x09,
  LightArrow          = 0x0A,
  Boomerang           = 0x0B,
  MagicBoomerang      = 0x0C,
  Shield              = 0x0D,
  MirrorShield        = 0x0E,
  LanternOff          = 0x0F,
  LanternOn           = 0x10,
  GustJar             = 0x11,
  PacciCane           = 0x12,
  MoleMitts           = 0x13,
  RocsCape            = 0x14,
  PegasusBoots        = 0x15,
  FireRod             = 0x16,
  Ocarina             = 0x17,
  OrbGreen            = 0x18,
  OrbBlue             = 0x19,
  OrbRed              = 0x1A,
  TryPickupObject     = 0x1B,
  Bottle1             = 0x1C,
  Bottle2             = 0x1D,
  Bottle3             = 0x1E,
  Bottle4             = 0x1F,
  // --- Bottle contents (not directly equippable) ---
  BottleEmpty         = 0x20,
  BottleButter        = 0x21,
  BottleMilk          = 0x22,
  BottleHalfMilk      = 0x23,
  BottleRedPotion     = 0x24,
  BottleBluePotion    = 0x25,
  BottleWater         = 0x26,
  BottleMineralWater  = 0x27,
  BottleFairy         = 0x28,
  BottlePicolyteRed   = 0x29,
  BottlePicolyteOrange= 0x2A,
  BottlePicolyteYellow= 0x2B,
  BottlePicolyteGreen = 0x2C,
  BottlePicolyteBlue  = 0x2D,
  BottlePicolyteWhite = 0x2E,
  BottleCharmNayru    = 0x2F,
  BottleCharmFarore   = 0x30,
  BottleCharmDin      = 0x31,
  // 0x32, 0x33 — unused
  // --- Quest items ---
  QstSword            = 0x34, // Jabber Nut / Smith's Sword for quest
  QstBrokenSword      = 0x35,
  QstDogfood          = 0x36,
  QstLonLonKey        = 0x37,
  QstMushroom         = 0x38,
  QstBook1            = 0x39,
  QstBook2            = 0x3A,
  QstBook3            = 0x3B,
  QstGraveyardKey     = 0x3C,
  QstTingleTrophy     = 0x3D,
  QstCarlovMedal      = 0x3E,
  Shells              = 0x3F, // Mysterious Shells
  // --- Key items / elements ---
  EarthElement        = 0x40,
  FireElement         = 0x41,
  WaterElement        = 0x42,
  WindElement         = 0x43,
  GripRing            = 0x44,
  PowerBracelets      = 0x45,
  Flippers            = 0x46,
  Map                 = 0x47, // Hyrule World Map
  // --- Sword skills ---
  SkillSpinAttack     = 0x48,
  SkillRollAttack     = 0x49,
  SkillDashAttack     = 0x4A,
  SkillRockBreaker    = 0x4B,
  SkillSwordBeam      = 0x4C,
  SkillGreatSpin      = 0x4D,
  SkillDownThrust     = 0x4E,
  SkillPerilBeam      = 0x4F,
  // --- Dungeon collectibles (consumable slots) ---
  DungeonMap          = 0x50,
  Compass             = 0x51,
  BigKey              = 0x52,
  SmallKey            = 0x53,
  // --- Rupees / pickups (drop-only, not in inventory) ---
  Rupee1              = 0x54,
  Rupee5              = 0x55,
  Rupee20             = 0x56,
  Rupee50             = 0x57,
  Rupee100            = 0x58,
  Rupee200            = 0x59,
  Item5A              = 0x5A,
  Jabbernut           = 0x5B,
  Kinstone            = 0x5C,
  Bombs5              = 0x5D,
  Arrows5             = 0x5E,
  Heart               = 0x5F,
  Fairy               = 0x60,
  Shells30            = 0x61,
  HeartContainer      = 0x62,
  HeartPiece          = 0x63,
  // --- Upgrades (obtained through side quests / shops) ---
  Wallet              = 0x64,
  BombBag             = 0x65,
  LargeQuiver         = 0x66,
  KinstoneBag         = 0x67,
  // --- Bakery items ---
  Brioche             = 0x68,
  Croissant           = 0x69,
  Pie                 = 0x6A,
  Cake                = 0x6B,
  // --- More ammo pickups ---
  Bombs10             = 0x6C,
  Bombs30             = 0x6D,
  Arrows10            = 0x6E,
  Arrows30            = 0x6F,
  // --- Butterfly upgrades ---
  ArrowButterfly      = 0x70,
  DigButterfly        = 0x71,
  SwimButterfly       = 0x72,
  // --- Additional skills ---
  SkillFastSpin       = 0x73,
  SkillFastSplit      = 0x74,
  SkillLongSpin       = 0x75,
  // --- Drop-only special values (not stored in SaveFile inventory) ---
  KinstoneRed         = 0xFC,
  KinstoneBlue        = 0xFD,
  KinstoneGreen       = 0xFE,
  EnemyBeetle         = 0xFF,
}

// ---------------------------------------------------------------------------
// Area ID enum — mirrors include/area.h
// ---------------------------------------------------------------------------

/** Area identifiers used for the player's saved position. */
export enum AreaId {
  MinishWoods               = 0x00,
  MinishVillage             = 0x01,
  HyruleTown                = 0x02,
  HyruleField               = 0x03,
  CastorWilds               = 0x04,
  Ruins                     = 0x05,
  MtCrenel                  = 0x06,
  CastleGarden              = 0x07,
  CloudTops                 = 0x08,
  RoyalValley               = 0x09,
  VeilFalls                 = 0x0A,
  LakeHylia                 = 0x0B,
  LakeWoodsCave             = 0x0C,
  Beanstalks                = 0x0D,
  MelarisMine               = 0x10,
  MinishPaths               = 0x11,
  CrenelMinishPaths         = 0x12,
  DigCaves                  = 0x13,
  CrenelDigCave             = 0x14,
  FestivalTown              = 0x15,
  MinishHouseInteriors      = 0x20,
  HouseInteriors1           = 0x21,
  HouseInteriors2           = 0x22,
  HouseInteriors3           = 0x23,
  TreeInteriors             = 0x24,
  Dojos                     = 0x25,
  CrenelCaves               = 0x26,
  MinishCracks              = 0x27,
  HouseInteriors4           = 0x28,
  GreatFairies              = 0x29,
  CastorCaves               = 0x2A,
  WindTribeTower            = 0x30,
  WindTribeTowerRoof        = 0x31,
  Caves                     = 0x32,
  VeilFallsCaves            = 0x33,
  RoyalValleyGraves         = 0x34,
  MinishCaves               = 0x35,
  HyruleTownUnderground     = 0x41,
  GardenFountains           = 0x42,
  HyruleCastleCellar        = 0x43,
  DeepwoodShrine            = 0x48,
  DeepwoodShrineBoss        = 0x49,
  DeepwoodShrineEntry       = 0x4A,
  CaveOfFlames              = 0x50,
  CaveOfFlamesBoss          = 0x51,
  FortressOfWinds           = 0x58,
  FortressOfWindsTop        = 0x59,
  TempleOfDroplets          = 0x60,
  RoyalCrypt                = 0x68,
  PalaceOfWinds             = 0x70,
  PalaceOfWindsBoss         = 0x71,
  Sanctuary                 = 0x78,
  SanctuaryEntrance         = 0x79,
  HyruleCastle              = 0x80,
  DarkHyruleCastle          = 0x88,
  DarkHyruleCastleOutside   = 0x89,
  VaatisArms                = 0x8A,
  VaatiPhase3               = 0x8B,
  VaatiPhase2               = 0x8C,
  DarkHyruleCastleBridge    = 0x8D,
}

// ---------------------------------------------------------------------------
// Spawn type enum — mirrors include/player.h PlayerSpawnType
// ---------------------------------------------------------------------------

/** How Link spawns when entering the saved room. */
export enum SpawnType {
  Default           = 0,
  Minish            = 1,
  Drop              = 2,
  Walking           = 3,
  StepIn            = 4,
  Sleeping          = 5,
  DropMinish        = 6,
  StairsAscend      = 7,
  StairsDescend     = 8,
  Type9             = 9,
  ParachuteForward  = 10,
  ParachuteUp       = 11,
  FastTravel        = 12,
}

// ---------------------------------------------------------------------------
// Kinstone ID enum — mirrors include/kinstone.h
// ---------------------------------------------------------------------------

/** Identifies a specific kinstone fusion pair (0x00–0x64 are named pairs). */
export enum KinstoneId {
  None                            = 0x00,
  MysteriousCloudTopRight         = 0x01,
  MysteriousCloudBottomLeft       = 0x02,
  MysteriousCloudTopLeft          = 0x03,
  MysteriousCloudMiddle           = 0x04,
  MysteriousCloudBottomRight      = 0x05,
  CastorWildsStatueLeft           = 0x06,
  CastorWildsStatueMiddle         = 0x07,
  CastorWildsStatueRight          = 0x08,
  SourceFlow                      = 0x09,
  // 0x0A–0x64 are additional named pairs (A–Z, 10–64)
  NeedsReplacement                = 0xF1,
  JustFused                       = 0xF2,
  FuserDone                       = 0xF3,
  Random                          = 0xFF,
}

// ---------------------------------------------------------------------------
// Player stats — mirrors include/player.h Stats
// ---------------------------------------------------------------------------

/**
 * Runtime stats that are persisted in every save slot.
 * Health values use the GBA's quarter-heart system: 1 heart = 4 units.
 */
export interface PlayerStats {
  /**
   * Wallet upgrade level.
   * 0 = Small (max 300 rupees), 1 = Medium (max 600), 2 = Large (max 1000)
   */
  walletType: number;

  /**
   * Heart pieces collected toward the next heart container.
   * Range 0–3; when it reaches 4 the game gives a full heart and resets to 0.
   */
  heartPieces: number;

  /** Current health in quarter-hearts (e.g. 12 = 3 full hearts). */
  health: number;

  /** Maximum health in quarter-hearts. */
  maxHealth: number;

  /** Current bomb count. */
  bombCount: number;

  /** Current arrow count. */
  arrowCount: number;

  /**
   * Bomb bag upgrade level.
   * 0 = 30 max, 1 = 50 max, 2 = 99 max
   */
  bombBagType: number;

  /**
   * Quiver upgrade level.
   * 0 = 30 max, 1 = 50 max, 2 = 99 max
   */
  quiverType: number;

  /** Number of figurines collected (matches Stats.figurineCount). */
  figurineCount: number;

  /** Whether all figurines have been collected. */
  hasAllFigurines: boolean;

  /** Active goddess charm item currently in a bottle (0 = none). */
  charm: number;

  /** Active picolyte type currently in a bottle (0 = none). */
  picolyteType: number;

  /** Item equipped in button-A slot. */
  equippedA: Item;

  /** Item equipped in button-B slot. */
  equippedB: Item;

  /** Contents of bottle slot 1. Use Item.BottleEmpty etc. */
  bottle1: Item;
  /** Contents of bottle slot 2. */
  bottle2: Item;
  /** Contents of bottle slot 3. */
  bottle3: Item;
  /** Contents of bottle slot 4. */
  bottle4: Item;

  /** Active effect type (picolyte/charm). */
  effect: number;

  /** Current rupee count. */
  rupees: number;

  /** Current mysterious shell count. */
  shells: number;

  /** Frames remaining on the active goddess charm. */
  charmTimer: number;

  /** Frames remaining on the active picolyte effect. */
  picolyteTimer: number;

  /** Frames remaining on any other active effect. */
  effectTimer: number;
}

// ---------------------------------------------------------------------------
// Player position — mirrors include/room.h PlayerRoomStatus
// ---------------------------------------------------------------------------

/**
 * The player's saved room position.  Restored when loading the save file.
 */
export interface PlayerPosition {
  /** Area the player is in (see AreaId). */
  area: AreaId;

  /** Room index within the area. */
  room: number;

  /** Animation played when spawning (raw value). */
  spawnAnimation: number;

  /** How Link appears when the room loads. */
  spawnType: SpawnType;

  /** Spawn X coordinate (pixels). */
  x: number;

  /** Spawn Y coordinate (pixels). */
  y: number;

  /** Collision/rendering layer (0 = lower, 1 = upper). */
  layer: number;

  /** Dungeon area used for the dungeon map overlay. */
  dungeonArea: number;

  /** Dungeon room used for the dungeon map overlay. */
  dungeonRoom: number;

  /** Link's X position on the full dungeon map. */
  dungeonX: number;

  /** Link's Y position on the full dungeon map. */
  dungeonY: number;

  /** Link's X position on the dungeon minimap. */
  dungeonMapX: number;

  /** Link's Y position on the dungeon minimap. */
  dungeonMapY: number;

  /** Link's X position on the overworld map. */
  overworldMapX: number;

  /** Link's Y position on the overworld map. */
  overworldMapY: number;
}

// ---------------------------------------------------------------------------
// Kinstone save data — mirrors include/save.h KinstoneSave
// ---------------------------------------------------------------------------

/** A single type of kinstone held in the bag. */
export interface KinstoneBagEntry {
  /**
   * The kinstone item ID (typically Item.KinstoneRed / Blue / Green,
   * but can be any value from the KinstoneId range in the raw bag).
   */
  type: number;
  /** How many of this type the player holds. */
  amount: number;
}

/**
 * All kinstone-related save data.
 * The bag holds up to 19 distinct kinstone types.
 * Fuser arrays are indexed by the NPC fuser's internal ID (0–127).
 */
export interface KinstoneData {
  /** Whether all 100 kinstone fusions have been completed. */
  didAllFusions: boolean;

  /** Total number of kinstones fused so far. */
  fusedCount: number;

  /**
   * Contents of the kinstone bag.
   * Each entry combines one `types[i]` with `amounts[i]` from the raw struct.
   * Entries with amount 0 are omitted.
   */
  bag: KinstoneBagEntry[];

  /**
   * How many times each fuser NPC (index 0–127) has been fused with.
   * Incremented to 1 after a successful fusion with that character.
   */
  fuserProgress: number[];

  /**
   * The kinstone ID each fuser NPC (index 0–127) is currently offering.
   * 0xFF (KinstoneId.Random) means the offer is not yet determined.
   */
  fuserOffers: number[];

  /**
   * Whether each of the 100 kinstone fusions (indexed by fusion pair ID)
   * has been completed.  Derived from the 13-byte fusedKinstones bitfield.
   */
  fusedKinstones: boolean[];

  /**
   * Whether the map marker for each fusion has been hidden/dismissed.
   * Derived from the 13-byte fusionUnmarked bitfield.
   */
  fusionUnmarked: boolean[];
}

// ---------------------------------------------------------------------------
// Dungeon data
// ---------------------------------------------------------------------------

/**
 * Per-dungeon item and key state.  Indexed 0–15 matching the game's dungeon
 * IDs (0 = Deepwood Shrine, 1 = Cave of Flames, etc.).
 */
export interface DungeonData {
  /** Small keys currently held for this dungeon. */
  keys: number;

  /**
   * Dungeon items obtained (from the dungeonItems bitmask).
   * Bit layout from save.h: bit 0 = 0x01 (map), bit 1 = 0x02 (big key),
   * bit 2 = 0x04 (compass).
   */
  hasMap: boolean;
  hasBigKey: boolean;
  hasCompass: boolean;

  /** Raw warp flag byte for this dungeon. */
  warp: number;
}

// ---------------------------------------------------------------------------
// Windcrest flags
// ---------------------------------------------------------------------------

/**
 * The windcrests u32 field (offset 0x040 in SaveFile).
 * The upper 8 bits (bits 24–31) are individual windcrest unlock flags.
 * The lower 24 bits are used for miscellaneous in-game tracking.
 */
export interface WindcrestData {
  /**
   * Individual windcrest unlock flags (8 entries, indexed 0–7).
   * Index 0 corresponds to bit 24 of the raw u32.
   */
  unlocked: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];

  /** The lower 24 bits of the raw windcrests field (miscellaneous flags). */
  lowerBits: number;

  /** The full raw u32 value as stored on disk. */
  raw: number;
}

// ---------------------------------------------------------------------------
// Game flags — high-level view of SaveFile.flags[0x200]
// ---------------------------------------------------------------------------

/**
 * Named global flags extracted from the 512-byte flags array.
 * Flag bit positions come from the Flag enum in include/flags.h (bank G, offset 0).
 *
 * Also provides raw bit-level access for advanced / modding use cases.
 */
export interface GameFlags {
  // ── Story progress ──────────────────────────────────────────────────────

  /** Met Zelda at the start of the game (Flag.START). */
  start: boolean;

  /** Met Ezlo (Flag.EZERO_1ST). */
  metEzlo: boolean;

  /** Talked to King Daltus and Smith; adventure begins (Flag.TABIDACHI). */
  departed: boolean;

  /** Vaati's Wrath has been defeated — credits watched (Flag.ENDING). */
  ending: boolean;

  /** End cutscene complete; game is truly "cleared" (Flag.GAMECLEAR). */
  gameClear: boolean;

  /** Wind ocarina / Warp song learned (Flag.WARP_1ST). */
  warpUnlocked: boolean;

  /** First windcrest found on the overworld map (Flag.WARP_MONUMENT). */
  firstWindcrestFound: boolean;

  // ── Dungeon clear ────────────────────────────────────────────────────────

  /** LV0 cleared (Flag.LV0_CLEAR). */
  lv0Clear: boolean;
  /** Deepwood Shrine cleared (Flag.LV1_CLEAR). */
  lv1Clear: boolean;
  /** Cave of Flames cleared (Flag.LV2_CLEAR). */
  lv2Clear: boolean;
  /** Fortress of Winds cleared (Flag.LV3_CLEAR). */
  lv3Clear: boolean;
  /** Temple of Droplets cleared (Flag.LV4_CLEAR). */
  lv4Clear: boolean;
  /** Palace of Winds cleared (Flag.LV5_CLEAR). */
  lv5Clear: boolean;
  /** LV6 cleared (Flag.LV6_CLEAR). */
  lv6Clear: boolean;
  /** LV7 cleared (Flag.LV7_CLEAR). */
  lv7Clear: boolean;
  /** Dark Hyrule Castle cleared (Flag.LV8_CLEAR). */
  lv8Clear: boolean;

  // ── Mini-boss defeats ────────────────────────────────────────────────────

  /** Defeated Big Green Chuchu — Deepwood Shrine (Flag.MACHI_SET_1). */
  defeatedBigChuchu: boolean;
  /** Defeated Gleerok — Cave of Flames (Flag.MACHI_SET_2). */
  defeatedGleerok: boolean;
  /** Defeated Big Octorok (Flag.MACHI_SET_4). */
  defeatedBigOctorok: boolean;
  /** Defeated Gyorg Pair — Temple of Droplets (Flag.MACHI_SET_5). */
  defeatedGyorgPair: boolean;

  // ── Kinstone & figurine ──────────────────────────────────────────────────

  /** All 100 kinstone fusions completed (Flag.KAKERA_COMPLETE). */
  allFusionsComplete: boolean;

  /** Carlov Medal obtained — all figurines collected (Flag.FIGURE_ALLCOMP). */
  allFigurinesObtained: boolean;

  // ── Quests ───────────────────────────────────────────────────────────────

  /** Graveyard key was stolen (Flag.HAKA_KEY_LOST). */
  graveyardKeyLost: boolean;

  /** Graveyard key recovered (Flag.HAKA_KEY_FOUND). */
  graveyardKeyFound: boolean;

  /** Biggoron accepted the first shield (Flag.DAIGORON_SHIELD). */
  biggoronAcceptedShield: boolean;

  /** Biggoron has started tasting the shield (Flag.DAIGORON_EXCHG). */
  biggoronTasting: boolean;

  /** Bottle bought from Deku Scrub (Flag.AKINDO_BOTTLE_SELL). */
  bottleBoughtFromScrub: boolean;

  // ── Golden enemies ───────────────────────────────────────────────────────

  defeatedGoldenOctorok1: boolean;   // OUGONTEKI_A
  defeatedGoldenTektite1: boolean;   // OUGONTEKI_B
  defeatedGoldenRope1: boolean;      // OUGONTEKI_C
  defeatedGoldenRope2: boolean;      // OUGONTEKI_D
  defeatedGoldenRope3: boolean;      // OUGONTEKI_E
  defeatedGoldenTektite2: boolean;   // OUGONTEKI_F
  defeatedGoldenTektite3: boolean;   // OUGONTEKI_G
  defeatedGoldenOctorok2: boolean;   // OUGONTEKI_H
  defeatedGoldenOctorok3: boolean;   // OUGONTEKI_I

  // ── Goddesses ────────────────────────────────────────────────────────────

  /** Din moved to the blue oracle house (Flag.RENTED_HOUSE_DIN). */
  dinMovedToBlueHouse: boolean;
  /** Nayru moved to the blue oracle house (Flag.RENTED_HOUSE_NAYRU). */
  nayruMovedToBlueHouse: boolean;
  /** Farore moved to the blue oracle house (Flag.RENTED_HOUSE_FARORE). */
  faroreMovedToBlueHouse: boolean;
  /** Din moved to the red oracle house (Flag.NEW_HOUSE_DIN). */
  dinMovedToRedHouse: boolean;
  /** Nayru moved to the red oracle house (Flag.NEW_HOUSE_NAYRU). */
  nayruMovedToRedHouse: boolean;
  /** Farore moved to the red oracle house (Flag.NEW_HOUSE_FARORE). */
  faroreMovedToRedHouse: boolean;

  // ── Misc ─────────────────────────────────────────────────────────────────

  /** Vaati has taken over King Daltus (Flag.SOUGEN_08_TORITSUKI). */
  vaatiPossessedDaltus: boolean;

  /** Exited Link's house for the first time (Flag.OUTDOOR). */
  leftLinksHouse: boolean;

  /** Castle basement shutter opened (Flag.CHIKATSURO_SHUTTER). */
  castleBasementOpen: boolean;

  /**
   * Raw 512-byte flags array.  Each bit is a persistent game flag.
   * Use `readFlag()` / `writeFlag()` for safe bit-level access.
   */
  raw: Uint8Array;
}

// ---------------------------------------------------------------------------
// Main SaveSlot — the parsed form of SaveFile from include/save.h
// ---------------------------------------------------------------------------

/**
 * A fully decoded save slot.  Returned by `decodeSave()` and accepted by
 * `encodeSave()`.  Null slots represent empty or corrupted EEPROM entries.
 */
export interface SaveSlot {
  /** Player name, up to 6 characters. */
  name: string;

  /**
   * Message scroll speed.
   * 0 = fast, 1 = medium, 2 = slow, 3 = very slow (max)
   */
  msgSpeed: number;

  /**
   * Screen brightness setting.
   * 0 = darkest, 3 = brightest (max)
   */
  brightness: number;

  /** True when the player has watched the end-game staff roll. */
  sawStaffroll: boolean;

  /**
   * State of the big barrel in Deepwood Shrine.
   * 0 = initial, 2 = cleared (web removed).
   */
  dwsBarrelState: number;

  /**
   * Overall game completion indicator.
   * 0 = new game; 10 = fully complete (mirrors UpdateGlobalProgress() in save.h).
   * Thresholds:
   *   1 = default start
   *   2 = LV1_CLEAR
   *   4 = SOUGEN_08_TORITSUKI
   *   5 = LV3_CLEAR
   *   6 = LV4_CLEAR
   *   7 = OUBO_KAKERA (all fusions)
   *   8 = LV5_CLEAR
   *   9 = SEIIKI_STAINED_GLASS
   */
  globalProgress: number;

  /** Number of figurines available to collect from Carlov's shop. */
  availableFigurines: number;

  /** All player stats: health, rupees, equipped items, bottle contents, etc. */
  stats: PlayerStats;

  /** Last saved world position, restored on game load. */
  position: PlayerPosition;

  /**
   * Item inventory.
   *
   * A 136-element array (indices 0–135, matching Item enum values) where each
   * element is a 2-bit value (0–3) read from the `inventory[34]` byte array:
   *   0 = not owned
   *   1 = owned / basic version
   *   2 = upgraded (e.g. sword upgrades, remote bombs unlocked)
   *   3 = fully upgraded
   *
   * Use the `getInventory()` / `setInventory()` helpers for type-safe access.
   */
  inventory: number[];

  /**
   * Figurine collection status.  288 entries (one per bit of the 36-byte
   * figurines array).  Index matches the internal figurine ID.
   */
  figurines: boolean[];

  /** Kinstone bag, fuser state, and fusion completion data. */
  kinstones: KinstoneData;

  /**
   * Per-dungeon data for all 16 dungeon slots (indexed by dungeon ID).
   * Dungeon IDs: 0=Deepwood Shrine, 1=Cave of Flames, 2=Fortress of Winds,
   *              3=Temple of Droplets, 4=Palace of Winds, 8=Dark Hyrule Castle.
   */
  dungeons: DungeonData[];

  /**
   * Windcrest (warp point) unlock state and related flags.
   * Derived from the `windcrests` u32 at offset 0x040.
   */
  windcrests: WindcrestData;

  /**
   * Map hint bitmask used by the subtask MapHint.
   * Controls which map hints the player has seen.
   */
  mapHints: number;

  /**
   * Area visit flags: 256 entries (8 × u32 = 256 bits).
   * Index i is true when the area/room with that ID has been visited.
   */
  areaVisited: boolean[];

  /** Cumulative enemy kill count. */
  enemiesKilled: number;

  /** Cumulative items bought from Stockwell's shop. */
  itemsBought: number;

  /** Named and raw global game flags. */
  flags: GameFlags;

  // ── Quest timers ──────────────────────────────────────────────────────────

  /**
   * Darknut fight timer — elapsed frames before the Vaati finale.
   * Used by the game to award a heart piece if completed quickly.
   */
  darknutTimer: number;

  /**
   * Kill count during the Minish Medicine (drug) side quest.
   * Tracks how many enemies were killed while the quest item was held.
   */
  drugKillCount: number;

  /**
   * Biggoron mirror shield quest timer (elapsed frames since giving first shield).
   */
  biggoronTimer: number;

  /**
   * Vaati's Wrath fight timer.
   * Used internally to scale the difficulty of the final battle.
   */
  vaatiTimer: number;

  /** US demo version playtime limit (frames remaining). */
  demoTimer: number;
}

// ---------------------------------------------------------------------------
// Save header — mirrors include/save.h SaveHeader
// ---------------------------------------------------------------------------

/**
 * The save header stored at a dedicated EEPROM region (slot index 3).
 * Tracks the last-active save slot and shared settings.
 */
export interface SaveHeader {
  /** Build/version signature integer (game-internal, preserved on round-trip). */
  signature: number;

  /** Index (0–2) of the last-active save slot. */
  saveFileId: number;

  /** Message speed (shared setting, also per-slot in SaveSlot.msgSpeed). */
  msgSpeed: number;

  /** Screen brightness (shared setting). */
  brightness: number;

  /** Language selection (0=Japanese, 1=English, 2=German, 3=French, etc.). */
  language: number;

  /** Player name from the last-active slot. */
  name: string;

  /**
   * Whether the header's `initialized` byte is non-zero.
   *
   * Note: the game writes a valid checksum for the header region but does not
   * reliably set this byte to 1, so it is often `false` even on a live save.
   * `decodeSave()` parses the header regardless of this value.
   */
  initialized: boolean;
}

// ---------------------------------------------------------------------------
// Top-level decoded save structure
// ---------------------------------------------------------------------------

/**
 * The full decoded content of an 8 KB Minish Cap EEPROM file.
 * Returned by `decodeSave()` and accepted by `encodeSave()`.
 */
export interface DecodedSave {
  /**
   * The three save slots.  A null entry means the slot is empty, deleted,
   * or corrupt.
   */
  slots: [SaveSlot | null, SaveSlot | null, SaveSlot | null];

  /**
   * The save header (slot index 3 in the EEPROM layout).
   * Null when the header region is missing or corrupt.
   */
  header: SaveHeader | null;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * Options accepted by `decodeSave()` and `encodeSave()`.
 */
export interface SaveOptions {
  /**
   * Set to `true` when the EEPROM data uses the byte-swapped format produced
   * by some GBA emulators (e.g. older VisualBoyAdvance builds).
   *
   * In the swapped format each 8-byte EEPROM block has its bytes stored in
   * reverse order: physical bytes [B7,B6,B5,B4,B3,B2,B1,B0] map to logical
   * bytes [B0,B1,B2,B3,B4,B5,B6,B7].
   *
   * `decodeSave()` will un-swap before parsing.
   * `encodeSave()` will re-swap before returning so the output can be loaded
   * directly by the same emulator.
   *
   * Most modern emulators (mGBA, RetroArch, etc.) do NOT require this.
   */
  byteSwapped?: boolean;
}
