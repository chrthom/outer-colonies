#!/usr/bin/env python3
"""
Process all XCF files in a directory and write visibility results to cards.csv.

Usage:
  flatpak run org.gimp.GIMP --batch-interpreter python-fu-eval -i -b \
    'import sys; sys.argv = ["process_cards.py", "/path/to/cards/dir"]; \
     exec(open("/home/christopher/Dokumente/outer-colonies/misc/cards/process_cards.py").read())'

CSV Output:
  id;type;title;effect;lore;discipline;rarity;author;socket_a;socket_b;socket_d;socket_e;socket_f;socket_g;energy;speed;hull;armour;shield;abm;damage;control
  
Columns:
- ID: numeric part of filename before first "_"
- type: based on visible layer under card/header/header_left/header_left_icon
  * "Tactic" if header_left_icon_tactic is visible
  * "Orb" if header_left_icon_orb OR header_left_icon_moon is visible
  * "Equipment" if header_left_icon_equipment is visible
  * "Hull" if header_left_icon_hull OR header_left_icon_ship is visible
  * "Infrastructure" if header_left_icon_planetary OR header_left_icon_infrastructure is visible
- title: text from card/header/header_title/header title_text layer
- Effect: text from card/textbox/textbox_text_rule
- Lore: text from card/textbox/textbox_text_lore
- Discipline: text from card/textbox/textbox_tag/textbox_tag_text (only if visible)
- Rarity: highest visible rarity<value>_red layer (5-1)
- Author: text from card/footer/footer_illustration or card/footer-Kopie/footer_illustration
- Modules: from card/modules/module<1-7>/module?_text* mapped via visible module?_icon_<column>* layer
"""

import sys
import csv
import os
import re
from pathlib import Path
from gi.repository import Gimp, Gio


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
                return re.sub(r'<[^>]+>', '', markup)
    except Exception:
        pass
    return ""


def get_type(header_left_icon):
    """
    Determine type based on visible layer in header_left_icon group.
    Stops at first visible layer found.
    """
    TYPE_RULES = [
        ("Tactic", ["header_left_icon_tactic"]),
        ("Orb", ["header_left_icon_orb", "header_left_icon_moon"]),
        ("Equipment", ["header_left_icon_equipment"]),
        ("Hull", ["header_left_icon_hull", "header_left_icon_ship"]),
        ("Infrastructure", ["header_left_icon_planetary", "header_left_icon_infrastructure"]),
    ]
    
    children = get_layer_children(header_left_icon)
    child_names = {c.get_name(): c for c in children if hasattr(c, 'get_name')}
    
    for type_name, layer_names in TYPE_RULES:
        for layer_name in layer_names:
            if layer_name in child_names and child_names[layer_name].get_visible():
                return type_name
    
    # No visible layer found - report what exists
    all_expected = [ln for _, names in TYPE_RULES for ln in names]
    existing = [ln for ln in all_expected if ln in child_names]
    visible = [n for n, l in child_names.items() if l.get_visible()]
    
    raise ValueError(
        f"No visible type layer in header_left_icon. "
        f"Expected one of: {all_expected}. Found: {list(child_names.keys())}. "
        f"Visible: {visible}"
    )


def get_title(img):
    """Extract title text from card/header/header_title/header title_text."""
    header_title = navigate_to_layer(img, ["card", "header", "header_title"])
    if not header_title:
        return ""
    
    children = get_layer_children(header_title)
    possible_names = ["header title_text", "header_title_text", "header-title_text", "text", "title_text"]
    
    for name in possible_names:
        matching = [c for c in children if hasattr(c, 'get_name') and c.get_name() == name]
        if matching:
            text = extract_text_from_layer(matching[0])
            if text:
                return text
    
    text_layers = [c for c in children if hasattr(c, 'is_text_layer') and c.is_text_layer()]
    for tl in text_layers:
        text = extract_text_from_layer(tl)
        if text:
            return text
    
    return ""


def get_effect(img):
    """Extract effect text from card/textbox/textbox_text_rule."""
    textbox_text_rule = navigate_to_layer(img, ["card", "textbox", "textbox_text_rule"])
    if textbox_text_rule and textbox_text_rule.get_visible():
        return extract_text_from_layer(textbox_text_rule)
    return ""


def get_lore(img):
    """Extract lore text from card/textbox/textbox_text_lore."""
    textbox_text_lore = navigate_to_layer(img, ["card", "textbox", "textbox_text_lore"])
    if textbox_text_lore and textbox_text_lore.get_visible():
        return extract_text_from_layer(textbox_text_lore)
    return ""


