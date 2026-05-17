#!/usr/bin/env python3
"""
Process all XCF files in a directory and write visibility results to cards.csv.

Usage:
  flatpak run org.gimp.GIMP --batch-interpreter=python-fu-eval -b \
    'import sys; sys.argv = ["process_cards.py", "/path/to/cards/dir"]; \
     exec(open("/home/christopher/Dokumente/outer-colonies/misc/process_cards.py").read())'

CSV Output:
  id;type;title;effect;tags;lore;discipline;rarity;author;socket_a;socket_b;socket_d;socket_e;socket_f;socket_g;energy;speed;hull;armour;shield;abm;damage;control

Columns:
- ID: numeric part of filename before first "_"
- type: based on visible layer under card/header/header_left/header_left_icon
  * "Tactic" if header_left_icon_tactic is visible
  * "Orb" if header_left_icon_orb OR header_left_icon_moon is visible
  * "Equipment" if header_left_icon_equipment is visible
  * "Hull" if header_left_icon_hull OR header_left_icon_ship is visible
  * "Infrastructure" if header_left_icon_planetary OR header_left_icon_infrastructure is visible
- title: text from card/header/header_title/header title_text layer
- Effect: normal text from card/textbox/textbox_text_rule (non-italic parts)
- Tags: italic text from card/textbox/textbox_text_rule (italic parts)
- Lore: text from card/textbox/textbox_text_lore
- Discipline: text from card/textbox/textbox_tag/textbox_tag_text (only if textbox_tag group is visible)
- Rarity: highest visible rarity<value>_red layer (5-0), defaults to 0
- Author: text from card/footer/footer_illustration or card/footer-Kopie/footer_illustration
- Modules: from card/modules/module<1-7>/module?_text* mapped via visible module?_icon_<column>* layer
"""

import sys
import csv
import os
import re
import html
from pathlib import Path
from gi.repository import Gimp, Gio

# Discipline names for icon detection
DISCIPLINES = ["Information", "Wirtschaft", "Wissenschaft", "Militär"]

# Card types for icon detection
CARD_TYPES = ["tactic", "equipment", "hull", "infrastructure", "orb"]


def replace_icon_placeholders(text, card_type):
    """
    Replace sequences of 2-6 spaces with {ICON:type} placeholders.
    Uses heuristics to determine the icon type.

    Args:
        text: The text containing icon placeholders (multiple spaces)
        card_type: The card type (Tactic, Equipment, Hull, Infrastructure, Orb)

    Returns:
        Text with spaces replaced by {ICON:type} placeholders
    """
    if not text:
        return text

    # Find all sequences of 2-6 spaces
    # We need to process them in context to determine the type
    result = text

    # Pattern to find 2-6 spaces
    # We'll process the text character by character to get context
    i = 0
    result_parts = []
    last_pos = 0

    while i < len(text):
        if text[i] == ' ':
            # Find the end of the space sequence
            start = i
            while i < len(text) and text[i] == ' ' and (i - start) < 6:
                i += 1
            space_count = i - start

            if space_count >= 2:
                # Get context before and after
                before = text[max(0, start - 20):start]
                after = text[i:min(len(text), i + 20)]

                icon_type = determine_icon_type(before, after, card_type)
                result_parts.append(text[last_pos:start])
                # Ensure exactly one space before and after the placeholder
                placeholder = f" {{ICON:{icon_type}}} "
                result_parts.append(placeholder)
                last_pos = i
            else:
                i += 1
        else:
            i += 1

    result_parts.append(text[last_pos:])
    result = ''.join(result_parts)
    # Clean up double spaces that may have been created
    # (e.g., if there was already a space before/after the icon location)
    result = re.sub(r'  +', ' ', result)
    # Trim leading/trailing spaces
    return result.strip()


def determine_icon_type(before, after, card_type):
    """
    Determine the icon type based on context.

    Heuristics:
    - Discipline (Information, Wirtschaft, Wissenschaft, Militär) -> tactic
    - Multiplikator followed by discipline -> tactic
    - Multiplikator without discipline -> type?
    - Aktion followed by discipline -> tactic
    - Aktion with socket symbols (|, Δ, Θ, Ξ, Φ, Ψ, Ω) -> type?
    - N+ followed by spaces -> speed?
    - "-Karten" or "-Karte" -> hull (or one of the 5 types)
    - Special case: 139 -> equipment and abm
    - Otherwise -> ?
    """
    after_lower = after.lower()
    before_lower = before.lower()
    card_type_lower = card_type.lower()

    # Check if followed by a discipline
    for discipline in DISCIPLINES:
        if after.startswith(discipline):
            return "tactic"
        if after_lower.startswith(discipline.lower()):
            return "tactic"

    # Check for Multiplikator followed by discipline
    if "multiplikator" in before_lower or "aktion" in before_lower:
        for discipline in DISCIPLINES:
            if discipline.lower() in after_lower:
                return "tactic"

    # Check for Multiplikator without discipline
    if "multiplikator" in before_lower or "aktion" in before_lower:
        # Check if it's just parentheses or pipes
        if after.strip().startswith(('(', '|', 'Δ', 'Θ', 'Ξ', 'Φ', 'Ψ', 'Ω')):
            return "type?"
        return "type?"

    # Check for speed pattern (N+ followed by spaces)
    # Look for pattern like "1+    " or "2+    " or "3+    "
    speed_pattern = re.search(r'(\d+)\+\s*$', before)
    if speed_pattern or re.search(r'\d+\+', before):
        return "speed?"

    # Check for "-Karten" or "-Karte" pattern
    if "-karten" in after_lower or "-karte" in after_lower:
        return "hull"

    # Check for socket symbols in context
    socket_symbols = ['Δ', 'Θ', 'Ξ', 'Φ', 'Ψ', 'Ω', '|']
    for sym in socket_symbols:
        if sym in after or sym in before:
            return "type?"

    # Check for energy/damage/abm/shield/armour context
    # These are harder to detect, use generic ?
    return "?"


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
    """Extract plain text from a text layer using markup.
    Decodes HTML entities and strips HTML tags."""
    try:
        if hasattr(layer, 'get_markup'):
            markup = layer.get_markup()
            if markup:
                # Remove HTML tags
                text = re.sub(r'<[^>]+>', '', markup)
                # Decode HTML entities (e.g., &quot; -> ")
                return html.unescape(text)
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


