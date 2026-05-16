#!/usr/bin/env python3
"""
Test script to update XCF files with curated text from cards.csv.

This script:
1. Reads CSV data for specific test cards
2. Updates textbox_text_rule and textbox_text_lore layers with curated text
3. Preserves font styling and replaces {ICON:...} with Unicode icon characters

Usage:
  flatpak run org.gimp.GIMP --batch-interpreter=python-fu-eval -b \
    'import sys; sys.argv = ["test_update_xcf.py", "/tmp/test_xcf", "/home/christopher/Dokumente/outer-colonies2/misc/cards.csv"]; \
     exec(open("/home/christopher/Dokumente/outer-colonies2/misc/test_update_xcf.py").read())'
"""

import sys
import os
import csv
import re
import html
from pathlib import Path
from gi.repository import Gimp, Gio

OUTPUT_FILE = "/tmp/xcf_update_results.txt"

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


def log(message):
    with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
        f.write(f"{message}\n")


def extract_id_from_filename(filename):
    base = Path(filename).stem
    match = re.match(r'^(\d+)', base)
    if match:
        return match.group(1)
    return ""


def navigate_to_layer(img, path):
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
    try:
        return layer.get_children()
    except Exception:
        return []


def extract_text_from_layer(layer):
    """Extract markup from a text layer."""
    try:
        if hasattr(layer, 'get_markup'):
            markup = layer.get_markup()
            if markup:
                return markup
    except Exception:
        pass
    return ""


def replace_icon_placeholders(text):
    """
    Replace {ICON:...} placeholders with actual Unicode characters from the icon font.
    Wraps the icon character in a span with the icon font.
    """
    if not text:
        return text

    pattern = r'\{ICON:([^}]+)\}'

    def replace_match(match):
        icon_type = match.group(1)
        char = ICON_TO_CHAR.get(icon_type.lower(), f'[{icon_type}]')
        # Wrap the icon character in a span with the icon font
        return f'<span font="outer-colonies-icons">{char}</span>'

    return re.sub(pattern, replace_match, text)


def get_existing_markup_style(layer):
    """
    Extract the font styling from an existing text layer's markup.
    Returns a tuple of (font_family, font_size, foreground_color).
    """
    markup = extract_text_from_layer(layer)
    if not markup:
        return None, None, None

    # Parse markup to extract style info
    font_family = None
    font_size = None
    foreground = None

    # Look for font attribute
    font_match = re.search(r'font="([^"]+)"', markup)
    if font_match:
        font_family = font_match.group(1)

    # Look for size
    size_match = re.search(r'size="([^"]+)"', markup)
    if size_match:
        font_size = size_match.group(1)

    # Look for foreground color
    fg_match = re.search(r'foreground="([^"]+)"', markup)
    if fg_match:
        foreground = fg_match.group(1)

    return font_family, font_size, foreground


def reconstruct_textbox_text_rule_markup(effect, tags, conditional_tags, font_family, font_size, foreground):
    """
    Reconstruct the textbox_text_rule markup with proper styling and <i> tags.

    The original markup format from XCF:
    - <markup><span font="gimpfont256"><i><span foreground="#ffffff"><span size="6881">tags</span></span></i></span><span font="gimpfont256"><span foreground="#ffffff"><span size="6881">effect</span></span></span></markup>

    Simplified format that should work:
    - <markup><span font="{font}" foreground="{fg}" size="{size}"><i>tags</i> effect <i>conditional_tags</i></span></markup>
    """
    # Replace icon placeholders with icon font spans
    effect = replace_icon_placeholders(effect)
    tags = replace_icon_placeholders(tags)
    conditional_tags = replace_icon_placeholders(conditional_tags)

    # Split into parts: icon spans and regular text, then escape only regular text
    def escape_preserving_icons(text):
        parts = re.split(r'(<span font="outer-colonies-icons">[^<]+</span>)', text)
        escaped_parts = []
        for part in parts:
            if part.startswith('<span font="outer-colonies-icons">'):
                escaped_parts.append(part)  # Don't escape icon spans
            else:
                escaped_parts.append(html.escape(part))
        return ''.join(escaped_parts)

    effect_escaped = escape_preserving_icons(effect)
    tags_escaped = escape_preserving_icons(tags)
    conditional_tags_escaped = escape_preserving_icons(conditional_tags)

    # Build the markup
    style_attrs = []
    if font_family:
        style_attrs.append(f'font="{font_family}"')
    if foreground:
        style_attrs.append(f'foreground="{foreground}"')
    if font_size:
        style_attrs.append(f'size="{font_size}"')
    style_str = ' '.join(style_attrs)

    if conditional_tags_escaped:
        # Format: <i>tags</i> effect <i>conditional_tags</i>
        inner = f"<i>{tags_escaped}</i> {effect_escaped} <i>{conditional_tags_escaped}</i>"
    elif tags_escaped:
        # Format: <i>tags</i> effect
        inner = f"<i>{tags_escaped}</i> {effect_escaped}"
    else:
        # Format: effect only
        inner = effect_escaped

    return f'<markup><span {style_str}>{inner}</span></markup>'