def get_discipline(img):
    """
    Extract discipline text from card/textbox/textbox_tag/textbox_tag_text.
    Only if textbox_tag_text layer is visible.
    """
    textbox_tag = navigate_to_layer(img, ["card", "textbox", "textbox_tag"])
    if not textbox_tag:
        return ""
    
    textbox_tag_text = navigate_to_layer(img, ["card", "textbox", "textbox_tag", "textbox_tag_text"])
    if textbox_tag_text and textbox_tag_text.get_visible():
        return extract_text_from_layer(textbox_tag_text)
    
    # Fallback: search children of textbox_tag
    for child in get_layer_children(textbox_tag):
        if child.get_name() == "textbox_tag_text" and child.get_visible():
            return extract_text_from_layer(child)
    
    return ""


def get_rarity(img):
    """
    Determine rarity from card/rarity/rarity<value>_red layers.
    Returns highest visible value (5-1).
    """
    rarity_group = navigate_to_layer(img, ["card", "rarity"])
    if not rarity_group:
        return ""
    
    children = get_layer_children(rarity_group)
    child_names = {c.get_name(): c for c in children if hasattr(c, 'get_name')}
    
    # Check from highest (5) to lowest (1)
    for value in range(5, 0, -1):
        layer_name = f"rarity{value}_red"
        if layer_name in child_names and child_names[layer_name].get_visible():
            return str(value)
    
    return ""


def get_author(img):
    """
    Extract author text from card/footer/footer_illustration
    or card/footer-Kopie/footer_illustration.
    """
    for footer_name in ["footer", "footer-Kopie"]:
        footer = navigate_to_layer(img, ["card", footer_name])
        if not footer:
            continue
        
        footer_illustration = navigate_to_layer(img, ["card", footer_name, "footer_illustration"])
        if footer_illustration:
            text = extract_text_from_layer(footer_illustration)
            if text:
                return text
        
        # Fallback: search children of footer
        for child in get_layer_children(footer):
            if "illustration" in child.get_name().lower():
                text = extract_text_from_layer(child)
                if text:
                    return text
    
    return ""


def get_modules_data(img):
    """Extract module data from card/modules/module<1-7> groups.
    
    For each module group, finds visible module?_text* layer and maps its text
    to a column based on the visible module?_icon_<column> layer in the icons group.
    Only one text layer and one icons group per module. Column name is extracted
    from icon layer name: text after '_icon_' up to first space, hyphen, or end.
    Raises ValueError if a column is assigned twice.
    """
    column_names = ['socket_a', 'socket_b', 'socket_d', 'socket_e',
                    'socket_f', 'socket_g', 'energy', 'speed',
                    'hull', 'armour', 'shield', 'abm',
                    'damage', 'control']
    result = {col: None for col in column_names}
    
    modules_group = navigate_to_layer(img, ['card', 'modules'])
    if not modules_group:
        return result
    
    # Skip all modules if the modules group itself is not visible
    if not modules_group.get_visible():
        return result
    
    # Pre-compile patterns
    text_pattern = re.compile(r'^module._text')
    icons_pattern = re.compile(r'^module._icons')
    icon_pattern = re.compile(r'^module._icon_')
    
    for i in range(1, 8):
        module_group = navigate_to_layer(img, ['card', 'modules', f'module{i}'])
        if not module_group:
            continue
        
        # Skip this module if the module group itself is not visible
        if not module_group.get_visible():
            continue
        
        # Find visible text layer matching module?_text*
        text_layer = None
        for child in get_layer_children(module_group):
            name = child.get_name()
            if child.get_visible() and text_pattern.match(name):
                text_layer = child
                break
        
        if not text_layer:
            continue
        
        # Find icons group matching module?_icons*
        icons_group = None
        for child in get_layer_children(module_group):
            name = child.get_name()
            if icons_pattern.match(name):
                icons_group = child
                break
        
        if not icons_group:
            continue
        
        # Find visible icon layer in icons_group
        icon_layer = None
        for child in get_layer_children(icons_group):
            name = child.get_name()
            if child.get_visible() and icon_pattern.match(name):
                icon_layer = child
                break
        
        if not icon_layer:
            continue
        
        # Extract column name: text after '_icon_' up to first ' ', '-', or end
        rest = icon_layer.get_name().split('_icon_', 1)[1]
        column_name = re.split(r'[ -]', rest)[0]
        
        if column_name not in result:
            continue
        
        text = extract_text_from_layer(text_layer)
        
        if result[column_name] is not None:
            raise ValueError(
                f'Module conflict: column {column_name} already assigned. '
                f'Module {i}: text="{text}", existing="{result[column_name]}"'
            )
        
        result[column_name] = text
    
    return result


