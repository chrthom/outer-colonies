#!/usr/bin/env python3
"""Inspect the template XCF layer structure."""

from gi.repository import Gimp

img = Gimp.file_load("/home/christopher/Downloads/oc_work/template.xcf")

with open("/tmp/layer_structure.txt", "w") as f:
    def print_tree(layer, depth=0):
        indent = "  " * depth
        vis = "[V]" if layer.visible else "[H]"
        name = layer.name
        f.write(f"{indent}{name} {vis}\n")
        if hasattr(layer, "children"):
            for child in layer.children():
                print_tree(child, depth + 1)

    f.write("=== Template Layer Structure ===\n")
    for layer in reversed(img.layers()):
        print_tree(layer)

    # Also check for specific layers we need
    f.write("\n=== Looking for background group ===\n")
    for layer in img.layers():
        if "background" in layer.name.lower():
            f.write(f"Found: {layer.name}\n")
            if hasattr(layer, "children"):
                for child in layer.children():
                    f.write(f"  - {child.name}\n")

    f.write("\n=== Looking for card_border ===\n")
    for layer in img.layers():
        if "card_border" in layer.name.lower():
            f.write(f"Found: {layer.name}\n")

Gimp.quit(True)
