# Icon Assets

This directory contains icon assets for the Outer Colonies card game, used for creating an icon font.

## Source

Icons are downloaded from the official Outer Colonies assets server:
- Stat icons: `https://assets.outercolonies.de/attribute/<icon>.png`
- Type icons: `https://assets.outercolonies.de/icons/<icon>.png`

## Stat Icons (attribute/)

| Filename | Description | Usage |
|----------|-------------|-------|
| `hp.png` | Hull/Health Points | Effect field |
| `armour.png` | Armour | Effect field |
| `shield.png` | Shield | Effect field |
| `point_defense.png` | Point Defense (ABM) | Effect field |
| `damage.png` | Damage | Effect field |
| `control.png` | Control | Effect field |
| `energy.png` | Energy | Effect field |

## Type Icons (icons/)

| Filename | Description | Usage |
|----------|-------------|-------|
| `hull.png` | Hull card type | Tags field |
| `infrastructure.png` | Infrastructure card type | Tags field |
| `equipment.png` | Equipment card type | Tags field |
| `orb.png` | Orb card type | Tags field |
| `tactic.png` | Tactic card type | Tags field |

## Purpose

These icons are the source images for generating a custom icon font that will:
1. Replace graphic overlay layers in XCF card templates with embedded font characters
2. Simplify text extraction from XCF files
3. Provide consistent icon rendering across all cards
