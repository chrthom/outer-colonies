#!/usr/bin/env python3
"""
Test script to investigate and update XCF files with curated text from cards.csv.

Phase 1: Investigate the current formatting of text layers in XCF files
Phase 2: Update textbox_text_rule and textbox_text_lore with CSV data

Usage:
    # Phase 1 - Investigate formatting
    python3 test_xcf_update.py /tmp/test_xcf investigate

    # Phase 2 - Update with CSV data (dry run)
    python3 test_xcf_update.py /tmp/test_xcf update --csv /home/christopher/Dokumente/outer-colonies2/misc/cards.csv --dry-run

    # Phase 2 - Update with CSV data (real)
    python3 test_xcf_update.py /tmp/test_xcf update --csv /home/christopher/Dokumente/outer-colonies2/misc/cards.csv
"""

import sys
import os
import csv
import re
import html
from pathlib import Path
from gi.repository import Gimp, Gio

# Icon to Unicode character mapping from misc/icons/font/mapping.md
ICON_TO_CHAR = {
    'tactic': '\uEA0C',
    'equipment': '\uEA05',
    'hull': '\uEA07',
    'infrastructure': '\uEA08',
    'orb': '\uEA09',
    'energy': '\uEA04',
    'speed': '\uEA04',
    'hp': '\uEA06',
    'armour': '\uEA01',
    'shield': '\uEA0B',
    'abm': '\uEA0B',
    'damage': '\uEA03',
    'control': '\uEA02',
    'point_defense': '\uEA0A',
}


def extract_id_from_filename(filename):
    """Extract numeric ID from filename (before first '_')."""
    base = Path(filename).stem
    match = re.match(r'^(\d+)', base)
    if match:
        return match.group(1)
    return ""


def navigate_to_layer(img, path):
    """Navigate through layer hierarchy following a path of layer names."""
    current = img

    for i, name in enumerate(path):
        if i == 0:
            items = current.get_layers()
        else:
            items = current.get_children()

        matching = [item for item in items if hasattr(item, 'get_name') and item.get_name() == name]
        if not matching:
            return None
        current = matching[0]

    return current


def get_layer_children(layer):
    """Get children of a layer, handling any errors."""
    try:
        return layer.get_children()
    except Exception:
        return []


def extract_text_from_layer(layer):
    """Extract plain text from a text layer using markup."""
    try:
        if hasattr(layer, 'get_markup'):
            markup = layer.get_markup()
            if markup:
                return markup
    except Exception:
        pass
    return ""


def investigate_xcf_file(filepath):
    """Investigate the text layer formatting in an XCF file."""
    filename = os.path.basename(filepath)
    card_id = extract_id_from_filename(filename)

    print(f"\n{'='*60}")
    print(f"File: {filename} (ID: {card_id})")
    print(f"{'='*60}")

    # Load XCF
    gfile = Gio.File.new_for_path(filepath)
    img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, gfile)

    try:
        # Find textbox_text_rule
        textbox_text_rule = navigate_to_layer(img, ["card", "textbox", "textbox_text_rule"])
        if textbox_text_rule:
            markup = extract_text_from_layer(textbox_text_rule)
            print(f"\ntextbox_text_rule markup:\n{markup}")
            print(f"  Visible: {textbox_text_rule.get_visible()}")
            print(f"  Has get_markup: {hasattr(textbox_text_rule, 'get_markup')}")
            print(f"  Has set_markup: {hasattr(textbox_text_rule, 'set_markup')}")
        else:
            print("\ntextbox_text_rule: NOT FOUND")
            # Try to find it by searching
            print("  Searching for textbox layers...")
            for layer in img.get_layers():
                name = layer.get_name() if hasattr(layer, 'get_name') else 'unknown'
                if 'textbox' in name.lower():
                    print(f"    Found: {name}")

        # Find textbox_text_lore
        textbox_text_lore = navigate_to_layer(img, ["card", "textbox", "textbox_text_lore"])
        if textbox_text_lore:
            markup = extract_text_from_layer(textbox_text_lore)
            print(f"\ntextbox_text_lore markup:\n{markup}")
            print(f"  Visible: {textbox_text_lore.get_visible()}")
        else:
            print("\ntextbox_text_lore: NOT FOUND")

        # List all layers for debugging
        print(f"\nAll layers in 'card/textbox':")
        textbox = navigate_to_layer(img, ["card", "textbox"])
        if textbox:
            for child in get_layer_children(textbox):
                name = child.get_name() if hasattr(child, 'get_name') else 'unknown'
                visible = child.get_visible() if hasattr(child, 'get_visible') else 'N/A'
                print(f"  - {name} (visible: {visible})")

    finally:
        img.delete()


def replace_icon_placeholders(text):
    """
    Replace {ICON:...} placeholders with actual Unicode characters from the icon font.
    """
    if not text:
        return text

    pattern = r'\{ICON:([^}]+)\}'

    def replace_match(match):
        icon_type = match.group(1)
        return ICON_TO_CHAR.get(icon_type.lower(), f'[{icon_type}]')

    return re.sub(pattern, replace_match, text)


def reconstruct_textbox_text_rule(effect, tags, conditional_tags):
    """
    Reconstruct the textbox_text_rule text with proper <i> tags.
    """
    effect = replace_icon_placeholders(effect)
    tags = replace_icon_placeholders(tags)
    conditional_tags = replace_icon_placeholders(conditional_tags)

    effect_escaped = html.escape(effect)
    tags_escaped = html.escape(tags)
    conditional_tags_escaped = html.escape(conditional_tags)

    if conditional_tags_escaped:
        return f"<i>{tags_escaped}</i> {effect_escaped} <i>{conditional_tags_escaped}</i>"
    elif tags_escaped:
        return f"<i>{tags_escaped}</i> {effect_escaped}"
    else:
        return effect_escaped


