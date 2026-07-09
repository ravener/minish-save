/**
 * constants.ts — EEPROM layout, magic status values and struct offsets.
 *
 * All byte addresses match gSaveFileEEPROMAddresses[] from src/save.c.
 * The SaveFileStatus struct (8 bytes at each checksum address) is:
 *   u16 checksum1;
 *   u16 checksum2;
 *   u32 status;   ← one of STATUS_MCZ3 / STATUS_TINI / STATUS_FLED
 */

// ---------------------------------------------------------------------------
// EEPROM geometry
// ---------------------------------------------------------------------------

/** Total EEPROM file size in bytes (64kbit = 8 KB). */
export const EEPROM_SIZE = 0x2000;

/**
 * Size of one EEPROM data chunk as seen by the hardware driver.
 * DataRead / DataWrite always work in 8-byte (64-bit) blocks.
 */
export const EEPROM_BLOCK_SIZE = 8;

// ---------------------------------------------------------------------------
// Save-file status magic constants
//
// In C these are multi-character literals, stored as u32 on the GBA's
// little-endian CPU.  When we read the 4-byte status field with
// DataView.getUint32(offset, /*littleEndian=*/true) we compare to these values.
//
//   'MCZ3' → M=0x4D C=0x43 Z=0x5A 3=0x33 → LE u32 = 0x4D435A33
//   'TINI' → T=0x54 I=0x49 N=0x4E I=0x49 → LE u32 = 0x54494E49
//   'FleD' → F=0x46 l=0x6C e=0x65 D=0x44 → LE u32 = 0x466C6544
// ---------------------------------------------------------------------------

/** Valid, populated save file. */
export const STATUS_MCZ3 = 0x4D435A33;
/** Factory-fresh / untouched slot. */
export const STATUS_TINI = 0x54494E49;
/** Explicitly deleted slot. */
export const STATUS_FLED = 0x466C6544;

// ---------------------------------------------------------------------------
// SaveFileStatus struct field offsets (relative to the status block start)
// ---------------------------------------------------------------------------

export const STATUS_OFFSET_CHECKSUM1 = 0; // u16
export const STATUS_OFFSET_CHECKSUM2 = 2; // u16
export const STATUS_OFFSET_TAG       = 4; // u32 (one of STATUS_* above)
export const STATUS_STRUCT_SIZE      = 8; // total bytes

/**
 * The game writes each SaveFileStatus twice: once at the primary checksum
 * address and an identical backup 8 bytes later.  ReadSaveFileStatus() tries
 * the primary first, then the backup.
 */
export const STATUS_BACKUP_OFFSET = 8;

// ---------------------------------------------------------------------------
// EEPROM address table — mirrors gSaveFileEEPROMAddresses[] in src/save.c
//
// struct SaveFileEEPROMAddresses {
//   u16 size;        ← payload size in bytes
//   u16 checksum1;   ← byte address of the primary SaveFileStatus block
//   u16 checksum2;   ← byte address of the secondary SaveFileStatus block
//   u16 address1;    ← byte address of the primary payload
//   u16 address2;    ← byte address of the secondary (backup) payload
// };
// ---------------------------------------------------------------------------

export interface EEPROMRegion {
  /** Payload size in bytes. */
  size: number;
  /** Byte offset of the primary SaveFileStatus block. */
  checksum1: number;
  /** Byte offset of the secondary SaveFileStatus block. */
  checksum2: number;
  /** Byte offset of the primary payload. */
  address1: number;
  /** Byte offset of the secondary (backup) payload. */
  address2: number;
}

/**
 * All 7 EEPROM regions used by The Minish Cap.
 *
 * Indices:
 *   0–2  Save slots 0–2  (each 0x500 bytes / 1280 bytes of player data)
 *   3    Save header      (0x10 bytes)
 *   4    ROM signature    (0x20 bytes — "AGBZELDA:THE MINISH CAP:ZELDA 5")
 *   5    Extra region     (0x20 bytes — sub_0807CF3C)
 *   6    Extra region 2   (0x08 bytes — possibly unused)
 */
