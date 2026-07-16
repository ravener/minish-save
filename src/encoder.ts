/**
 * encoder.ts — Serialise typed TypeScript objects back into EEPROM bytes.
 *
 * Entry point: encodeSave(save, options?) → Uint8Array (8 KB)
 *
 * Writing strategy mirrors DataDoubleWriteWithStatus() in src/save.c:
 *   1. Write the payload to both the primary (address1) and backup (address2).
 *   2. Compute the checksum over the primary copy.
 *   3. Write a SaveFileStatus block (checksum1, checksum2, 'MCZ3') at both the
 *      primary checksum address and the backup checksum address, each with its
 *      own 8-byte in-place backup (WriteSaveFileStatus does this internally).
 *
 * Unoccupied / null slots are initialised with a TINI status block so that
 * the game recognises them as factory-fresh rather than corrupt.
 */

import {
  EEPROM_REGIONS,
  REGION_SAVE_0,
  REGION_SAVE_1,
  REGION_SAVE_2,
  REGION_HEADER,
  REGION_SIG,
  EEPROM_SIZE,
  SAVE_FILE_PAYLOAD_SIZE,
  SAVE_HEADER_SIZE,
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
   SIGNATURE_USA,
   HEADER_SIGNATURE,
} from "./constants.js";

import {
  byteSwapEEPROM,
  dataDoubleWriteWithStatus,
  writeInitStatus,
} from "./checksum.js";

import {
   type SaveSlot,
  type SaveHeader,
  type DecodedSave,
  type SaveInput,
  type SaveOptions,
  type PlayerStats,
  type PlayerPosition,
  type KinstoneData,
  type DungeonData,
  type GameFlags,
  type WindcrestData,
  Item,
} from "./types.js";

// ---------------------------------------------------------------------------
// Bit helpers
// ---------------------------------------------------------------------------

/** Set or clear a single bit in a mutable Uint8Array. */
function writeBit(buf: Uint8Array, bitIndex: number, value: boolean): void {
  const byteIdx = bitIndex >>> 3;
  const bitOff  = bitIndex & 7;
  if (value) {
    buf[byteIdx] |= (1 << bitOff);
  } else {
    buf[byteIdx] &= ~(1 << bitOff);
  }
}

/** Pack a boolean array into bytes (bit 0 of each element → bit 0 of each byte group). */
function packBits(values: boolean[], buf: Uint8Array, offset: number, count: number): void {
  for (let i = 0; i < count; i++) {
    writeBit(buf, offset * 8 + i, values[i] ?? false);
  }
}

// ---------------------------------------------------------------------------
// Name encoder
// ---------------------------------------------------------------------------

function encodeName(name: string, buf: Uint8Array, offset: number, maxLen: number): void {
  const truncated = name.slice(0, maxLen);
  for (let i = 0; i < maxLen; i++) {
    buf[offset + i] = i < truncated.length ? (truncated.charCodeAt(i) & 0xFF) : 0;
  }
}

// ---------------------------------------------------------------------------
// Flags encoder
// ---------------------------------------------------------------------------