def sanitize_text(text):
    """Replace newlines and multiple spaces with single spaces."""
    if text:
        return re.sub(r'\s+', ' ', text).strip()
    return ""


def process_file(filepath, folder_prefix=""):
    """Process a single XCF file and return row data as tuple."""
    filename = os.path.basename(filepath)
    
    # Extract ID
    card_id = extract_id_from_filename(filename)
    if not card_id:
        print(f"  SKIP: No ID in filename {filename}")
        return None
    
    # Prepend folder prefix to ID (e.g., "2" + "68" = "268")
    if folder_prefix and folder_prefix.isdigit():
        card_id = folder_prefix + card_id
    
    print(f"  Processing {filename} (ID={card_id})...")
    
    # Load XCF
    gfile = Gio.File.new_for_path(filepath)
    img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, gfile)
    
    try:
        # Determine type
        card_type = ""
        header_left_icon = navigate_to_layer(img, ["card", "header", "header_left", "header_left_icon"])
        if header_left_icon:
            try:
                card_type = get_type(header_left_icon)
            except ValueError as e:
                print(f"  WARNING: Could not determine type: {e}")
                card_type = ""
        else:
            print(f"  WARNING: header_left_icon group not found")
        
        # Get and sanitize all text fields
        title = sanitize_text(get_title(img))
        effect = sanitize_text(get_effect(img))
        lore = sanitize_text(get_lore(img))
        discipline = sanitize_text(get_discipline(img))
        rarity = sanitize_text(get_rarity(img))
        author = sanitize_text(get_author(img))
        
        # Get modules data
        modules_data = get_modules_data(img)
        
        print(f"  Result: type={card_type}, title='{title}', effect={effect[:20]}..., lore={lore[:20]}..., discipline={discipline}, rarity={rarity}, author={author}")
        print(f"  Modules: {modules_data}")
        return (card_id, card_type, title, effect, lore, discipline, rarity, author,
                modules_data.get('socket_a', ''), modules_data.get('socket_b', ''),
                modules_data.get('socket_d', ''), modules_data.get('socket_e', ''),
                modules_data.get('socket_f', ''), modules_data.get('socket_g', ''),
                modules_data.get('energy', ''), modules_data.get('speed', ''),
                modules_data.get('hull', ''), modules_data.get('armour', ''),
                modules_data.get('shield', ''), modules_data.get('abm', ''),
                modules_data.get('damage', ''), modules_data.get('control', ''))
        
    finally:
        img.delete()


def main():
    """Main function: process all XCF files in a directory and write CSV."""
    # Default directory
    cards_dir = "/home/christopher/Dokumente/outer-colonies/misc/cards"
    output_csv = "/home/christopher/Dokumente/outer-colonies/misc/cards.csv"
    
    # Accept directory as first argument
    if len(sys.argv) > 1:
        cards_dir = sys.argv[1]
    # Always write to ./misc/cards.csv
    output_csv = "/home/christopher/Dokumente/outer-colonies/misc/cards.csv"
    
    # Get all XCF files (excluding scripts)
    xcf_files = sorted([
        os.path.join(cards_dir, f) 
        for f in os.listdir(cards_dir) 
        if f.lower().endswith('.xcf') and os.path.isfile(os.path.join(cards_dir, f))
    ])
    
    print(f"Found {len(xcf_files)} XCF files in {cards_dir}\n")
    
    # Extract folder prefix (basename of cards_dir if it's a numbered folder)
    folder_prefix = os.path.basename(os.path.normpath(cards_dir))
    
    # Process each file
    results = []
    for filepath in xcf_files:
        try:
            result = process_file(filepath, folder_prefix)
            if result:
                results.append(result)
        except Exception as e:
            print(f"  ERROR: {e}")
    
    # Write CSV with semicolon delimiter
    with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile, delimiter=';')
        writer.writerow(['id', 'type', 'title', 'effect', 'lore', 'discipline', 'rarity', 'author',
                         'socket_a', 'socket_b', 'socket_d', 'socket_e', 'socket_f', 'socket_g',
                         'energy', 'speed', 'hull', 'armour', 'shield', 'abm', 'damage', 'control'])
        for row in results:
            writer.writerow(row)
    
    print(f"\nWrote {len(results)} results to {output_csv}")


if __name__ == "__main__":
    main()
    try:
        from gimp import pdb
        pdb.gimp_quit(0)
    except ImportError:
        try:
            app = Gimp.Application.get_instance()
            app.quit()
        except Exception:
            pass