def extract_effect_parts(layer):
    """Extract effect text, tags (italic part) and conditional_tags from a text layer.
    Returns (effect_text, tags_text, conditional_tags_text) tuple.
    Italic parts (wrapped in <i> tags) are extracted as tags.
    If there are multiple italic sections separated by normal text,
    the first italic section is tags, and subsequent ones are conditional_tags.
    """
    try:
        if hasattr(layer, 'get_markup'):
            markup = layer.get_markup()
            if markup:
                # Split by <i> and </i> tags to separate italic from normal text
                parts = re.split(r'(<i[^>]*>|</i>)', markup)
                normal_parts = []
                italic_parts = []
                in_italic = False
                for p in parts:
                    if p.startswith('<i') or p.startswith('</i'):
                        in_italic = p.startswith('<i')
                    elif in_italic:
                        italic_parts.append(p)
                    else:
                        normal_parts.append(p)
                # Join parts and strip HTML tags
                effect = re.sub(r'<[^>]+>', '', ''.join(normal_parts))
                all_italic = re.sub(r'<[^>]+>', '', ''.join(italic_parts))
                # Decode HTML entities
                effect = html.unescape(effect)
                all_italic = html.unescape(all_italic)

                # Check if we have the pattern: italic -> normal -> italic
                # This indicates conditional tags (tags, effect text, conditional_tags)
                # We need to check the original markup structure
                # Re-parse to get the sequence of content blocks
                content_blocks = []
                current_block = {'type': 'normal', 'text': ''}
                in_i = False
                for p in parts:
                    if p.startswith('<i'):
                        if current_block['text']:
                            content_blocks.append(current_block)
                        current_block = {'type': 'italic', 'text': ''}
                        in_i = True
                    elif p.startswith('</i'):
                        if current_block['text']:
                            content_blocks.append(current_block)
                        current_block = {'type': 'normal', 'text': ''}
                        in_i = False
                    else:
                        current_block['text'] += p
                if current_block['text']:
                    content_blocks.append(current_block)

                # Clean HTML tags from blocks
                for block in content_blocks:
                    block['text'] = re.sub(r'<[^>]+>', '', block['text'])

                # Check for pattern: italic, normal, italic
                if len(content_blocks) >= 3:
                    if (content_blocks[0]['type'] == 'italic' and
                        content_blocks[1]['type'] == 'normal' and
                        content_blocks[2]['type'] == 'italic'):
                        # First italic -> tags
                        tags = html.unescape(content_blocks[0]['text'])
                        # Normal -> effect
                        effect = html.unescape(content_blocks[1]['text'])
                        # Second italic -> conditional_tags
                        conditional_tags = html.unescape(content_blocks[2]['text'])
                        # If there are more blocks, append to conditional_tags
                        for block in content_blocks[3:]:
                            if block['type'] == 'italic':
                                conditional_tags += block['text']
                            else:
                                effect += block['text']
                        return effect.strip(), tags.strip(), conditional_tags.strip()

                # Default behavior: all italic -> tags, all normal -> effect
                return effect.strip(), all_italic.strip(), ""
    except Exception:
        pass
    return "", "", ""


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
    Only if textbox_tag group AND textbox_tag_text layer are visible.
    """
    textbox_tag = navigate_to_layer(img, ["card", "textbox", "textbox_tag"])
    if not textbox_tag:
        return ""

    # Check if the textbox_tag group itself is visible
    if not textbox_tag.get_visible():
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
    Returns highest visible value (5-0), defaults to 0.
    """
    rarity_group = navigate_to_layer(img, ["card", "rarity"])
    if not rarity_group:
        return "0"

    children = get_layer_children(rarity_group)
    child_names = {c.get_name(): c for c in children if hasattr(c, 'get_name')}

    # Check from highest (5) to lowest (0)
    for value in range(5, -1, -1):
        layer_name = f"rarity{value}_red"
        if layer_name in child_names and child_names[layer_name].get_visible():
            return str(value)

    return "0"


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
    """Replace newlines and tabs with spaces, strip leading/trailing whitespace.

    Preserves {ICON:...} placeholders.
    """
    if text:
        # Replace newlines and tabs with spaces
        text = text.replace('\n', ' ').replace('\t', ' ')
        # Collapse multiple spaces to single space, but preserve {ICON:...} placeholders
        # Split by {ICON:...} to handle them separately
        parts = re.split(r'(\{ICON:[^}]+\})', text)
        result = []
        for part in parts:
            if part.startswith('{ICON:') and part.endswith('}'):
                result.append(part)
            else:
                # Collapse multiple spaces in non-placeholder parts
                part = re.sub(r' +', ' ', part)
                result.append(part)
        text = ''.join(result)
        return text.strip()
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
        title = get_title(img)

        # Extract effect and tags (italic part) separately
        textbox_text_rule = navigate_to_layer(img, ["card", "textbox", "textbox_text_rule"])
        if textbox_text_rule and textbox_text_rule.get_visible():
            effect, tags, conditional_tags = extract_effect_parts(textbox_text_rule)
        else:
            effect = ""
            tags = ""
            conditional_tags = ""

        # Replace icon placeholders (multiple spaces) with {ICON:type} tokens
        # This must be done BEFORE sanitization to preserve the placeholders
        title = replace_icon_placeholders(title, card_type)
        effect = replace_icon_placeholders(effect, card_type)
        tags = replace_icon_placeholders(tags, card_type)
        conditional_tags = replace_icon_placeholders(conditional_tags, card_type)

        title = sanitize_text(title)
        effect = sanitize_text(effect)
        tags = sanitize_text(tags)
        conditional_tags = sanitize_text(conditional_tags)

        lore = sanitize_text(get_lore(img))
        discipline = sanitize_text(get_discipline(img))
        rarity = sanitize_text(get_rarity(img))
        author = sanitize_text(get_author(img))

        # Get modules data
        modules_data = get_modules_data(img)

        # Lowercase the card type
        card_type_lower = card_type.lower()

        # Get module values
        hull_val = modules_data.get('hull', '')
        armour_val = modules_data.get('armour', '')
        shield_val = modules_data.get('shield', '')
        abm_val = modules_data.get('abm', '')

        # Calculate damage_* columns: if value is negative, put it in damage_* column
        # and empty the positive column
        damage_abm = ''
        damage_shield = ''
        damage_armour = ''

        if abm_val and abm_val.startswith('-'):
            damage_abm = abm_val
            abm_val = ''
        if shield_val and shield_val.startswith('-'):
            damage_shield = shield_val
            shield_val = ''
        if armour_val and armour_val.startswith('-'):
            damage_armour = armour_val
            armour_val = ''

        print(f"  Result: type={card_type_lower}, title='{title}', effect={effect[:20]}..., tags={tags[:20]}..., conditional_tags={conditional_tags[:20]}..., lore={lore[:20]}..., discipline={discipline}, rarity={rarity}, author={author}")
        print(f"  Modules: {modules_data}")
        return (card_id, card_type_lower, title, effect, tags, conditional_tags, lore, discipline, rarity, author,
                modules_data.get('socket_a', ''), modules_data.get('socket_b', ''),
                modules_data.get('socket_d', ''), modules_data.get('socket_e', ''),
                modules_data.get('socket_f', ''), modules_data.get('socket_g', ''),
                modules_data.get('energy', ''), modules_data.get('speed', ''),
                hull_val, armour_val, shield_val, abm_val,
                modules_data.get('damage', ''), modules_data.get('control', ''),
                damage_abm, damage_shield, damage_armour)
        
    finally:
        img.delete()