function encodeFlags(flags: GameFlags, buf: Uint8Array, baseOffset: number): void {
  // Write raw array first — the caller's raw may have been modified
  buf.set(flags.raw.subarray(0, 0x200), baseOffset);

  // Then stamp all named flags on top so the raw and the struct stay in sync
  const bit = (pos: number, val: boolean) => writeBit(buf, baseOffset * 8 + pos, val);

  bit(FLAG.START,               flags.start);
  bit(FLAG.EZERO_1ST,           flags.metEzlo);
  bit(FLAG.TABIDACHI,           flags.departed);
  bit(FLAG.ENDING,              flags.ending);
  bit(FLAG.GAMECLEAR,           flags.gameClear);
  bit(FLAG.WARP_1ST,            flags.warpUnlocked);
  bit(FLAG.WARP_MONUMENT,       flags.firstWindcrestFound);
  bit(FLAG.LV0_CLEAR,           flags.lv0Clear);
  bit(FLAG.LV1_CLEAR,           flags.lv1Clear);
  bit(FLAG.LV2_CLEAR,           flags.lv2Clear);
  bit(FLAG.LV3_CLEAR,           flags.lv3Clear);
  bit(FLAG.LV4_CLEAR,           flags.lv4Clear);
  bit(FLAG.LV5_CLEAR,           flags.lv5Clear);
  bit(FLAG.LV6_CLEAR,           flags.lv6Clear);
  bit(FLAG.LV7_CLEAR,           flags.lv7Clear);
  bit(FLAG.LV8_CLEAR,           flags.lv8Clear);
  bit(FLAG.MACHI_SET_1,         flags.defeatedBigChuchu);
  bit(FLAG.MACHI_SET_2,         flags.defeatedGleerok);
  bit(FLAG.MACHI_SET_4,         flags.defeatedBigOctorok);
  bit(FLAG.MACHI_SET_5,         flags.defeatedGyorgPair);
  bit(FLAG.KAKERA_COMPLETE,     flags.allFusionsComplete);
  bit(FLAG.FIGURE_ALLCOMP,      flags.allFigurinesObtained);
  bit(FLAG.HAKA_KEY_LOST,       flags.graveyardKeyLost);
  bit(FLAG.HAKA_KEY_FOUND,      flags.graveyardKeyFound);
  bit(FLAG_BIGGORON_SHIELD,     flags.biggoronAcceptedShield);
  bit(FLAG_BIGGORON_EXCHG,      flags.biggoronTasting);
  bit(FLAG.AKINDO_BOTTLE_SELL,  flags.bottleBoughtFromScrub);
  bit(FLAG.OUGONTEKI_A,         flags.defeatedGoldenOctorok1);
  bit(FLAG.OUGONTEKI_B,         flags.defeatedGoldenTektite1);
  bit(FLAG.OUGONTEKI_C,         flags.defeatedGoldenRope1);
  bit(FLAG.OUGONTEKI_D,         flags.defeatedGoldenRope2);
  bit(FLAG.OUGONTEKI_E,         flags.defeatedGoldenRope3);
  bit(FLAG.OUGONTEKI_F,         flags.defeatedGoldenTektite2);
  bit(FLAG.OUGONTEKI_G,         flags.defeatedGoldenTektite3);
  bit(FLAG.OUGONTEKI_H,         flags.defeatedGoldenOctorok2);
  bit(FLAG.OUGONTEKI_I,         flags.defeatedGoldenOctorok3);
  bit(FLAG.RENTED_HOUSE_DIN,    flags.dinMovedToBlueHouse);
  bit(FLAG.RENTED_HOUSE_NAYRU,  flags.nayruMovedToBlueHouse);
  bit(FLAG.RENTED_HOUSE_FARORE, flags.faroreMovedToBlueHouse);
  bit(FLAG.NEW_HOUSE_DIN,       flags.dinMovedToRedHouse);
  bit(FLAG.NEW_HOUSE_NAYRU,     flags.nayruMovedToRedHouse);
  bit(FLAG.NEW_HOUSE_FARORE,    flags.faroreMovedToRedHouse);
  bit(FLAG_VAATI_POSSESSED_DALTUS, flags.vaatiPossessedDaltus);
  bit(FLAG.OUTDOOR,             flags.leftLinksHouse);
  bit(FLAG.CHIKATSURO_SHUTTER,  flags.castleBasementOpen);
}

// ---------------------------------------------------------------------------
// Sub-struct encoders
// ---------------------------------------------------------------------------

