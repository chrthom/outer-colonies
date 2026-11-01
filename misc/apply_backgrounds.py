#!/usr/bin/env python3
"""
Apply new backgrounds to Edition 1-4 cards based on card type and discipline.

This script:
1. Reads cards.csv to get card metadata (type, discipline, tags, stats)
2. For each XCF file in editions 1-4:
   - Determines the card ID from filename and folder
   - Looks up the card's type/discipline/stats from CSV
   - Opens the XCF file
   - Removes the existing 'background' layer
   - Copies the 'background' layer group from the template
   - Copies the 'card_border' layer from the template
   - Makes the appropriate background layer visible based on rules
   - Ensures background group is bottom-most and card_border is top-most
   - Saves the XCF
   - Exports to PNG

Usage:
    flatpak run org.gimp.GIMP --no-interface --batch-interpreter=python-fu-eval \
        --batch='exec(open("/path/to/apply_backgrounds.py").read())'
"""

import csv
import os
import re
import sys
from gi.repository import Gimp, Gio


# ============================================================
# BACKGROUND LAYER MAPPING RULES (in priority order)
# ============================================================

def get_background_layer(card_data):
    """
    Determine which background layer to make visible based on card data.
    Returns the layer name from the background_types group.
    """
    card_type = card_data.get('type', '').lower()
    discipline = card_data.get('discipline', '').strip()
    tags = card_data.get('tags', '').lower()

    # Parse numeric stats
    energy = float(card_data.get('energy', 0) or 0)
    damage = float(card_data.get('damage', 0) or 0)
    abm = float(card_data.get('abm', 0) or 0)
    shield = float(card_data.get('shield', 0) or 0)
    armour = float(card_data.get('armour', 0) or 0)

    # Infrastructure rules (highest priority first)
    if card_type == 'infrastructure':
        if 'planetar' in tags:
            return 'infrastructure_planetary_bg'
        elif energy > 0:
            return 'infrastructure_energy_bg'
        else:
            return 'infrastructure_others_bg'

    # Equipment rules
    if card_type == 'equipment':
        if damage > 0:
            return 'equipment_weapon_bg'
        elif abm > 0 or shield > 0 or armour > 0:
            return 'equipment_defense_bg'
        else:
            return 'equipment_others_bg'

    # Tactic rules
    if card_type == 'tactic':
        # Note: discipline values in German
        if discipline == 'Information':
            return 'tactic_intelligence_bg'
        elif discipline == 'Militär':
            return 'tactic_military_bg'
        elif discipline == 'Wirtschaft':
            return 'tactic_trade_bg'
        elif discipline == 'Wissenschaft':
            return 'tactic_science_bg'

    # Simple type mappings
    if card_type == 'hull':
        return 'hull_bg'
    if card_type == 'orb':
        return 'orb_bg'

    # Fallback
    return None


# ============================================================
# CARD DATA LOADING
# ============================================================

def load_card_csv(csv_path):
    """Load cards.csv and return a dict mapping card_id -> card_data."""
    card_db = {}
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            card_id = row.get('id', '').strip()
            if card_id:
                card_db[card_id] = row
    return card_db


# ============================================================
# XCF PROCESSING
# ============================================================

def get_xcf_files(work_dir):
    """Get all XCF files from editions 1-4 in the working directory."""
    xcf_files = []
    for edition in ['1', '2', '3', '4']:
        edition_dir = os.path.join(work_dir, edition)
        if os.path.isdir(edition_dir):
            for f in os.listdir(edition_dir):
                if f.lower().endswith('.xcf'):
                    # Extract card number from filename
                    # Filenames are like "01_quantentorpedos.xcf" or "54_pegasus_torpedos.xcf"
                    match = re.match(r'^(\d{1,2})_', f)
                    if match:
                        file_prefix = match.group(1)
                        # Full card ID = edition + file_prefix
                        card_id = edition + file_prefix.zfill(2)
                        xcf_files.append({
                            'path': os.path.join(edition_dir, f),
                            'edition': edition,
                            'file_prefix': file_prefix,
                            'card_id': card_id
                        })
    return xcf_files


