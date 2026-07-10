# Minish Save

Save file reader and writer for The Legend of Zelda: The Minish Cap.

> [!WARNING]
> **Project status:** This library is currently in active development and should be considered **pre-release**. The public API may change, and not all parts of the implementation have been thoroughly tested or verified against a comprehensive suite of real save files.
>
> The initial implementation was developed with assistance from AI tools and is being actively reviewed, refined, and validated by the project maintainer. Before a stable v1.0 release, the library will undergo comprehensive testing, verification against the game's save format, and API refinement to ensure correctness and reliability.
>
> Until then, please expect breaking changes and use the library with caution in production projects.

Special Thanks to [Zelda Reverse Engineering Team](https://github.com/zeldaret) for the [reverse engineering of the game](https://github.com/zeldaret/tmc), which was used as a base for this.

## Usage

```ts
import { decodeSave, encodeSave } from 'minish-save';
import { readFileSync, writeFileSync } from 'node:fs';

const saveFile = readFileSync('file.sav');
const data = decodeSave(saveFile, {
    // some emulators may save the file in a byte-swapped format
    // and offsets won't match correctly, in that case you can use this option to correct it.
    // alternatively use a tool like https://exelotl.github.io/gba-eeprom-save-fix/
    byteSwapped: true
});

// regional signature
console.log(data.signature);
// save header metadata
console.log(data.header);

// game has 3 save slots, returned as an array in data.slots
// empty/deleted/corrupted saves are returned as null.
const slot = data.slots[0];

// Access data, such as rupees, etc.
console.log(slot.stats.rupees);

// Modify data
// Upgrade to biggest wallet type and max out rupees.
slot.stats.walletType = 3;
slot.stats.rupees = 999;

// Re-encode the save
const newSave = encodeSave(data, {
    // same as above, if you need it re-encoded in the same format.
    byteSwapped: true
});

// Write out the newly modified save.
writeFileSync('new_file.sav', newSave);
```