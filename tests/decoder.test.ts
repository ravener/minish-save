import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { decodeSave } from '../dist/index.js';

it('must throw on wrong save file size', () => {
    expect(() => decodeSave(new Uint8Array(0))).toThrow(RangeError);
});

it('can parse an uninitialized save', () => {
    // Read a new save that was just created by the game but never played.
    const save = readFileSync(new URL('./fixtures/uninitialized_new_game_bs.sav', import.meta.url));
    const data = decodeSave(save, { byteSwapped: true });

    // US signature
    expect(data.signature).toBe('AGBZELDA:THE MINISH CAP:ZELDA 5');

    // Save header check just in case
    expect(data.header).not.toBeNull();
    expect(data.header!.signature).toBe(1296259635);

    // First slot, which is uninitialized, has a name of "Test" and 3 hearts (24 health units).
    expect(data.slots).toHaveLength(3);
    expect(data.slots[0]).not.toBeNull();
    expect(data.slots[0]!.initialized).toBe(false);
    expect(data.slots[0]!.name).toBe('Test');
    expect(data.slots[0]!.stats.health).toBe(24);
    expect(data.slots[0]!.stats.maxHealth).toBe(24);
    expect(data.slots[0]!.stats.rupees).toBe(0);
    expect(data.slots[0]!.inventory.every(item => item === 0)).toBe(true);
    expect(data.slots[0]!.areaVisited.every(Boolean)).toBe(false);
    expect(data.slots[0]!.globalProgress).toBe(0);
    expect(data.slots[0]!.itemsBought).toBe(0);
    expect(data.slots[0]!.enemiesKilled).toBe(0);

    // only 1 slot is available
    expect(data.slots[1]).toBeNull();
    expect(data.slots[2]).toBeNull();
});