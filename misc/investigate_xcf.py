#!/usr/bin/env python3
"""
Investigate XCF text layer formatting.
"""

import sys
import os
import re
from pathlib import Path
from gi.repository import Gimp, Gio

OUTPUT_FILE = "/tmp/xcf_investigate_results.txt"


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
    try:
        if hasattr(layer, 'get_markup'):
            markup = layer.get_markup()
            if markup:
                return markup
    except Exception:
        pass
    return ""


def investigate_xcf_file(filepath):
    filename = os.path.basename(filepath)
    card_id = extract_id_from_filename(filename)

    with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
        f.write(f"\n{'='*60}\n")
        f.write(f"File: {filename} (ID: {card_id})\n")
        f.write(f"{'='*60}\n")

    gfile = Gio.File.new_for_path(filepath)
    img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, gfile)

    try:
        # Find textbox_text_rule
        textbox_text_rule = navigate_to_layer(img, ["card", "textbox", "textbox_text_rule"])
        if textbox_text_rule:
            markup = extract_text_from_layer(textbox_text_rule)
            with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
                f.write(f"\ntextbox_text_rule markup:\n{repr(markup)}\n")
                f.write(f"  Visible: {textbox_text_rule.get_visible()}\n")
        else:
            with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
                f.write("\ntextbox_text_rule: NOT FOUND\n")

        # Find textbox_text_lore
        textbox_text_lore = navigate_to_layer(img, ["card", "textbox", "textbox_text_lore"])
        if textbox_text_lore:
            markup = extract_text_from_layer(textbox_text_lore)
            with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
                f.write(f"\ntextbox_text_lore markup:\n{repr(markup)}\n")
                f.write(f"  Visible: {textbox_text_lore.get_visible()}\n")
        else:
            with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
                f.write("\ntextbox_text_lore: NOT FOUND\n")

        # List all layers in textbox
        textbox = navigate_to_layer(img, ["card", "textbox"])
        if textbox:
            with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
                f.write(f"\nAll layers in card/textbox:\n")
                for child in get_layer_children(textbox):
                    name = child.get_name() if hasattr(child, 'get_name') else 'unknown'
                    visible = child.get_visible() if hasattr(child, 'get_visible') else 'N/A'
                    f.write(f"  - {name} (visible: {visible})\n")

    finally:
        img.delete()


def main():
    # Clear output file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("XCF Investigation Results\n")

    if len(sys.argv) < 2:
        with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
            f.write("Usage: investigate_xcf.py <xcf_dir>\n")
        return

    xcf_dir = sys.argv[1]

    # Find all XCF files
    xcf_files = []
    for root, dirs, files in os.walk(xcf_dir):
        for f in files:
            if f.lower().endswith('.xcf'):
                xcf_files.append(os.path.join(root, f))

    with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
        f.write(f"Found {len(xcf_files)} XCF files\n\n")

    for filepath in sorted(xcf_files):
        investigate_xcf_file(filepath)


if __name__ == "__main__":
    main()