def reconstruct_textbox_text_lore_markup(lore, font_family, font_size, foreground):
    """
    Reconstruct the textbox_text_lore markup with proper styling.
    """
    # Replace icon placeholders with icon font spans (already contain HTML)
    lore_with_icons = replace_icon_placeholders(lore)
    # Split into parts: icon spans and regular text
    parts = re.split(r'(<span font="outer-colonies-icons">[^<]+</span>)', lore_with_icons)
    # Escape only the non-icon parts
    escaped_parts = []
    for part in parts:
        if part.startswith('<span font="outer-colonies-icons">'):
            escaped_parts.append(part)  # Don't escape icon spans
        else:
            escaped_parts.append(html.escape(part))
    lore_escaped = ''.join(escaped_parts)

    style_attrs = []
    if font_family:
        style_attrs.append(f'font="{font_family}"')
    if foreground:
        style_attrs.append(f'foreground="{foreground}"')
    if font_size:
        style_attrs.append(f'size="{font_size}"')
    style_str = ' '.join(style_attrs)

    return f'<markup><span {style_str}>{lore_escaped}</span></markup>'


def set_text_layer_markup(text_layer, markup):
    """Set the markup content of a GIMP text layer."""
    try:
        if hasattr(text_layer, 'set_markup'):
            text_layer.set_markup(markup)
            return True
    except Exception as e:
        log(f"  WARNING: Could not set text layer markup: {e}")
    return False


def update_xcf_file(filepath, csv_data):
    """
    Update the text layers in an XCF file with data from CSV.
    """
    filename = os.path.basename(filepath)
    card_id = extract_id_from_filename(filename)

    log(f"\nProcessing: {filename} (ID: {card_id})")

    gfile = Gio.File.new_for_path(filepath)
    img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, gfile)

    try:
        # Get existing layers and their styles
        textbox_text_rule = navigate_to_layer(img, ["card", "textbox", "textbox_text_rule"])
        textbox_text_lore = navigate_to_layer(img, ["card", "textbox", "textbox_text_lore"])

        if not textbox_text_rule and not textbox_text_lore:
            log(f"  ERROR: Could not find text layers")
            return False

        # Get styling from existing layers
        rule_font, rule_size, rule_fg = None, None, None
        lore_font, lore_size, lore_fg = None, None, None

        if textbox_text_rule:
            rule_font, rule_size, rule_fg = get_existing_markup_style(textbox_text_rule)
            log(f"  textbox_text_rule style: font={rule_font}, size={rule_size}, fg={rule_fg}")

        if textbox_text_lore:
            lore_font, lore_size, lore_fg = get_existing_markup_style(textbox_text_lore)
            log(f"  textbox_text_lore style: font={lore_font}, size={lore_size}, fg={lore_fg}")

        # Reconstruct markup
        rule_markup = reconstruct_textbox_text_rule_markup(
            csv_data['effect'],
            csv_data['tags'],
            csv_data['conditional_tags'],
            rule_font, rule_size, rule_fg
        )
        lore_markup = reconstruct_textbox_text_lore_markup(
            csv_data['lore'],
            lore_font, lore_size, lore_fg
        )

        log(f"  New textbox_text_rule markup: {rule_markup[:150]}...")
        log(f"  New textbox_text_lore markup: {lore_markup[:150]}...")

        # Update layers
        success = True
        if textbox_text_rule:
            if set_text_layer_markup(textbox_text_rule, rule_markup):
                log(f"  Updated textbox_text_rule")
            else:
                log(f"  FAILED to update textbox_text_rule")
                success = False

        if textbox_text_lore:
            if set_text_layer_markup(textbox_text_lore, lore_markup):
                log(f"  Updated textbox_text_lore")
            else:
                log(f"  FAILED to update textbox_text_lore")
                success = False

        # Save changes
        try:
            # Export the image to the original file path
            new_gfile = Gio.File.new_for_path(filepath)
            Gimp.file_save(Gimp.RunMode.NONINTERACTIVE, img, new_gfile)
            log(f"  Saved changes to {filepath}")
        except Exception as e:
            log(f"  ERROR: Failed to save {filepath}: {e}")
            success = False

        return success

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


