/**
 * decoder.ts — Parse raw EEPROM bytes into typed TypeScript objects.
 *
 * Entry point: decodeSave(data, options?) → DecodedSave
 *
 * Reading strategy mirrors DataDoubleReadWithStatus() in src/save.c:
 *   1. Try primary status + data; verify checksum.
 *   2. If that fails, try secondary status + data; verify checksum.
 *   3. If both fail → null (empty or corrupt slot).
 *
 * For each of the 3 save slots the result is either a fully parsed SaveSlot
 * or null.  The SaveHeader is parsed separately from region index 3.
 */

import {
  EEPROM_REGIONS,
  REGION_SAVE_0,
  REGION_SAVE_1,
  REGION_SAVE_2,
  REGION_HEADER,
  REGION_SIG,
  SF,
  PRS,
  STATS,
  KS,
  SH,
  FLAG,
  FLAG_BANK_1_OFFSET,
  FLAG_VAATI_POSSESSED_DALTUS,
  FLAG_BIGGORON_SHIELD,
  FLAG_BIGGORON_EXCHG,
  DUNGEON_ITEM_MAP,
  DUNGEON_ITEM_BIG_KEY,
  DUNGEON_ITEM_COMPASS,
  INVENTORY_SLOTS,
  EEPROM_SIZE,
} from "./constants.js";

import {
  byteSwapEEPROM,
  dataDoubleReadWithStatus,
  readSaveFileStatus,
  StatusCode,
} from "./checksum.js";

import {
  type SaveSlot,
  type SaveHeader,
  type DecodedSave,
  type SaveOptions,
  type PlayerStats,
  type PlayerPosition,
  type KinstoneData,
  type DungeonData,
  type GameFlags,
  type WindcrestData,
  Item,
  AreaId,
  SpawnType,
} from "./types.js";

// ---------------------------------------------------------------------------
// Bit helpers
// ---------------------------------------------------------------------------

/** Read a single bit from a byte array, indexed from bit 0 of byte 0. */
function readBit(buf: Uint8Array, bitIndex: number): boolean {
  const byteIdx = bitIndex >>> 3;
  const bitOff  = bitIndex & 7;
  return (buf[byteIdx] >>> bitOff & 1) === 1;
}