function encodeStats(stats: PlayerStats, buf: Uint8Array, base: number): void {
  const view = new DataView(buf.buffer);
  const o = base + SF.stats;

  buf[o + STATS.walletType]       = stats.walletType;
  buf[o + STATS.heartPieces]      = stats.heartPieces;
  buf[o + STATS.health]           = stats.health;
  buf[o + STATS.maxHealth]        = stats.maxHealth;
  buf[o + STATS.bombCount]        = stats.bombCount;
  buf[o + STATS.arrowCount]       = stats.arrowCount;
  buf[o + STATS.bombBagType]      = stats.bombBagType;
  buf[o + STATS.quiverType]       = stats.quiverType;
  buf[o + STATS.figurineCount]    = stats.figurineCount;
  buf[o + STATS._hasAllFigurines] = stats.hasAllFigurines ? 1 : 0;
  buf[o + STATS.charm]            = stats.charm;
  buf[o + STATS.picolyteType]     = stats.picolyteType;
  buf[o + STATS.equippedA]        = stats.equippedA as number;
  buf[o + STATS.equippedB]        = stats.equippedB as number;
  buf[o + STATS.bottle1]          = stats.bottle1 as number;
  buf[o + STATS.bottle2]          = stats.bottle2 as number;
  buf[o + STATS.bottle3]          = stats.bottle3 as number;
  buf[o + STATS.bottle4]          = stats.bottle4 as number;
  buf[o + STATS.effect]           = stats.effect;
  buf[o + STATS.hasAllFigurines]  = stats.hasAllFigurines ? 1 : 0;
  view.setUint16(o + STATS.rupees,        stats.rupees,        true);
  view.setUint16(o + STATS.shells,        stats.shells,        true);
  view.setUint16(o + STATS.charmTimer,    stats.charmTimer,    true);
  view.setUint16(o + STATS.picolyteTimer, stats.picolyteTimer, true);
  view.setUint16(o + STATS.effectTimer,   stats.effectTimer,   true);
}

function encodePosition(pos: PlayerPosition, buf: Uint8Array, base: number): void {
  const view = new DataView(buf.buffer);
  const o = base + SF.saved_status;

  buf[o + PRS.area_next]    = pos.area as number;
  buf[o + PRS.room_next]    = pos.room;
  buf[o + PRS.start_anim]   = pos.spawnAnimation;
  buf[o + PRS.spawn_type]   = pos.spawnType as number;
  view.setInt16(o + PRS.start_pos_x,      pos.x,              true);
  view.setInt16(o + PRS.start_pos_y,      pos.y,              true);
  buf[o + PRS.layer]        = pos.layer;
  buf[o + PRS.dungeon_area] = pos.dungeonArea;
  buf[o + PRS.dungeon_room] = pos.dungeonRoom;
  view.setInt16(o + PRS.dungeon_x,        pos.dungeonX,       true);
  view.setInt16(o + PRS.dungeon_y,        pos.dungeonY,       true);
  view.setUint16(o + PRS.dungeon_map_x,   pos.dungeonMapX,    true);
  view.setUint16(o + PRS.dungeon_map_y,   pos.dungeonMapY,    true);
  view.setUint16(o + PRS.overworld_map_x, pos.overworldMapX,  true);
  view.setUint16(o + PRS.overworld_map_y, pos.overworldMapY,  true);
}

function encodeInventory(inventory: number[], buf: Uint8Array, baseOffset: number): void {
  // Zero the inventory bytes first
  buf.fill(0, baseOffset, baseOffset + 34);
  for (let itemId = 0; itemId < Math.min(INVENTORY_SLOTS, inventory.length); itemId++) {
    const val = (inventory[itemId] ?? 0) & 0x3;
    if (val === 0) continue;
    const byteIdx  = itemId >>> 2;
    const bitShift = (itemId & 3) << 1;
    buf[baseOffset + byteIdx] |= val << bitShift;
  }
}