def find_xcf_file_by_csv_id(base_dir, card_id):
    """
    Find the XCF file for a given CSV card ID.
    CSV ID format: "101" -> folder "1", file starting with "01_"
    CSV ID format: "205" -> folder "2", file starting with "05_"
    """
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


def extract_id_from_filename(filename):
    """Extract numeric ID from filename (before first '_')."""
    base = Path(filename).stem
    match = re.match(r'^(\d+)', base)
    if match:
        return match.group(1)
    return ""


def main():
    # Clear output file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("XCF Update Test Results\n")

    if len(sys.argv) < 3:
        log("Usage: test_update_xcf.py <xcf_dir> <cards_csv>")
        return

    xcf_dir = sys.argv[1]
    csv_path = sys.argv[2]

    # Find all XCF files in the test directory
    xcf_files = []
    for root, dirs, files in os.walk(xcf_dir):
        for f in files:
            if f.lower().endswith('.xcf'):
                xcf_files.append(os.path.join(root, f))

    log(f"Found {len(xcf_files)} XCF files in {xcf_dir}")

    # Extract file IDs from filenames (e.g., "01", "10", "05")
    # and map to CSV IDs (e.g., "101", "110", "205")
    file_to_csv_id = {}
    for filepath in xcf_files:
        file_id = extract_id_from_filename(filepath)
        # Find the folder prefix
        folder = os.path.basename(os.path.dirname(filepath))
        if folder.isdigit():
            csv_id = folder + file_id
            file_to_csv_id[filepath] = csv_id
        else:
            # For flat directories, use filename-based mapping
            filename = os.path.basename(filepath).lower()
            if 'quantentorpedos' in filename:
                file_to_csv_id[filepath] = '101'
            elif 'nanobot' in filename or 'wolke' in filename:
                file_to_csv_id[filepath] = '110'
            elif 'grosse' in filename or 'coup' in filename:
                file_to_csv_id[filepath] = '205'
            else:
                file_to_csv_id[filepath] = file_id

    csv_ids = list(file_to_csv_id.values())
    log(f"File to CSV ID mapping: {file_to_csv_id}")
    log(f"CSV IDs to load: {csv_ids}")

    # Load CSV data
    csv_data = load_csv_data(csv_path, csv_ids)
    log(f"Loaded {len(csv_data)} matching cards from CSV")

    # Update each file
    success_count = 0
    for filepath in xcf_files:
        csv_id = file_to_csv_id.get(filepath)
        if csv_id and csv_id in csv_data:
            if update_xcf_file(filepath, csv_data[csv_id]):
                success_count += 1
        else:
            file_id = extract_id_from_filename(filepath)
            log(f"  SKIP: No CSV data for file {os.path.basename(filepath)} (file_id={file_id}, csv_id={csv_id})")

    log(f"\nProcessed {success_count}/{len(xcf_files)} cards successfully")


if __name__ == "__main__":
    main()