export const EEPROM_REGIONS: readonly EEPROMRegion[] = [
  // 0: Save slot 0
  { size: 0x0500, checksum1: 0x0030, checksum2: 0x1030, address1: 0x0080, address2: 0x1080 },
  // 1: Save slot 1
  { size: 0x0500, checksum1: 0x0040, checksum2: 0x1040, address1: 0x0580, address2: 0x1580 },
  // 2: Save slot 2
  { size: 0x0500, checksum1: 0x0050, checksum2: 0x1050, address1: 0x0A80, address2: 0x1A80 },
  // 3: Save header
  { size: 0x0010, checksum1: 0x0020, checksum2: 0x1020, address1: 0x0070, address2: 0x1070 },
  // 4: Signature (address2 is the only real copy; address1/checksum1/checksum2 unused)
  { size: 0x0020, checksum1: 0x0000, checksum2: 0x0000, address1: 0x0000, address2: 0x1000 },
  // 5: Extra region A
  { size: 0x0020, checksum1: 0x0060, checksum2: 0x1060, address1: 0x0F80, address2: 0x1F80 },
  // 6: Extra region B (possibly unused)
  { size: 0x0008, checksum1: 0x0FA0, checksum2: 0x1FA0, address1: 0x0FA0, address2: 0x1FA0 },
] as const;

/** Index into EEPROM_REGIONS for each logical region. */
export const REGION_SAVE_0  = 0;
export const REGION_SAVE_1  = 1;
export const REGION_SAVE_2  = 2;
export const REGION_HEADER  = 3;
export const REGION_SIG     = 4;

/** Number of save slots. */
export const NUM_SAVE_SLOTS = 3;

// ---------------------------------------------------------------------------
// ROM signatures written to region 4
//
// The game writes one of these to verify the EEPROM has been initialised.
// USA/EUR builds use ZELDA 5; JP/EUR builds use ZELDA 3.
// ---------------------------------------------------------------------------

export const SIGNATURE_USA = "AGBZELDA:THE MINISH CAP:ZELDA 5";
/** JP and EU share the same signature string (both use "ZELDA 3"). */
export const SIGNATURE_JP  = "AGBZELDA:THE MINISH CAP:ZELDA 3";
export const SIGNATURE_EU  = SIGNATURE_JP;

// ---------------------------------------------------------------------------
// SaveFile struct field offsets (from include/save.h)
//
// The struct is 0x4B4 bytes; the allocated EEPROM slot is 0x500 bytes.
// Offsets below are relative to the start of the 0x500-byte payload.
// ---------------------------------------------------------------------------

export const SF = {
  invalid:           0x000, // u8
  initialized:       0x001, // u8
  msg_speed:         0x002, // u8
  brightness:        0x003, // u8
  // filler4[2]      0x004
  saw_staffroll:     0x006, // u8
  dws_barrel_state:  0x007, // u8
  global_progress:   0x008, // u8
  available_figurines:0x009, // u8
  // fillerA[22]     0x00A
  map_hints:         0x020, // u16 LE
  // filler22[30]    0x022
  windcrests:        0x040, // u32 LE
  // filler44[12]    0x044
  enemies_killed:    0x050, // u32 LE
  // filler54[8]     0x054
  items_bought:      0x05C, // u32 LE
  areaVisitFlags:    0x060, // u32[8] LE  (256 bits)
  name:              0x080, // char[6]
  // filler86[2]     0x086
  saved_status:      0x088, // PlayerRoomStatus (0x20 bytes)
  stats:             0x0A8, // Stats (0x24 bytes)
  // fillerCC[2]     0x0CC
  figurines:         0x0D0, // u8[36]  (288-bit bitset)
  inventory:         0x0F2, // u8[34]  (2 bits per item ID)
  kinstones:         0x114, // KinstoneSave (0x148 bytes)
  flags:             0x25C, // u8[0x200]  (512-byte flag bitfield)
  dungeonKeys:       0x45C, // u8[16]
  dungeonItems:      0x46C, // u8[16]
  dungeonWarps:      0x47C, // u8[16]
  darknut_timer:     0x48C, // u32 LE
  drug_kill_count:   0x490, // u32 LE
  biggoron_timer:    0x494, // u32 LE
  vaati_timer:       0x498, // u32 LE
  timer4:            0x49C, // u32 LE  (unused)
  timer5:            0x4A0, // u32 LE  (unused)
  timer6:            0x4A4, // u32 LE  (unused)
  demo_timer:        0x4A8, // u32 LE
  // filler4ac[8]    0x4AC
} as const;

/** Total allocated payload size for a save slot (bytes). */
export const SAVE_FILE_PAYLOAD_SIZE = 0x500;
/** Actual populated struct size (bytes). */
export const SAVE_FILE_STRUCT_SIZE  = 0x4B4;

// ---------------------------------------------------------------------------
// PlayerRoomStatus field offsets (relative to SF.saved_status)
// From include/room.h
// ---------------------------------------------------------------------------