function encodeKinstones(ks: KinstoneData, buf: Uint8Array, base: number): void {
  const o = base + SF.kinstones;

  buf[o + KS.didAllFusions] = ks.didAllFusions ? 1 : 0;
  buf[o + KS.fusedCount]    = ks.fusedCount;

  // Clear the bag arrays first
  buf.fill(0, o + KS.types,   o + KS.types   + 19);
  buf.fill(0, o + KS.amounts, o + KS.amounts + 19);

  // Write up to 19 bag entries
  const bagEntries = ks.bag.slice(0, 19);
  for (let i = 0; i < bagEntries.length; i++) {
    buf[o + KS.types   + i] = bagEntries[i].type   & 0xFF;
    buf[o + KS.amounts + i] = bagEntries[i].amount & 0xFF;
  }

  // fuserProgress[128]
  const progress = ks.fuserProgress.slice(0, 128);
  for (let i = 0; i < 128; i++) {
    buf[o + KS.fuserProgress + i] = progress[i] ?? 0;
  }

  // fuserOffers[128]
  const offers = ks.fuserOffers.slice(0, 128);
  for (let i = 0; i < 128; i++) {
    buf[o + KS.fuserOffers + i] = offers[i] ?? 0;
  }

  // fusedKinstones[13] — pack boolean array back into bits
  buf.fill(0, o + KS.fusedKinstones, o + KS.fusedKinstones + 13);
  for (let i = 0; i < Math.min(104, ks.fusedKinstones.length); i++) {
    writeBit(buf, (o + KS.fusedKinstones) * 8 + i, ks.fusedKinstones[i] ?? false);
  }

  // fusionUnmarked[13]
  buf.fill(0, o + KS.fusionUnmarked, o + KS.fusionUnmarked + 13);
  for (let i = 0; i < Math.min(104, ks.fusionUnmarked.length); i++) {
    writeBit(buf, (o + KS.fusionUnmarked) * 8 + i, ks.fusionUnmarked[i] ?? false);
  }
}

function encodeDungeons(dungeons: DungeonData[], buf: Uint8Array, base: number): void {
  for (let i = 0; i < 16; i++) {
    const d = dungeons[i];
    if (!d) {
      buf[base + SF.dungeonKeys  + i] = 0;
      buf[base + SF.dungeonItems + i] = 0;
      buf[base + SF.dungeonWarps + i] = 0;
      continue;
    }
    buf[base + SF.dungeonKeys  + i] = d.keys & 0xFF;
    let itemByte = 0;
    if (d.hasMap)     itemByte |= DUNGEON_ITEM_MAP;
    if (d.hasBigKey)  itemByte |= DUNGEON_ITEM_BIG_KEY;
    if (d.hasCompass) itemByte |= DUNGEON_ITEM_COMPASS;
    buf[base + SF.dungeonItems + i] = itemByte;
    buf[base + SF.dungeonWarps + i] = d.warp & 0xFF;
  }
}

function encodeWindcrests(wc: WindcrestData, buf: Uint8Array, base: number): void {
  const view = new DataView(buf.buffer);
  // Re-assemble: upper byte from unlocked booleans, lower 24 bits from lowerBits
  let raw = wc.lowerBits & 0x00FFFFFF;
  for (let i = 0; i < 8; i++) {
    if (wc.unlocked[i]) raw |= (1 << (24 + i));
  }
  view.setUint32(base + SF.windcrests, raw >>> 0, true);
}

function encodeAreaVisited(areaVisited: boolean[], buf: Uint8Array, base: number): void {
  const view = new DataView(buf.buffer);
  for (let dword = 0; dword < 8; dword++) {
    let val = 0;
    for (let bit = 0; bit < 32; bit++) {
      if (areaVisited[dword * 32 + bit]) val |= (1 << bit);
    }
    view.setUint32(base + SF.areaVisitFlags + dword * 4, val >>> 0, true);
  }
}

// ---------------------------------------------------------------------------
// Full SaveFile payload encoder (0x500 bytes)
// ---------------------------------------------------------------------------