def process_xcf_file(xcf_info, card_db, template_path, output_dir):
    """Process a single XCF file to apply the new background."""
    card_id = xcf_info['card_id']
    filepath = xcf_info['path']

    # Look up card data
    card_data = card_db.get(card_id)
    if not card_data:
        print(f"WARNING: No CSV data for card {card_id}, skipping {filepath}")
        return False

    bg_layer_name = get_background_layer(card_data)
    if not bg_layer_name:
        print(f"WARNING: No background layer determined for card {card_id} (type={card_data.get('type')}), skipping")
        return False

    print(f"Processing card {card_id}: type={card_data.get('type')}, bg={bg_layer_name}")

    # Load template
    template_gfile = Gio.File.new_for_path(template_path)
    template_img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, template_gfile)

    # Load target image
    target_gfile = Gio.File.new_for_path(filepath)
    target_img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, target_gfile)

    try:
        # Get template layers
        template_layers = {l.get_name(): l for l in template_img.get_layers()}

        # Find background group and card_border in template
        bg_group = template_layers.get('background')
        card_border = template_layers.get('card_border')

        if not bg_group:
            print(f"ERROR: Template missing 'background' group")
            return False
        if not card_border:
            print(f"ERROR: Template missing 'card_border' layer")
            return False

        # Get background_types subgroup
        bg_types_group = None
        for child in bg_group.get_children():
            if child.get_name() == 'background_types':
                bg_types_group = child
                break

        if not bg_types_group:
            print(f"ERROR: Template missing 'background_types' subgroup")
            return False

        # Get all background type layers
        bg_layers = {l.get_name(): l for l in bg_types_group.get_children()}

        # Get target layers
        target_layers = list(target_img.get_layers())
        target_layer_map = {l.get_name(): l for l in target_layers}

        # Remove existing background layer
        old_bg = target_layer_map.get('background')
        if old_bg:
            target_img.remove_layer(old_bg)

        # Copy background group from template
        new_bg_group = bg_group.copy()
        target_img.insert_layer(new_bg_group, None, 0)  # Add at bottom (position 0)

        # Copy card_border from template
        new_card_border = card_border.copy()
        # Add at top - use highest position index
        target_img.insert_layer(new_card_border, None, -1)  # Add at top

        # Find the new background_types group in the target
        new_bg_types = None
        for child in new_bg_group.get_children():
            if child.get_name() == 'background_types':
                new_bg_types = child
                break

        if not new_bg_types:
            print(f"ERROR: Copied background group missing 'background_types' subgroup")
            return False

        # Hide all background type layers first
        for child in new_bg_types.get_children():
            child.set_visible(False)

        # Show the correct background layer
        target_bg_layer = None
        for child in new_bg_types.get_children():
            if child.get_name() == bg_layer_name:
                target_bg_layer = child
                break

        if target_bg_layer:
            target_bg_layer.set_visible(True)
            print(f"  -> Made '{bg_layer_name}' visible")
        else:
            print(f"WARNING: Background layer '{bg_layer_name}' not found in template")
            # List available layers
            available = [l.get_name() for l in new_bg_types.get_children()]
            print(f"  Available: {available}")

        # Save the modified XCF
        output_xcf = os.path.join(output_dir, os.path.basename(filepath))
        os.makedirs(os.path.dirname(output_xcf), exist_ok=True)
        Gimp.file_save(Gimp.RunMode.NONINTERACTIVE, target_img,
                      Gio.File.new_for_path(output_xcf))

        # Export to PNG
        output_png = os.path.join(output_dir, os.path.splitext(os.path.basename(filepath))[0] + '.png')
        export_layer = target_img.get_active_layer()
        Gimp.file_export(Gimp.RunMode.NONINTERACTIVE, target_img, export_layer,
                        Gio.File.new_for_path(output_png), "PNG")

        print(f"  -> Saved: {output_xcf}")
        print(f"  -> Exported: {output_png}")

        return True

    finally:
        # Clean up images
        if 'template_img' in locals():
            template_img.delete()
        if 'target_img' in locals():
            target_img.delete()


def main():
    """Main processing function."""
    # Configuration
    work_dir = "/home/christopher/Downloads/oc_work"
    template_path = "/home/christopher/Downloads/oc_work/template.xcf"
    csv_path = "/home/christopher/Dokumente/outer-colonies1/misc/cards.csv"
    output_dir = "/home/christopher/Downloads/oc_work/output"

    # Load card database
    print(f"Loading card database from {csv_path}...")
    card_db = load_card_csv(csv_path)
    print(f"Loaded {len(card_db)} cards")

    # Get XCF files
    print(f"Scanning {work_dir} for XCF files...")
    xcf_files = get_xcf_files(work_dir)
    print(f"Found {len(xcf_files)} XCF files in editions 1-4")

    # Process files
    print(f"\nProcessing cards...")
    success_count = 0
    for xcf_info in xcf_files[:10]:  # Limit to first 10 for initial testing
        if process_xcf_file(xcf_info, card_db, template_path, output_dir):
            success_count += 1

    print(f"\nDone! Successfully processed {success_count}/{len(xcf_files[:10])} cards")
    print(f"Output files in: {output_dir}")


if __name__ == '__main__':
    main()
