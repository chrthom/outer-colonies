; Test using gimp-layer-new-from-drawable

(define (main)
  (let* ((template (car (gimp-file-load RUN-NONINTERACTIVE "/home/christopher/Downloads/oc_work/template.xcf" "/home/christopher/Downloads/oc_work/template.xcf")))
         (target (car (gimp-file-load RUN-NONINTERACTIVE "/home/christopher/Downloads/oc_work/1/01_quantentorpedos.xcf" "/home/christopher/Downloads/oc_work/1/01_quantentorpedos.xcf")))
         (bg-group (car (gimp-image-get-layer-by-name template "background"))))

    (gimp-message "Loaded images")

    ; Remove old background from target
    (let ((old-bg (car (gimp-image-get-layer-by-name target "background"))))
      (if old-bg
          (gimp-image-remove-layer target old-bg)))

    (gimp-message "Removed old background")

    ; Create new layer from the drawable (bg-group)
    ; gimp-layer-new-from-drawable takes: image, drawable, name, x, y, width, height, type, opacity, mode
    (let* ((width (gimp-drawable-get-width bg-group))
           (height (gimp-drawable-get-height bg-group))
           (new-layer (car (gimp-layer-new-from-drawable target bg-group "background-new" 0 0 width height RGBA-IMAGE 100 NORMAL-MODE))))

      (gimp-message "New layer from drawable created")

      ; Insert into target
      (gimp-image-insert-layer target new-layer 0 0)
      (gimp-message "Layer inserted")

      ; Save
      (gimp-file-save RUN-NONINTERACTIVE target (car (gimp-file-new "/home/christopher/Downloads/oc_work/output/test_new_from_drawable.xcf")))
      (gimp-message "Saved!")))

    (gimp-image-delete template)
    (gimp-image-delete target)
    (gimp-quit #t)))

(main)