function encodeSaveFile(slot: SaveSlot): Uint8Array {
  const buf  = new Uint8Array(SAVE_FILE_PAYLOAD_SIZE); // zeroed
  const view = new DataView(buf.buffer);

  buf[SF.invalid]             = 0; // valid
  buf[SF.initialized]         = slot.initialized ? 1 : 0;
  buf[SF.msg_speed]           = slot.msgSpeed;
  buf[SF.brightness]          = slot.brightness;
  buf[SF.saw_staffroll]       = slot.sawStaffroll ? 1 : 0;
  buf[SF.dws_barrel_state]    = slot.dwsBarrelState;
  buf[SF.global_progress]     = slot.globalProgress;
  buf[SF.available_figurines] = slot.availableFigurines;

  view.setUint16(SF.map_hints, slot.mapHints, true);

  encodeWindcrests(slot.windcrests, buf, 0);

  view.setUint32(SF.enemies_killed, slot.enemiesKilled >>> 0, true);
  view.setUint32(SF.items_bought,   slot.itemsBought   >>> 0, true);

  encodeAreaVisited(slot.areaVisited, buf, 0);
  encodeName(slot.name, buf, SF.name, 6);
  encodePosition(slot.position, buf, 0);
  encodeStats(slot.stats, buf, 0);

  // Figurines — 288-bit bitset
  buf.fill(0, SF.figurines, SF.figurines + 36);
  for (let i = 0; i < Math.min(288, slot.figurines.length); i++) {
    writeBit(buf, SF.figurines * 8 + i, slot.figurines[i] ?? false);
  }

  encodeInventory(slot.inventory, buf, SF.inventory);
  encodeKinstones(slot.kinstones, buf, 0);
  encodeFlags(slot.flags, buf, SF.flags);
  encodeDungeons(slot.dungeons, buf, 0);

  view.setUint32(SF.darknut_timer,  slot.darknutTimer  >>> 0, true);
  view.setUint32(SF.drug_kill_count,slot.drugKillCount  >>> 0, true);
  view.setUint32(SF.biggoron_timer, slot.biggoronTimer  >>> 0, true);
  view.setUint32(SF.vaati_timer,    slot.vaatiTimer     >>> 0, true);
  view.setUint32(SF.demo_timer,     slot.demoTimer      >>> 0, true);

  return buf;
}

// ---------------------------------------------------------------------------
// SaveHeader payload encoder (0x10 bytes)
// ---------------------------------------------------------------------------

function encodeHeader(header: SaveHeader): Uint8Array {
  const buf  = new Uint8Array(SAVE_HEADER_SIZE);
  const view = new DataView(buf.buffer);
  view.setInt32(SH.signature,  header.signature, true);
  buf[SH.saveFileId]  = header.saveFileId;
  buf[SH.msg_speed]   = header.msgSpeed;
  buf[SH.brightness]  = header.brightness;
  buf[SH.language]    = header.language;
  encodeName(header.name, buf, SH.name, 6);
  buf[SH.invalid]     = 0;
  buf[SH.initialized] = header.initialized ? 1 : 0;
  return buf;
}

/**
 * Derive a SaveHeader from the save slots when the caller does not supply one.
 * Uses the first non-null slot as the source of the name and settings.
 */
function deriveHeader(
  slots: [SaveSlot | null, SaveSlot | null, SaveSlot | null],
  existingHeader: SaveHeader | null,
): SaveHeader {
  if (existingHeader) return existingHeader;

  // Mirror sDefaultSettings from src/main.c:
  //   .signature   = 'MCZ3'
  //   .saveFileId  = 0
  //   .msg_speed   = 1
  //   .brightness  = 1
  //   .language    = LANGUAGE_EN (1) for USA/JPN builds
  //   .name        = "LINK"  (always hardcoded — see analysis)
  //   .invalid     = 0
  //   .initialized = 0
  return {
    signature:   HEADER_SIGNATURE,
    saveFileId:  0,
    msgSpeed:    1,
    brightness:  1,
    language:    1, // LANGUAGE_EN; EU builds use 2 but we default to English
    name:        "LINK",
    initialized: false,
  };
}

// ---------------------------------------------------------------------------
// Write the ROM signature to region 4
// ---------------------------------------------------------------------------

