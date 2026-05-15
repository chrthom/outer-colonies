#!/usr/bin/env python3
"""Test copying layers between images using GIMP Python API."""

import sys
sys.path.insert(0, '/usr/lib/gimp/3.0/python')

from gi.repository import Gimp, Gio
from gi.repository.GLib import Bytes

Gimp.main([sys.argv[0]])

try:
    # Open template
    template_file = Gio.File.new_for_path("/home/christopher/Downloads/oc_work/template.xcf")
    template = Gimp.File.load(template_file, None)
    print(f"Template loaded: {template}")

    # Open target
    target_file = Gio.File.new_for_path("/home/christopher/Downloads/oc_work/1/01_quantentorpedos.xcf")
    target = Gimp.File.load(target_file, None)
    print(f"Target loaded: {target}")

    # Get background group from template
    bg_group = template.get_layer_by_name("background")
    print(f"Background group: {bg_group}")

    # Remove old background from target
    old_bg = target.get_layer_by_name("background")
    if old_bg:
        target.remove_layer(old_bg)
        print("Old background removed")

    # Try approach: Create a new layer and copy drawable contents
    width = bg_group.get_width()
    height = bg_group.get_height()
    new_layer = Gimp.Layer.new(target, f"background-copy", width, height, Gimp.ImageType.RGBA_IMAGE, 100, Gimp.NormalMode)
    target.insert_layer(new_layer, 0, 0)
    print(f"New layer created: {new_layer}")

    # Try to copy contents using drawable copy
    # First, make bg_group the active layer
    template.set_active_layer(bg_group)

    # Use the PDB to copy the drawable
    pdb = Gimp.get_pdb()
    copy_proc = pdb.lookup_procedure("gimp-drawable-copy-contents")
    print(f"Copy procedure: {copy_proc}")

    # Try gimp-edit-copy followed by gimp-edit-paste
    # But this requires the layer to be in the same image...

    # Alternative: Use gimp-layer-new-from-drawable
    new_from_drawable_proc = pdb.lookup_procedure("gimp-layer-new-from-drawable")
    print(f"New from drawable procedure: {new_from_drawable_proc}")

    if new_from_drawable_proc:
        # This creates a new layer from a drawable, but it needs to be in the same image
        # Let's try: add bg_group to target temporarily, then copy it
        # Actually, we can use gimp-layer-copy which returns a copy
        copy_proc2 = pdb.lookup_procedure("gimp-layer-copy")
        print(f"Layer copy procedure: {copy_proc2}")

        # gimp-layer-copy takes a layer and a boolean (add_alpha)
        # Returns the new layer ID
        copied_layer = pdb.call_procedure("gimp-layer-copy", bg_group, False)
        print(f"Copied layer: {copied_layer}")

        # Now insert into target
        insert_proc = pdb.lookup_procedure("gimp-image-insert-layer")
        print(f"Insert layer procedure: {insert_proc}")

        # gimp-image-insert-layer takes: image, layer, parent, position
        result = pdb.call_procedure("gimp-image-insert-layer", target, copied_layer, None, 0)
        print(f"Insert result: {result}")

    # Save target
    output_file = Gio.File.new_for_path("/home/christopher/Downloads/oc_work/output/test_copy.xcf")
    Gimp.File.save(target, output_file, None)
    print("Saved!")

    # Cleanup
    del template
    del target

finally:
    Gimp.quit(True)
