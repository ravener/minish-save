/**
 * checksum.ts — Checksum and EEPROM status logic.
 *
 * Mirrors the following functions from src/save.c:
 *   CalculateChecksum()        — running XOR-weighted sum
 *   VerifyChecksum()           — validate a SaveFileStatus against payload
 *   ParseSaveFileStatus()      — classify a status block (valid / empty / bad)
 *   DataDoubleReadWithStatus() — try primary then backup region
 *
 * All byte offsets into the Uint8Array use the same addresses as the C code.
 * Data is always little-endian (GBA ARM7TDMI).
 */

import {
  STATUS_MCZ3,
  STATUS_TINI,
  STATUS_FLED,
  STATUS_OFFSET_CHECKSUM1,
  STATUS_OFFSET_CHECKSUM2,
  STATUS_OFFSET_TAG,
  STATUS_STRUCT_SIZE,
  STATUS_BACKUP_OFFSET,
  EEPROMRegion,
  EEPROM_BLOCK_SIZE,
} from "./constants.js";

// ---------------------------------------------------------------------------
// Byte-swap utility
// ---------------------------------------------------------------------------

/**
 * Swap bytes within each 8-byte EEPROM block.
 *
 * Some older emulators (e.g. VisualBoyAdvance) store each 64-bit EEPROM block
 * with its bytes in reverse order.  This function performs an in-place swap:
 *   [B7,B6,B5,B4,B3,B2,B1,B0] ↔ [B0,B1,B2,B3,B4,B5,B6,B7]
 *
 * Apply before decoding a swapped file; apply again before writing back so
 * the emulator can reload it.
 */