/** Extract all bits from a byte array as a boolean array. */
function unpackBits(buf: Uint8Array, count: number): boolean[] {
  const result: boolean[] = new Array(count);
  for (let i = 0; i < count; i++) {
    result[i] = readBit(buf, i);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Inventory decoder
// ---------------------------------------------------------------------------

/**
 * Decode the 34-byte inventory array into a 136-element number array.
 * Each element is a 2-bit value (0–3) representing the quantity/level of
 * the corresponding item (indexed by Item enum value).
 */
function decodeInventory(buf: Uint8Array, baseOffset: number): number[] {
  const inv: number[] = new Array(INVENTORY_SLOTS).fill(0);
  for (let itemId = 0; itemId < INVENTORY_SLOTS; itemId++) {
    const byteIdx  = itemId >>> 2;           // itemId / 4
    const bitShift = (itemId & 3) << 1;     // (itemId % 4) * 2
    inv[itemId] = (buf[baseOffset + byteIdx] >>> bitShift) & 0x3;
  }
  return inv;
}

// ---------------------------------------------------------------------------
// Name decoder
// ---------------------------------------------------------------------------

/**
 * Read a null-terminated ASCII name of up to `maxLen` bytes.
 * The Minish Cap stores player names as ASCII (or a superset); we just use
 * the raw char codes and stop at the first null byte.
 */
function decodeName(buf: Uint8Array, offset: number, maxLen: number): string {
  let name = "";
  for (let i = 0; i < maxLen; i++) {
    const code = buf[offset + i];
    if (code === 0) break;
    name += String.fromCharCode(code);
  }
  return name;
}

// ---------------------------------------------------------------------------
// Flag decoder
// ---------------------------------------------------------------------------

/**
 * Parse the 512-byte flags array into a GameFlags object.
 * Each named flag's bit position comes from FLAG constants in constants.ts
 * (mirroring the Flag enum in include/flags.h).
 */
function decodeFlags(buf: Uint8Array, baseOffset: number): GameFlags {
  // Clone the raw slice so callers can safely modify it
  const raw = buf.slice(baseOffset, baseOffset + 0x200);

  const bit = (pos: number): boolean => readBit(raw, pos);

  return {
    // Story
    start:                   bit(FLAG.START),
    metEzlo:                 bit(FLAG.EZERO_1ST),
    departed:                bit(FLAG.TABIDACHI),
    ending:                  bit(FLAG.ENDING),
    gameClear:               bit(FLAG.GAMECLEAR),
    warpUnlocked:            bit(FLAG.WARP_1ST),
    firstWindcrestFound:     bit(FLAG.WARP_MONUMENT),
    // Dungeons
    lv0Clear:                bit(FLAG.LV0_CLEAR),
    lv1Clear:                bit(FLAG.LV1_CLEAR),
    lv2Clear:                bit(FLAG.LV2_CLEAR),
    lv3Clear:                bit(FLAG.LV3_CLEAR),
    lv4Clear:                bit(FLAG.LV4_CLEAR),
    lv5Clear:                bit(FLAG.LV5_CLEAR),
    lv6Clear:                bit(FLAG.LV6_CLEAR),
    lv7Clear:                bit(FLAG.LV7_CLEAR),
    lv8Clear:                bit(FLAG.LV8_CLEAR),
    // Bosses
    defeatedBigChuchu:       bit(FLAG.MACHI_SET_1),
    defeatedGleerok:         bit(FLAG.MACHI_SET_2),
    defeatedBigOctorok:      bit(FLAG.MACHI_SET_4),
    defeatedGyorgPair:       bit(FLAG.MACHI_SET_5),
    // Kinstone & figurines
    allFusionsComplete:      bit(FLAG.KAKERA_COMPLETE),
    allFigurinesObtained:    bit(FLAG.FIGURE_ALLCOMP),
    // Quests
    graveyardKeyLost:        bit(FLAG.HAKA_KEY_LOST),
    graveyardKeyFound:       bit(FLAG.HAKA_KEY_FOUND),
    biggoronAcceptedShield:  bit(FLAG_BIGGORON_SHIELD),
    biggoronTasting:         bit(FLAG_BIGGORON_EXCHG),
    bottleBoughtFromScrub:   bit(FLAG.AKINDO_BOTTLE_SELL),
    // Golden enemies
    defeatedGoldenOctorok1:  bit(FLAG.OUGONTEKI_A),
    defeatedGoldenTektite1:  bit(FLAG.OUGONTEKI_B),
    defeatedGoldenRope1:     bit(FLAG.OUGONTEKI_C),
    defeatedGoldenRope2:     bit(FLAG.OUGONTEKI_D),
    defeatedGoldenRope3:     bit(FLAG.OUGONTEKI_E),
    defeatedGoldenTektite2:  bit(FLAG.OUGONTEKI_F),
    defeatedGoldenTektite3:  bit(FLAG.OUGONTEKI_G),
    defeatedGoldenOctorok2:  bit(FLAG.OUGONTEKI_H),
    defeatedGoldenOctorok3:  bit(FLAG.OUGONTEKI_I),
    // Goddesses
    dinMovedToBlueHouse:     bit(FLAG.RENTED_HOUSE_DIN),
    nayruMovedToBlueHouse:   bit(FLAG.RENTED_HOUSE_NAYRU),
    faroreMovedToBlueHouse:  bit(FLAG.RENTED_HOUSE_FARORE),
    dinMovedToRedHouse:      bit(FLAG.NEW_HOUSE_DIN),
    nayruMovedToRedHouse:    bit(FLAG.NEW_HOUSE_NAYRU),
    faroreMovedToRedHouse:   bit(FLAG.NEW_HOUSE_FARORE),
    // Misc
    vaatiPossessedDaltus:    bit(FLAG_VAATI_POSSESSED_DALTUS),
    leftLinksHouse:          bit(FLAG.OUTDOOR),
    castleBasementOpen:      bit(FLAG.CHIKATSURO_SHUTTER),
    raw,
  };
}

// ---------------------------------------------------------------------------
// Sub-struct decoders
// ---------------------------------------------------------------------------

function decodeStats(buf: Uint8Array, base: number): PlayerStats {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const o = base + SF.stats;
  return {
    walletType:        buf[o + STATS.walletType],
    heartPieces:       buf[o + STATS.heartPieces],
    health:            buf[o + STATS.health],
    maxHealth:         buf[o + STATS.maxHealth],
    bombCount:         buf[o + STATS.bombCount],
    arrowCount:        buf[o + STATS.arrowCount],
    bombBagType:       buf[o + STATS.bombBagType],
    quiverType:        buf[o + STATS.quiverType],
    figurineCount:     buf[o + STATS.figurineCount],
    hasAllFigurines:   buf[o + STATS.hasAllFigurines] !== 0,
    charm:             buf[o + STATS.charm],
    picolyteType:      buf[o + STATS.picolyteType],
    equippedA:         buf[o + STATS.equippedA] as Item,
    equippedB:         buf[o + STATS.equippedB] as Item,
    bottle1:           buf[o + STATS.bottle1]   as Item,
    bottle2:           buf[o + STATS.bottle2]   as Item,
    bottle3:           buf[o + STATS.bottle3]   as Item,
    bottle4:           buf[o + STATS.bottle4]   as Item,
    effect:            buf[o + STATS.effect],
    rupees:            view.getUint16(o + STATS.rupees,        true),
    shells:            view.getUint16(o + STATS.shells,        true),
    charmTimer:        view.getUint16(o + STATS.charmTimer,    true),
    picolyteTimer:     view.getUint16(o + STATS.picolyteTimer, true),
    effectTimer:       view.getUint16(o + STATS.effectTimer,   true),
  };
}

function decodePosition(buf: Uint8Array, base: number): PlayerPosition {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const o = base + SF.saved_status;
  return {
    area:              buf[o + PRS.area_next]   as AreaId,
    room:              buf[o + PRS.room_next],
    spawnAnimation:    buf[o + PRS.start_anim],
    spawnType:         buf[o + PRS.spawn_type]  as SpawnType,
    x:                 view.getInt16(o + PRS.start_pos_x,      true),
    y:                 view.getInt16(o + PRS.start_pos_y,      true),
    layer:             buf[o + PRS.layer],
    dungeonArea:       buf[o + PRS.dungeon_area],
    dungeonRoom:       buf[o + PRS.dungeon_room],
    dungeonX:          view.getInt16(o + PRS.dungeon_x,        true),
    dungeonY:          view.getInt16(o + PRS.dungeon_y,        true),
    dungeonMapX:       view.getUint16(o + PRS.dungeon_map_x,   true),
    dungeonMapY:       view.getUint16(o + PRS.dungeon_map_y,   true),
    overworldMapX:     view.getUint16(o + PRS.overworld_map_x, true),
    overworldMapY:     view.getUint16(o + PRS.overworld_map_y, true),
  };
}

function decodeKinstones(buf: Uint8Array, base: number): KinstoneData {
  const o = base + SF.kinstones;

  const bag = [];
  for (let i = 0; i < 19; i++) {
    const type   = buf[o + KS.types   + i];
    const amount = buf[o + KS.amounts + i];
    if (amount > 0) {
      bag.push({ type, amount });
    }
  }

  const fuserProgress = Array.from(buf.subarray(o + KS.fuserProgress, o + KS.fuserProgress + 128));
  const fuserOffers   = Array.from(buf.subarray(o + KS.fuserOffers,   o + KS.fuserOffers   + 128));

  // fusedKinstones[13] = 104 bits
  const fusedRaw = buf.subarray(o + KS.fusedKinstones, o + KS.fusedKinstones + 13);
  const fusedKinstones = unpackBits(fusedRaw, 104);

  // fusionUnmarked[13] = 104 bits
  const unmarkedRaw = buf.subarray(o + KS.fusionUnmarked, o + KS.fusionUnmarked + 13);
  const fusionUnmarked = unpackBits(unmarkedRaw, 104);

  return {
    didAllFusions: buf[o + KS.didAllFusions] !== 0,
    fusedCount:    buf[o + KS.fusedCount],
    bag,
    fuserProgress,
    fuserOffers,
    fusedKinstones,
    fusionUnmarked,
  };
}

function decodeDungeons(buf: Uint8Array, base: number): DungeonData[] {
  const dungeons: DungeonData[] = [];
  for (let i = 0; i < 16; i++) {
    const keyByte   = buf[base + SF.dungeonKeys  + i];
    const itemByte  = buf[base + SF.dungeonItems + i];
    const warpByte  = buf[base + SF.dungeonWarps + i];
    dungeons.push({
      keys:       keyByte,
      hasMap:     (itemByte & DUNGEON_ITEM_MAP)     !== 0,
      hasBigKey:  (itemByte & DUNGEON_ITEM_BIG_KEY) !== 0,
      hasCompass: (itemByte & DUNGEON_ITEM_COMPASS) !== 0,
      warp:       warpByte,
    });
  }
  return dungeons;
}

function decodeWindcrests(raw: number): WindcrestData {
  const unlocked: [boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean] = [
    (raw >>> 24 & 1) === 1,
    (raw >>> 25 & 1) === 1,
    (raw >>> 26 & 1) === 1,
    (raw >>> 27 & 1) === 1,
    (raw >>> 28 & 1) === 1,
    (raw >>> 29 & 1) === 1,
    (raw >>> 30 & 1) === 1,
    (raw >>> 31 & 1) === 1,
  ];
  return {
    unlocked,
    lowerBits: raw & 0x00FFFFFF,
    raw,
  };
}

function decodeAreaVisited(buf: Uint8Array, base: number): boolean[] {
  // 8 × u32 = 256 bits stored little-endian
  const visited: boolean[] = new Array(256).fill(false);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  for (let dword = 0; dword < 8; dword++) {
    const val = view.getUint32(base + SF.areaVisitFlags + dword * 4, true);
    for (let bit = 0; bit < 32; bit++) {
      visited[dword * 32 + bit] = (val >>> bit & 1) === 1;
    }
  }
  return visited;
}

// ---------------------------------------------------------------------------
// SaveFile slot decoder
// ---------------------------------------------------------------------------

/**
 * Decode a SaveFile payload from `buf` starting at `base`.
 * Returns null if the `initialized` byte is 0 (slot was never written).
 */
function decodeSaveFile(buf: Uint8Array, base: number): SaveSlot | null {
  // Note: we intentionally do NOT gate on SF.initialized here.
  // An uninitialized slot (initialized === 0) occurs when a new game has been
  // created but not yet played — the name and default stats are present and
  // all other fields are correctly zero-initialized by the game.  Callers can
  // inspect SaveSlot.initialized to distinguish this case.
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

  const windcrestsRaw = view.getUint32(base + SF.windcrests, true);

  const figurinesRaw  = buf.subarray(base + SF.figurines, base + SF.figurines + 36);
  const figurines     = unpackBits(figurinesRaw, 288);

  return {
    name:               decodeName(buf, base + SF.name, 6),
    initialized:        buf[base + SF.initialized] !== 0,
    msgSpeed:           buf[base + SF.msg_speed],
    brightness:         buf[base + SF.brightness],
    sawStaffroll:       buf[base + SF.saw_staffroll] !== 0,
    dwsBarrelState:     buf[base + SF.dws_barrel_state],
    globalProgress:     buf[base + SF.global_progress],
    availableFigurines: buf[base + SF.available_figurines],
    stats:              decodeStats(buf, base),
    position:           decodePosition(buf, base),
    inventory:          decodeInventory(buf, base + SF.inventory),
    figurines,
    kinstones:          decodeKinstones(buf, base),
    dungeons:           decodeDungeons(buf, base),
    windcrests:         decodeWindcrests(windcrestsRaw),
    mapHints:           view.getUint16(base + SF.map_hints, true),
    areaVisited:        decodeAreaVisited(buf, base),
    enemiesKilled:      view.getUint32(base + SF.enemies_killed, true),
    itemsBought:        view.getUint32(base + SF.items_bought,   true),
    flags:              decodeFlags(buf, base + SF.flags),
    darknutTimer:       view.getUint32(base + SF.darknut_timer,  true),
    drugKillCount:      view.getUint32(base + SF.drug_kill_count,true),
    biggoronTimer:      view.getUint32(base + SF.biggoron_timer, true),
    vaatiTimer:         view.getUint32(base + SF.vaati_timer,    true),
    demoTimer:          view.getUint32(base + SF.demo_timer,     true),
  };
}

// ---------------------------------------------------------------------------
// SaveHeader decoder
// ---------------------------------------------------------------------------

function decodeSaveHeader(buf: Uint8Array, base: number): SaveHeader | null {
  // Note: we intentionally do NOT gate on SH.initialized here.
  // The game writes a valid checksum for the header region but leaves the
  // initialized byte at 0, so checking it would always produce null.
  // Callers can inspect SaveHeader.initialized themselves if they need it.
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return {
    signature:  view.getInt32(base + SH.signature, true),
    saveFileId: buf[base + SH.saveFileId],
    msgSpeed:   buf[base + SH.msg_speed],
    brightness: buf[base + SH.brightness],
    language:   buf[base + SH.language],
    name:       decodeName(buf, base + SH.name, 6),
    initialized: buf[base + SH.initialized] !== 0,
  };
}

// ---------------------------------------------------------------------------
// Signature reader
// ---------------------------------------------------------------------------

/**
 * Read the ROM signature string from EEPROM region 4.
 * Reads from address1 (primary) first; falls back to address2 (backup) if primary is empty.
 * Returns null when both copies are blank (all zeros).
 */
function decodeSignature(buf: Uint8Array): string | null {
  const region = EEPROM_REGIONS[REGION_SIG];

  function readFrom(base: number): string {
    let s = "";
    for (let i = 0; i < region.size; i++) {
      const code = buf[base + i];
      if (code === 0) break;
      s += String.fromCharCode(code);
    }
    return s;
  }

  const primary = readFrom(region.address1);
  if (primary.length > 0) return primary;
  const backup = readFrom(region.address2);
  return backup.length > 0 ? backup : null;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Decode an 8 KB Minish Cap EEPROM file.
 *
 * @param data    Raw EEPROM bytes (must be exactly 0x2000 = 8192 bytes).
 * @param options Optional settings (e.g. byteSwapped for VBA-M saves).
 * @returns       DecodedSave with 3 nullable save slots and an optional header.
 *
 * @throws {RangeError} If `data` is not 8192 bytes.
 *
 * @example
 * ```ts
 * const raw = new Uint8Array(await file.arrayBuffer());
 * const save = decodeSave(raw);
 * console.log(save.slots[0]?.stats.rupees);
 * ```
 */
export function decodeSave(
  data: Uint8Array,
  options: SaveOptions = {},
): DecodedSave {
  if (data.byteLength !== EEPROM_SIZE) {
    throw new RangeError(
      `Expected EEPROM data to be ${EEPROM_SIZE} bytes, got ${data.byteLength}`,
    );
  }

  // Un-swap if the emulator stores blocks in reversed byte order
  const buf = options.byteSwapped ? byteSwapEEPROM(data) : new Uint8Array(data);
  const view = new DataView(buf.buffer);

  function readSlot(regionIndex: number): SaveSlot | null {
    const region = EEPROM_REGIONS[regionIndex];
    const result = dataDoubleReadWithStatus(view, region);
    if (result.status !== "valid") return null;
    return decodeSaveFile(buf, result.dataOffset);
  }

  function readHeader(): SaveHeader | null {
    const region = EEPROM_REGIONS[REGION_HEADER];
    const result = dataDoubleReadWithStatus(view, region);
    if (result.status !== "valid") return null;
    return decodeSaveHeader(buf, result.dataOffset);
  }

  return {
    slots: [
      readSlot(REGION_SAVE_0),
      readSlot(REGION_SAVE_1),
      readSlot(REGION_SAVE_2),
    ],
    header: readHeader(),
    signature: decodeSignature(buf),
  };
}

// ---------------------------------------------------------------------------
// Utility: inventory access helpers (exported for user convenience)
// ---------------------------------------------------------------------------

/**
 * Get the inventory value (0–3) for a given item.
 *
 * @param inventory The `inventory` array from a SaveSlot (136 entries).
 * @param item      Item enum value (0–135).
 * @returns         2-bit value: 0 = not owned, 1 = owned, 2–3 = upgraded.
 */
export function getInventory(inventory: number[], item: Item): number {
  const id = item as number;
  if (id < 0 || id >= INVENTORY_SLOTS) return 0;
  return inventory[id] ?? 0;
}

/**
 * Check whether the player owns a given item (inventory value > 0).
 */
export function hasItem(inventory: number[], item: Item): boolean {
  return getInventory(inventory, item) > 0;
}

/**
 * Read a single bit from the raw flags array.
 *
 * @param flags    The `flags.raw` Uint8Array from a SaveSlot (512 bytes).
 * @param bitIndex Bit position (0 = LSB of byte 0).
 */
export function readFlag(flags: Uint8Array, bitIndex: number): boolean {
  return readBit(flags, bitIndex);
}

/**
 * Expand the 256-entry areaVisited array into a Set of AreaId values
 * for convenient membership testing.
 *
 * @example
 * ```ts
 * const visited = visitedAreas(slot.areaVisited);
 * if (visited.has(AreaId.LakeHylia)) { ... }
 * ```
 */
export function visitedAreas(areaVisited: boolean[]): Set<AreaId> {
  const set = new Set<AreaId>();
  areaVisited.forEach((v, i) => { if (v) set.add(i as AreaId); });
  return set;
}