def set_text_layer_content(text_layer, text_content):
    """Set the text content of a GIMP text layer."""
    try:
        if hasattr(text_layer, 'set_markup'):
            text_layer.set_markup(text_content)
            return True
    except Exception as e:
        print(f"  WARNING: Could not set text layer content: {e}")
    return False


def update_xcf_file(filepath, csv_data):
    """Update the text layers in an XCF file with data from CSV."""
    filename = os.path.basename(filepath)
    card_id = extract_id_from_filename(filename)

    print(f"\nProcessing: {filename} (ID: {card_id})")

    gfile = Gio.File.new_for_path(filepath)
    img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, gfile)

    try:
        textbox_text_rule_content = reconstruct_textbox_text_rule(
            csv_data['effect'],
            csv_data['tags'],
            csv_data['conditional_tags']
        )
        textbox_text_lore_content = csv_data['lore']

        print(f"  textbox_text_rule: {textbox_text_rule_content[:100]}...")
        print(f"  textbox_text_lore: {textbox_text_lore_content[:100]}...")

        textbox_text_rule = navigate_to_layer(img, ["card", "textbox", "textbox_text_rule"])
        if textbox_text_rule:
            if set_text_layer_content(textbox_text_rule, textbox_text_rule_content):
                print(f"  Updated textbox_text_rule")
            else:
                print(f"  FAILED to update textbox_text_rule")
        else:
            print(f"  WARNING: textbox_text_rule layer not found")

        textbox_text_lore = navigate_to_layer(img, ["card", "textbox", "textbox_text_lore"])
        if textbox_text_lore:
            if set_text_layer_content(textbox_text_lore, textbox_text_lore_content):
                print(f"  Updated textbox_text_lore")
            else:
                print(f"  FAILED to update textbox_text_lore")
        else:
            print(f"  WARNING: textbox_text_lore layer not found")

        img.save(Gimp.RunMode.NONINTERACTIVE, gfile)
        print(f"  Saved changes to {filepath}")

        return True

    finally:
        img.delete()


def load_csv_data(csv_path, card_ids):
    """Load CSV data for specific card IDs."""
    data = {}

    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile, delimiter=';', quotechar='"')
        header = next(reader)
        col_indices = {
            'id': header.index('id'),
            'effect': header.index('effect'),
            'tags': header.index('tags'),
            'conditional_tags': header.index('conditional_tags'),
            'lore': header.index('lore'),
        }
        for row in reader:
            card_id = row[col_indices['id']]
            if card_id in card_ids:
                data[card_id] = {
                    'effect': row[col_indices['effect']],
                    'tags': row[col_indices['tags']],
                    'conditional_tags': row[col_indices['conditional_tags']],
                    'lore': row[col_indices['lore']],
                }

    return data


def find_xcf_file(base_dir, card_id):
    """Find the XCF file for a given card ID."""
    id_str = str(card_id)
    if len(id_str) >= 2:
        folder_prefix = id_str[0]
        file_number = id_str[1:]
    else:
        folder_prefix = ""
        file_number = id_str

    folder_path = os.path.join(base_dir, folder_prefix)
    if not os.path.isdir(folder_path):
        return None

    pattern = f"{file_number}_"
    for f in os.listdir(folder_path):
        if f.startswith(pattern) and f.lower().endswith('.xcf'):
            return os.path.join(folder_path, f)

    return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 test_xcf_update.py <xcf_dir> [investigate|update]")
        print("  investigate: Show current text layer formatting")
        print("  update: Update text layers from CSV")
        sys.exit(1)

    xcf_dir = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else "investigate"

    if mode == "investigate":
        print("Investigating XCF files in:", xcf_dir)
        for f in sorted(os.listdir(xcf_dir)):
            if f.lower().endswith('.xcf'):
                investigate_xcf_file(os.path.join(xcf_dir, f))

    elif mode == "update":
        csv_path = None
        dry_run = False

        args = sys.argv[3:]
        i = 0
        while i < len(args):
            if args[i] == "--csv" and i + 1 < len(args):
                csv_path = args[i + 1]
                i += 2
            elif args[i] == "--dry-run":
                dry_run = True
                i += 1
            else:
                i += 1

        if not csv_path:
            print("Error: --csv parameter required")
            sys.exit(1)

        # Find all XCF files
        xcf_files = []
        for root, dirs, files in os.walk(xcf_dir):
            for f in files:
                if f.lower().endswith('.xcf'):
                    xcf_files.append(os.path.join(root, f))

        # Extract card IDs from filenames
        card_ids = [extract_id_from_filename(f) for f in xcf_files]
        card_ids = [cid for cid in card_ids if cid]  # Filter empty

        print(f"Found {len(xcf_files)} XCF files")
        print(f"Card IDs: {card_ids}")

        # Load CSV data
        csv_data = load_csv_data(csv_path, card_ids)
        print(f"Loaded {len(csv_data)} matching cards from CSV")

        # Update each file
        for filepath in xcf_files:
            card_id = extract_id_from_filename(filepath)
            if card_id in csv_data:
                if not dry_run:
                    update_xcf_file(filepath, csv_data[card_id])
                else:
                    print(f"\n[DRY RUN] Would update: {os.path.basename(filepath)}")
                    print(f"  textbox_text_rule: {reconstruct_textbox_text_rule(
                        csv_data[card_id]['effect'],
                        csv_data[card_id]['tags'],
                        csv_data[card_id]['conditional_tags']
                    )[:100]}...")
                    print(f"  textbox_text_lore: {csv_data[card_id]['lore'][:100]}...")

    else:
        print(f"Unknown mode: {mode}")
        sys.exit(1)


if __name__ == "__main__":
    main()