export function byteSwapEEPROM(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += EEPROM_BLOCK_SIZE) {
    for (let j = 0; j < EEPROM_BLOCK_SIZE; j++) {
      out[i + j] = data[i + (EEPROM_BLOCK_SIZE - 1 - j)];
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Core checksum algorithm
// ---------------------------------------------------------------------------

/**
 * CalculateChecksum — mirrors the C implementation exactly.
 *
 * ```c
 * u16 CalculateChecksum(u16* data, u32 size) {
 *     u32 checksum = 0;
 *     while (size != 0) {
 *         checksum += (*data ^ size);
 *         data++;
 *         size = size - 2;
 *     }
 *     return checksum;   // truncated to u16 on return
 * }
 * ```
 *
 * `size` is the total byte count of the region; it acts as the XOR key and
 * decrements by 2 per iteration.  The accumulator is a u32 that naturally
 * wraps, then gets truncated to u16.
 *
 * @param view   DataView over the EEPROM buffer.
 * @param offset Byte offset of the first u16 to process.
 * @param size   Number of bytes to process (must be a multiple of 2).
 * @returns      16-bit checksum value.
 */
export function calculateChecksum(view: DataView, offset: number, size: number): number {
  let checksum = 0; // treated as u32 during accumulation
  let remaining = size;
  let pos = offset;

  while (remaining > 0) {
    const word = view.getUint16(pos, /*littleEndian=*/true);
    // Force unsigned 32-bit arithmetic to match C's u32 wrapping
    checksum = ((checksum + (word ^ remaining)) >>> 0);
    pos += 2;
    remaining -= 2;
  }

  // Truncate to u16 — matches the C function's return type
  return checksum & 0xFFFF;
}

/**
 * Compute the checksum contribution of the 'MCZ3' status tag.
 *
 * In C, DataDoubleWriteWithStatus() calls:
 *   checksum  = CalculateChecksum((u16*)&fileStatus.status, 4);
 *   checksum += CalculateChecksum((u16*)data, size);
 *
 * The status field is the u32 'MCZ3' = 0x4D435A33, stored in GBA memory as
 * LE bytes [0x33, 0x5A, 0x43, 0x4D].  Read as two consecutive u16 LE:
 *   word0 = 0x5A33,  word1 = 0x4D43
 *
 * CalculateChecksum with size=4:
 *   iter 1:  checksum += (0x5A33 ^ 4) = 0x5A37
 *   iter 2:  checksum += (0x4D43 ^ 2) = 0x4D41
 *   total  = 0xA778  (constant — never changes)
 */
const STATUS_TAG_CHECKSUM: number = (() => {
  const MCZ3_WORD0 = 0x5A33; // LE bytes: 0x33 0x5A
  const MCZ3_WORD1 = 0x4D43; // LE bytes: 0x43 0x4D
  let c = 0;
  c = (c + (MCZ3_WORD0 ^ 4)) >>> 0;
  c = (c + (MCZ3_WORD1 ^ 2)) >>> 0;
  return c & 0xFFFF;
})();

/**
 * Compute the full { checksum1, checksum2 } pair that should be written into a
 * SaveFileStatus block for a given payload.
 *
 * checksum1 = statusTagChecksum + dataChecksum  (u16, may wrap)
 * checksum2 = (0x10000 - checksum1) & 0xFFFF    (two's complement of checksum1)
 *
 * @param view        DataView over the EEPROM buffer.
 * @param dataOffset  Byte offset of the payload start.
 * @param dataSize    Payload size in bytes.
 */
export function computeChecksumPair(
  view: DataView,
  dataOffset: number,
  dataSize: number,
): { checksum1: number; checksum2: number } {
  const dataChecksum = calculateChecksum(view, dataOffset, dataSize);
  const checksum1 = (STATUS_TAG_CHECKSUM + dataChecksum) & 0xFFFF;
  const checksum2 = (0x10000 - checksum1) & 0xFFFF;
  return { checksum1, checksum2 };
}

// ---------------------------------------------------------------------------
// Status block parsing
// ---------------------------------------------------------------------------

/** Result of inspecting a SaveFileStatus block. */
export const enum StatusCode {
  /** Status is 'MCZ3' and checksum1 + checksum2 == 0x10000 → populated save. */
  Valid   = 2,
  /** Status is 'TINI' or 'FleD' and checksum1 & checksum2 == 0xFFFF → empty. */
  Empty   = 1,
  /** Unrecognised tag or bad checksum → corrupt. */
  Invalid = 0,
}

/**
 * ParseSaveFileStatus — mirrors the C function exactly.
 *
 * Reads a SaveFileStatus block at `offset` in `view` and classifies it.
 * Returns StatusCode.Valid / Empty / Invalid.
 */
export function parseSaveFileStatus(view: DataView, offset: number): StatusCode {
  const checksum1 = view.getUint16(offset + STATUS_OFFSET_CHECKSUM1, true);
  const checksum2 = view.getUint16(offset + STATUS_OFFSET_CHECKSUM2, true);
  const tag       = view.getUint32(offset + STATUS_OFFSET_TAG,       true);

  switch (tag) {
    case STATUS_MCZ3:
      return (checksum1 + checksum2) === 0x10000
        ? StatusCode.Valid
        : StatusCode.Invalid;

    case STATUS_TINI:
    case STATUS_FLED:
      return (checksum1 & checksum2) === 0xFFFF
        ? StatusCode.Empty
        : StatusCode.Invalid;

    default:
      return StatusCode.Invalid;
  }
}

/**
 * ReadSaveFileStatus — mirrors the C function.
 *
 * Tries the primary status block at `address`; if it is invalid, falls back to
 * the backup at `address + STATUS_BACKUP_OFFSET`.  Returns the best StatusCode
 * found, and writes the valid block's checksum1 into `out` for verification.
 *
 * Also returns the offset of the status block that was accepted so that
 * VerifyChecksum knows which checksum1 to compare against.
 */
export function readSaveFileStatus(
  view: DataView,
  address: number,
): { code: StatusCode; checksum1: number; checksum2: number; tag: number } {
  // Try primary
  let code = parseSaveFileStatus(view, address);
  if (code !== StatusCode.Invalid) {
    return {
      code,
      checksum1: view.getUint16(address + STATUS_OFFSET_CHECKSUM1, true),
      checksum2: view.getUint16(address + STATUS_OFFSET_CHECKSUM2, true),
      tag:       view.getUint32(address + STATUS_OFFSET_TAG,       true),
    };
  }

  // Try backup
  const backup = address + STATUS_BACKUP_OFFSET;
  code = parseSaveFileStatus(view, backup);
  return {
    code,
    checksum1: view.getUint16(backup + STATUS_OFFSET_CHECKSUM1, true),
    checksum2: view.getUint16(backup + STATUS_OFFSET_CHECKSUM2, true),
    tag:       view.getUint32(backup + STATUS_OFFSET_TAG,       true),
  };
}

/**
 * VerifyChecksum — mirrors the C function.
 *
 * Recomputes the expected checksum1 from the 'MCZ3' tag contribution plus the
 * actual payload bytes, then confirms:
 *   1. fileStatus.checksum1 == computed checksum
 *   2. fileStatus.checksum2 == 0x10000 − fileStatus.checksum1  (mod 0x10000)
 *   3. fileStatus.status    == 'MCZ3'
 *
 * @returns true when all three conditions hold.
 */
export function verifyChecksum(
  storedChecksum1: number,
  storedChecksum2: number,
  storedTag: number,
  view: DataView,
  dataOffset: number,
  dataSize: number,
): boolean {
  if (storedTag !== STATUS_MCZ3) return false;
  const { checksum1 } = computeChecksumPair(view, dataOffset, dataSize);
  if (storedChecksum1 !== checksum1) return false;
  if ((storedChecksum1 + storedChecksum2) !== 0x10000) return false;
  return true;
}

// ---------------------------------------------------------------------------
// DataDoubleReadWithStatus — the top-level read logic
// ---------------------------------------------------------------------------

/**
 * Result of attempting to read a redundant EEPROM region.
 *
 * status = 'valid'   → payload was read and checksum verified
 * status = 'empty'   → slot is TINI or FleD (never written or deleted)
 * status = 'corrupt' → both copies have bad checksums / unknown tags
 */
export type ReadResult =
  | { status: "valid";   dataOffset: number }
  | { status: "empty"  }
  | { status: "corrupt" };

/**
 * DataDoubleReadWithStatus — mirrors the C function.
 *
 * Algorithm:
 *   1. Call ReadSaveFileStatus(checksum1_address) → read1status
 *   2. If read1status == 2 (Valid), read from address1 and VerifyChecksum.
 *      If ok → return { status:'valid', dataOffset: address1 }
 *   3. Call ReadSaveFileStatus(checksum2_address) → read2status
 *   4. If read2status == 2 (Valid), read from address2 and VerifyChecksum.
 *      If ok → return { status:'valid', dataOffset: address2 }
 *   5. If either read returned Empty (1) → return { status:'empty' }
 *   6. Otherwise               → return { status:'corrupt' }
 */
export function dataDoubleReadWithStatus(
  view: DataView,
  region: EEPROMRegion,
): ReadResult {
  const { size, checksum1, checksum2, address1, address2 } = region;

  // ── Try primary ──
  const r1 = readSaveFileStatus(view, checksum1);
  if (r1.code === StatusCode.Valid) {
    if (verifyChecksum(r1.checksum1, r1.checksum2, r1.tag, view, address1, size)) {
      return { status: "valid", dataOffset: address1 };
    }
    // checksum mismatch — fall through
  }

  // ── Try secondary ──
  const r2 = readSaveFileStatus(view, checksum2);
  if (r2.code === StatusCode.Valid) {
    if (verifyChecksum(r2.checksum1, r2.checksum2, r2.tag, view, address2, size)) {
      return { status: "valid", dataOffset: address2 };
    }
  }

  // ── Decide on empty vs corrupt ──
  if (r1.code === StatusCode.Empty || r2.code === StatusCode.Empty) {
    return { status: "empty" };
  }
  return { status: "corrupt" };
}

// ---------------------------------------------------------------------------
// Writing helpers
// ---------------------------------------------------------------------------

/**
 * Write a SaveFileStatus block at `address` (and its backup at address+8).
 *
 * Mirrors WriteSaveFileStatus() from save.c, which writes the primary block
 * and — if that would fail on real hardware — the backup.  In our buffer
 * there is no failure path, so we always write both.
 */
export function writeSaveFileStatus(
  view: DataView,
  address: number,
  checksum1: number,
  checksum2: number,
  tag: number = STATUS_MCZ3,
): void {
  for (const off of [address, address + STATUS_BACKUP_OFFSET]) {
    view.setUint16(off + STATUS_OFFSET_CHECKSUM1, checksum1, true);
    view.setUint16(off + STATUS_OFFSET_CHECKSUM2, checksum2, true);
    view.setUint32(off + STATUS_OFFSET_TAG,       tag,       true);
  }
}

/**
 * Write an "init" (factory-fresh, TINI) status at `address` and its backup.
 * Uses checksum1=0xFFFF, checksum2=0xFFFF so that (c1 & c2) == 0xFFFF.
 */
export function writeInitStatus(view: DataView, address: number): void {
  for (const off of [address, address + STATUS_BACKUP_OFFSET]) {
    view.setUint16(off + STATUS_OFFSET_CHECKSUM1, 0xFFFF, true);
    view.setUint16(off + STATUS_OFFSET_CHECKSUM2, 0xFFFF, true);
    view.setUint32(off + STATUS_OFFSET_TAG,       STATUS_TINI, true);
  }
}

/**
 * DataDoubleWriteWithStatus — mirrors the C function.
 *
 * Writes `payload` to both the primary (address1) and secondary (address2)
 * locations, then writes the corresponding SaveFileStatus at checksum1 /
 * checksum2 (each with its backup 8 bytes later).
 */
export function dataDoubleWriteWithStatus(
  view: DataView,
  region: EEPROMRegion,
  payload: Uint8Array,
): void {
  const { size, checksum1, checksum2, address1, address2 } = region;

  // Write payload to both locations
  new Uint8Array(view.buffer, view.byteOffset, view.byteLength).set(
    payload.subarray(0, size),
    address1,
  );
  new Uint8Array(view.buffer, view.byteOffset, view.byteLength).set(
    payload.subarray(0, size),
    address2,
  );

  // Compute checksum over the payload now that it's in the buffer
  const { checksum1: c1, checksum2: c2 } = computeChecksumPair(view, address1, size);

  // Write status blocks (primary + backup for each)
  writeSaveFileStatus(view, checksum1, c1, c2);
  writeSaveFileStatus(view, checksum2, c1, c2);
}