export const PRS = {
  area_next:        0x00, // u8
  room_next:        0x01, // u8
  start_anim:       0x02, // u8
  spawn_type:       0x03, // u8
  start_pos_x:      0x04, // s16 LE
  start_pos_y:      0x06, // s16 LE
  layer:            0x08, // u8
  // filler9         0x09
  dungeon_area:     0x0A, // u8
  dungeon_room:     0x0B, // u8
  dungeon_x:        0x0C, // s16 LE
  dungeon_y:        0x0E, // s16 LE
  dungeon_map_x:    0x10, // u16 LE
  dungeon_map_y:    0x12, // u16 LE
  overworld_map_x:  0x14, // u16 LE
  overworld_map_y:  0x16, // u16 LE
  // filler18[8]    0x18
} as const;

// ---------------------------------------------------------------------------
// Stats field offsets (relative to SF.stats)
// From include/player.h Stats
// ---------------------------------------------------------------------------

export const STATS = {
  walletType:       0x00, // u8
  heartPieces:      0x01, // u8
  health:           0x02, // u8
  maxHealth:        0x03, // u8
  bombCount:        0x04, // u8
  arrowCount:       0x05, // u8
  bombBagType:      0x06, // u8
  quiverType:       0x07, // u8
  figurineCount:    0x08, // u8
  _hasAllFigurines: 0x09, // u8 (internal copy)
  charm:            0x0A, // u8
  picolyteType:     0x0B, // u8
  equippedA:        0x0C, // u8  (equipped[0])
  equippedB:        0x0D, // u8  (equipped[1])
  bottle1:          0x0E, // u8  (bottles[0])
  bottle2:          0x0F, // u8  (bottles[1])
  bottle3:          0x10, // u8  (bottles[2])
  bottle4:          0x11, // u8  (bottles[3])
  effect:           0x12, // u8
  hasAllFigurines:  0x13, // u8
  // filler14[4]    0x14
  rupees:           0x18, // u16 LE
  shells:           0x1A, // u16 LE
  charmTimer:       0x1C, // u16 LE
  picolyteTimer:    0x1E, // u16 LE
  effectTimer:      0x20, // u16 LE
  // filler22[2]    0x22
} as const;

/** Total size of the Stats struct in bytes. */
export const STATS_SIZE = 0x24;

// ---------------------------------------------------------------------------
// KinstoneSave field offsets (relative to SF.kinstones)
// From include/save.h KinstoneSave
// ---------------------------------------------------------------------------

export const KS = {
  // unused[2]       0x00
  didAllFusions:    0x02, // u8
  fusedCount:       0x03, // u8
  types:            0x04, // u8[19] — item id for each kinstone type in bag
  amounts:          0x17, // u8[19] — count of each kinstone type above
  // filler[3]      0x2A
  fuserProgress:    0x2D, // u8[128]
  fuserOffers:      0xAD, // u8[128]
  fusedKinstones:   0x12D, // u8[13]  — bitfield
  fusionUnmarked:   0x13A, // u8[13]  — bitfield
} as const;

/** Total KinstoneSave struct size (0x148 bytes, confirmed by offset map). */
export const KINSTONE_SAVE_SIZE = 0x148;

// ---------------------------------------------------------------------------
// SaveHeader field offsets (relative to the header payload start)
// From include/save.h SaveHeader
// ---------------------------------------------------------------------------

export const SH = {
  signature:    0x00, // s32 LE  (ROM/build signature)
  saveFileId:   0x04, // u8  (active save slot 0–2)
  msg_speed:    0x05, // u8
  brightness:   0x06, // u8
  language:     0x07, // u8
  name:         0x08, // char[6]
  invalid:      0x0E, // u8
  initialized:  0x0F, // u8
} as const;

export const SAVE_HEADER_SIZE = 0x10;

// ---------------------------------------------------------------------------
// Flag bit positions — mirrors the Flag enum in include/flags.h
// (All in the global bank, FLAG_BANK_G = bit offset 0 within flags[])
// ---------------------------------------------------------------------------