def main():
    """Main function: process all XCF files in a directory and write CSV."""
    # Default directory
    cards_dir = "/home/christopher/Dokumente/outer-colonies/misc/cards"
    # Always write to ./misc/cards.csv
    output_csv = "/home/christopher/Dokumente/outer-colonies/misc/cards.csv"
    
    # Accept directory as first argument
    if len(sys.argv) > 1:
        cards_dir = sys.argv[1]
    
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
    # Use QUOTE_ALL to ensure fields with newlines/special chars are properly quoted
    with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile, delimiter=';', quoting=csv.QUOTE_ALL)
        writer.writerow(['id', 'type', 'title', 'effect', 'tags', 'conditional_tags', 'lore', 'discipline', 'rarity', 'author',
                         'socket_a', 'socket_b', 'socket_d', 'socket_e', 'socket_f', 'socket_g',
                         'energy', 'speed', 'hp', 'armour', 'shield', 'abm', 'damage', 'control',
                         'damage_abm', 'damage_shield', 'damage_armour'])
        for row in results:
            writer.writerow(row)
    
    print(f"\nWrote {len(results)} results to {output_csv}")


if __name__ == "__main__":
    main()
    # Quit GIMP by sending SIGTERM to parent process (GIMPInstance running this script)
    import os
    import signal
    try:
        os.kill(os.getppid(), signal.SIGTERM)
    except Exception:
        pass