function writeSignature(eeprom: Uint8Array, signature: string): void {
  const region = EEPROM_REGIONS[REGION_SIG];
  for (let i = 0; i < region.size; i++) {
    const code = i < signature.length ? signature.charCodeAt(i) & 0xFF : 0;
    eeprom[region.address2 + i] = code;
    eeprom[region.address1 + i] = code;
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Encode a save back into an 8 KB EEPROM file.
 *
 * Only `slots` is required.  Everything else has a safe default:
 *   - `header`    — derived automatically from the slots.
 *   - `signature` — `SIGNATURE_USA` (`"AGBZELDA:THE MINISH CAP:ZELDA 5"`).
 *
 * - Non-null slots are fully serialised and written to both the primary and
 *   backup EEPROM locations with matching checksums.
 * - Null slots are stamped with a TINI (factory-fresh) status so the game
 *   treats them as empty rather than corrupt.
 * - The ROM signature is written to region 4 verbatim from `save.signature`.
 *   This keeps JPN/EUR saves (ZELDA 3) compatible on round-trip.
 * - If `save.header` is null/omitted a header is automatically derived from the slots.
 *
 * @param save    Slots (required) plus optional header and signature.
 *                A `DecodedSave` returned by `decodeSave()` is accepted as-is.
 * @param options Optional settings (e.g. byteSwapped for VBA-M saves).
 * @returns       A new 8192-byte Uint8Array ready to write to disk.
 *
 * @example
 * ```ts
 * // Minimal — just slots:
 * const raw = encodeSave({ slots: [createBlankSlot(), null, null] });
 *
 * // Round-trip with modifications:
 * const save = decodeSave(raw);
 * save.slots[0]!.stats.rupees = 999;
 * const newRaw = encodeSave(save);
 * ```
 */
export function encodeSave(
  save: SaveInput,
  options: SaveOptions = {},
): Uint8Array {
  const eeprom = new Uint8Array(EEPROM_SIZE); // start zeroed
  const view   = new DataView(eeprom.buffer);

  // ── ROM signature ────────────────────────────────────────────────────────
  writeSignature(eeprom, save.signature ?? SIGNATURE_USA);

  // ── Save slots 0–2 ───────────────────────────────────────────────────────
  const regionIndices = [REGION_SAVE_0, REGION_SAVE_1, REGION_SAVE_2] as const;

  for (let i = 0; i < 3; i++) {
    const slot   = save.slots[i];
    const region = EEPROM_REGIONS[regionIndices[i]];

    if (slot === null) {
      // Mark both checksum locations as TINI (empty)
      writeInitStatus(view, region.checksum1);
      writeInitStatus(view, region.checksum2);
    } else {
      const payload = encodeSaveFile(slot);
      dataDoubleWriteWithStatus(view, region, payload);
    }
  }

  // ── Save header ───────────────────────────────────────────────────────────
  const headerData = deriveHeader(save.slots, save.header ?? null);
  const headerPayload = encodeHeader(headerData);
  dataDoubleWriteWithStatus(view, EEPROM_REGIONS[REGION_HEADER], headerPayload);

  // ── Byte-swap if requested ────────────────────────────────────────────────
  return options.byteSwapped ? byteSwapEEPROM(eeprom) : eeprom;
}

// ---------------------------------------------------------------------------
// Utility: inventory mutation helpers (exported for user convenience)
// ---------------------------------------------------------------------------

/**
 * Set the inventory value for a given item.
 * Mutates the array in-place; returns the same array for chaining.
 *
 * @param inventory The `inventory` array from a SaveSlot.
 * @param item      Item enum value.
 * @param value     2-bit value 0–3 (clamped automatically).
 */
export function setInventory(
  inventory: number[],
  item: Item,
  value: number,
): number[] {
  const id = item as number;
  if (id >= 0 && id < INVENTORY_SLOTS) {
    inventory[id] = value & 0x3;
  }
  return inventory;
}

/**
 * Give (set to 1) or take away (set to 0) an item.
 */
export function giveItem(inventory: number[], item: Item): number[] {
  return setInventory(inventory, item, 1);
}

export function removeItem(inventory: number[], item: Item): number[] {
  return setInventory(inventory, item, 0);
}

/**
 * Set a single flag bit in the raw flags array.
 * Mutates the array in-place.
 *
 * @param flags    The `flags.raw` Uint8Array from a SaveSlot.
 * @param bitIndex Bit position (0-indexed from LSB of byte 0).
 * @param value    true = set, false = clear.
 */
export function writeFlag(
  flags: Uint8Array,
  bitIndex: number,
  value: boolean,
): void {
  writeBit(flags, bitIndex, value);
}

/**
 * Create a blank uninitialized SaveSlot pre-filled with sensible defaults for a new game.
 * Useful when constructing a save from scratch.
 */
export function createBlankSlot(name = "LINK"): SaveSlot {
  return {
    name,
    initialized: false,
    msgSpeed:    1,
    brightness:  1,
    sawStaffroll: false,
    dwsBarrelState: 0,
    globalProgress: 0,
    availableFigurines: 0,
    stats: {
      walletType:      0,
      heartPieces:     0,
      health:          24,
      maxHealth:       24,
      bombCount:       0,
      arrowCount:      0,
      bombBagType:     0,
      quiverType:      0,
      figurineCount:   0,
      hasAllFigurines: false,
      charm:           0,
      picolyteType:    0,
      equippedA:       Item.None,
      equippedB:       Item.None,
      bottle1:         Item.None,
      bottle2:         Item.None,
      bottle3:         Item.None,
      bottle4:         Item.None,
      effect:          0,
      rupees:          0,
      shells:          0,
      charmTimer:      0,
      picolyteTimer:   0,
      effectTimer:     0,
    },
    position: {
      area:            0,
      room:            0,
      spawnAnimation:  0,
      spawnType:       0,
      x:               0,
      y:               0,
      layer:           0,
      dungeonArea:     0,
      dungeonRoom:     0,
      dungeonX:        0,
      dungeonY:        0,
      dungeonMapX:     0,
      dungeonMapY:     0,
      overworldMapX:   0,
      overworldMapY:   0,
    },
    inventory:   new Array(136).fill(0),
    figurines:   new Array(288).fill(false),
    kinstones: {
      didAllFusions: false,
      fusedCount:    0,
      bag:           [],
      fuserProgress: new Array(128).fill(0),
      fuserOffers:   new Array(128).fill(0),
      fusedKinstones: new Array(104).fill(false),
      fusionUnmarked: new Array(104).fill(false),
    },
    dungeons: Array.from({ length: 16 }, () => ({
      keys:       0,
      hasMap:     false,
      hasBigKey:  false,
      hasCompass: false,
      warp:       0,
    })),
    windcrests: {
      unlocked:  [false,false,false,false,false,false,false,false],
      lowerBits: 0,
      raw:       0,
    },
    mapHints:       0,
    areaVisited:    new Array(256).fill(false),
    enemiesKilled:  0,
    itemsBought:    0,
    flags: {
      start: false, metEzlo: false, departed: false, ending: false,
      gameClear: false, warpUnlocked: false, firstWindcrestFound: false,
      lv0Clear: false, lv1Clear: false, lv2Clear: false, lv3Clear: false,
      lv4Clear: false, lv5Clear: false, lv6Clear: false, lv7Clear: false,
      lv8Clear: false,
      defeatedBigChuchu: false, defeatedGleerok: false,
      defeatedBigOctorok: false, defeatedGyorgPair: false,
      allFusionsComplete: false, allFigurinesObtained: false,
      graveyardKeyLost: false, graveyardKeyFound: false,
      biggoronAcceptedShield: false, biggoronTasting: false,
      bottleBoughtFromScrub: false,
      defeatedGoldenOctorok1: false, defeatedGoldenTektite1: false,
      defeatedGoldenRope1: false, defeatedGoldenRope2: false,
      defeatedGoldenRope3: false, defeatedGoldenTektite2: false,
      defeatedGoldenTektite3: false, defeatedGoldenOctorok2: false,
      defeatedGoldenOctorok3: false,
      dinMovedToBlueHouse: false, nayruMovedToBlueHouse: false,
      faroreMovedToBlueHouse: false, dinMovedToRedHouse: false,
      nayruMovedToRedHouse: false, faroreMovedToRedHouse: false,
      vaatiPossessedDaltus: false, leftLinksHouse: false,
      castleBasementOpen: false,
      raw: new Uint8Array(0x200),
    },
    darknutTimer:  0,
    drugKillCount: 0,
    biggoronTimer: 0,
    vaatiTimer:    0,
    demoTimer:     0,
  };
}