export const FLAG = {
  LV0_CLEAR:           0x01,
  LV1_CLEAR:           0x02,
  LV2_CLEAR:           0x03,
  LV3_CLEAR:           0x04,
  LV4_CLEAR:           0x05,
  LV5_CLEAR:           0x06,
  LV6_CLEAR:           0x07,
  LV7_CLEAR:           0x08,
  LV8_CLEAR:           0x09,
  MACHI_SET_1:         0x0A,  // Defeated Big Green Chuchu
  MACHI_SET_2:         0x0B,  // Defeated Gleerok
  MACHI_SET_3:         0x0C,
  MACHI_SET_4:         0x0D,  // Defeated Big Octorok
  MACHI_SET_5:         0x0E,  // Defeated Gyorg Pair
  MACHI_SET_6:         0x0F,
  MACHI_SET_7:         0x10,
  MACHI_SET_8:         0x11,
  START:               0x13,  // Met Zelda
  EZERO_1ST:           0x14,  // Met Ezlo
  TABIDACHI:           0x15,  // Talked to Daltus + Smith
  HAKA_KEY_LOST:       0x20,  // Graveyard key stolen
  HAKA_KEY_FOUND:      0x21,  // Graveyard key recovered
  RENTED_HOUSE_DIN:    0x2B,
  RENTED_HOUSE_NAYRU:  0x2C,
  RENTED_HOUSE_FARORE: 0x2D,
  NEW_HOUSE_DIN:       0x2E,
  NEW_HOUSE_NAYRU:     0x2F,
  NEW_HOUSE_FARORE:    0x30,
  OUGONTEKI_A:         0x31,  // Golden Octorok 1
  OUGONTEKI_B:         0x32,  // Golden Tektite 1
  OUGONTEKI_C:         0x33,  // Golden Rope 1
  OUGONTEKI_D:         0x34,
  OUGONTEKI_E:         0x35,
  OUGONTEKI_F:         0x36,
  OUGONTEKI_G:         0x37,
  OUGONTEKI_H:         0x38,
  OUGONTEKI_I:         0x39,
  KAKERA_COMPLETE:     0x3A,  // All fusions complete
  CHIKATSURO_SHUTTER:  0x45,  // Castle basement shutter open
  AKINDO_BOTTLE_SELL:  0x5A,  // Bought bottle from scrub
  ENDING:              0x51,  // Vaati's Wrath defeated
  WARP_1ST:            0x52,  // Wind ocarina unlocked
  WARP_MONUMENT:       0x53,  // First windcrest discovered
  FIGURE_ALLCOMP:      0x59,  // Obtained Carlov Medal
  GAMECLEAR:           0x55,  // Watched end cutscene
  OUTDOOR:             0x49,  // Exited Link's house
} as const;

// Note: SOUGEN_08_TORITSUKI (Vaati possesses Daltus), DAIGORON_SHIELD, and DAIGORON_EXCHG
// are LocalFlags1 members — they live in FLAG_BANK_1, not in the global bank above.
// Use FLAG_VAATI_POSSESSED_DALTUS, FLAG_BIGGORON_SHIELD, FLAG_BIGGORON_EXCHG below.

// ---------------------------------------------------------------------------
// Flag bit positions for flags that live in local-flag banks (not global)
//
// The LocalFlags1 enum starts at FLAG_BANK_1 = bit offset 0x100 in flags[].
// Individual bit positions within bank 1 are their enum values offset by 0x100.
// ---------------------------------------------------------------------------

/** Bit offset added to a LocalFlags1 enum value to get its position in flags[]. */
export const FLAG_BANK_1_OFFSET = 0x100;

/**
 * Vaati possesses King Daltus — LocalFlags1.SOUGEN_08_TORITSUKI.
 * LocalFlags1 enum index 0x9C (USA build, counted from BEGIN_1 = 0).
 */
export const FLAG_VAATI_POSSESSED_DALTUS = FLAG_BANK_1_OFFSET + 0x9C;

/**
 * Biggoron accepted the first shield — LocalFlags1.DAIGORON_SHIELD.
 * LocalFlags1 enum index 0xAD (USA build).
 */
export const FLAG_BIGGORON_SHIELD = FLAG_BANK_1_OFFSET + 0xAD;

/**
 * Biggoron is currently tasting the shield — LocalFlags1.DAIGORON_EXCHG.
 * LocalFlags1 enum index 0xAE (USA build).
 */
export const FLAG_BIGGORON_EXCHG  = FLAG_BANK_1_OFFSET + 0xAE;

// ---------------------------------------------------------------------------
// Dungeon item bitmask values (dungeonItems[])
// Comment in save.h: "4: compass, 2: big key, 1: small key [map]"
// ---------------------------------------------------------------------------

export const DUNGEON_ITEM_MAP     = 0x01;
export const DUNGEON_ITEM_BIG_KEY = 0x02;
export const DUNGEON_ITEM_COMPASS = 0x04;

// ---------------------------------------------------------------------------
// Inventory helpers
// 2 bits per item ID, packed into inventory[34].
// Byte index  = itemId >> 2
// Bit offset  = (itemId & 3) << 1   (0, 2, 4, or 6)
// ---------------------------------------------------------------------------

export const INVENTORY_SLOTS = 136; // 34 bytes × 4 slots/byte
export const INVENTORY_BYTES = 34;
