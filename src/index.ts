/**
 * index.ts — Public API for the minish-save library.
 *
 * Usage:
 * ```ts
 * import {
 *   decodeSave, encodeSave,
 *   getInventory, setInventory, hasItem, giveItem, removeItem,
 *   readFlag, writeFlag, visitedAreas,
 *   createBlankSlot, byteSwapEEPROM,
 *   Item, AreaId, SpawnType, KinstoneId,
 * } from "minish-save";
 *
 * // Decode an EEPROM dump
 * const raw  = new Uint8Array(await file.arrayBuffer());
 * const save = decodeSave(raw);           // mGBA / RetroArch format
 * // const save = decodeSave(raw, { byteSwapped: true }); // old VBA format
 *
 * const slot = save.slots[0];
 * if (slot) {
 *   console.log(`Name:    ${slot.name}`);
 *   console.log(`Rupees:  ${slot.stats.rupees}`);
 *   console.log(`Health:  ${slot.stats.health / 4} hearts`);
 *   console.log(`MaxHP:   ${slot.stats.maxHealth / 4} hearts`);
 *   console.log(`Has bow: ${hasItem(slot.inventory, Item.Bow)}`);
 *   console.log(`LV1 clear: ${slot.flags.lv1Clear}`);
 *
 *   // Modify and re-encode
 *   slot.stats.rupees = 999;
 *   giveItem(slot.inventory, Item.Bow);
 *   slot.flags.lv1Clear = true;
 *   writeFlag(slot.flags.raw, 0x02, true); // same as lv1Clear via raw
 * }
 *
 * const newRaw = encodeSave(save);
 * ```
 */

// ── Core API ────────────────────────────────────────────────────────────────

export { decodeSave } from "./decoder.js";
export { encodeSave } from "./encoder.js";

// ── Inventory helpers ────────────────────────────────────────────────────────

/**
 * Get the 2-bit inventory value (0–3) for a given item.
 * 0 = not owned, 1 = owned, 2–3 = upgraded variant.
 */
export { getInventory, hasItem, visitedAreas, readFlag } from "./decoder.js";

/**
 * Mutate the inventory array in-place.
 * `giveItem` and `removeItem` are convenience wrappers for value 1 / 0.
 */
export { setInventory, giveItem, removeItem, writeFlag, createBlankSlot } from "./encoder.js";

// ── EEPROM utilities ─────────────────────────────────────────────────────────

/**
 * Reverse the byte order within each 8-byte EEPROM block.
 * Apply before decoding (and again before writing) when dealing with
 * byte-swapped emulator saves (old VisualBoyAdvance format).
 */
export { byteSwapEEPROM } from "./checksum.js";

// ── Types & enums ────────────────────────────────────────────────────────────

export type {
  // Top-level
  DecodedSave,
  SaveSlot,
  SaveHeader,
  SaveOptions,

  // Sub-structures
  PlayerStats,
  PlayerPosition,
  KinstoneData,
  KinstoneBagEntry,
  DungeonData,
  GameFlags,
  WindcrestData,
} from "./types.js";

export {
  /** All item IDs (mirrors include/item.h). */
  Item,

  /** Area identifiers for the player's saved position (mirrors include/area.h). */
  AreaId,

  /** How Link spawns when a room loads (mirrors include/player.h PlayerSpawnType). */
  SpawnType,

  /** Kinstone fusion pair IDs (mirrors include/kinstone.h). */
  KinstoneId,
} from "./types.js";

// ── Low-level constants (for advanced / modding use) ─────────────────────────

export {
  /** Total EEPROM file size in bytes (8192). */
  EEPROM_SIZE,

  /** EEPROM region descriptors matching gSaveFileEEPROMAddresses[]. */
  EEPROM_REGIONS,

  /** Named flag bit positions within the 512-byte flags array. */
  FLAG,

  /** Bit offset to add to a LocalFlags1 value to reach its position in flags[]. */
  FLAG_BANK_1_OFFSET,

  /** SaveFile struct field byte offsets. */
  SF,

  /** Stats struct field byte offsets. */
  STATS,

  /** PlayerRoomStatus field byte offsets. */
  PRS,

  /** KinstoneSave field byte offsets. */
  KS,

  /** SaveHeader field byte offsets. */
  SH,

  /** ROM signature for USA builds ("AGBZELDA:THE MINISH CAP:ZELDA 5"). */
  SIGNATURE_USA,

  /** ROM signature for JPN builds ("AGBZELDA:THE MINISH CAP:ZELDA 3"). */
  SIGNATURE_JP,

  /** ROM signature for EUR builds — same value as SIGNATURE_JP ("AGBZELDA:THE MINISH CAP:ZELDA 3"). */
  SIGNATURE_EU,
} from "./constants.js";
