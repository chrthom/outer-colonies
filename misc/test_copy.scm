; Minimal test to copy a layer between images using clipboard copy/paste

(define (main)
  (let* ((template (car (gimp-file-load RUN-NONINTERACTIVE "/home/christopher/Downloads/oc_work/template.xcf" "/home/christopher/Downloads/oc_work/template.xcf")))
         (target (car (gimp-file-load RUN-NONINTERACTIVE "/home/christopher/Downloads/oc_work/1/01_quantentorpedos.xcf" "/home/christopher/Downloads/oc_work/1/01_quantentorpedos.xcf")))
         (bg-group (car (gimp-image-get-layer-by-name template "background"))))

    (gimp-message "Template and target loaded")

    ; Remove old background from target
    (let ((old-bg (car (gimp-image-get-layer-by-name target "background"))))
      (if old-bg
          (gimp-image-remove-layer target old-bg)))

    (gimp-message "Old background removed")

    ; Create a new layer in target with same dimensions as bg-group
    (let* ((width (gimp-drawable-get-width bg-group))
           (height (gimp-drawable-get-height bg-group))
           (new-layer (car (gimp-layer-new target width height RGBA-IMAGE "background-new" 100 NORMAL-MODE))))

      (gimp-image-insert-layer target new-layer 0 0)

      ; Now copy contents from bg-group to new-layer using clipboard
      (gimp-image-set-active-layer template bg-group)
      (gimp-edit-copy bg-group)

      (gimp-image-set-active-layer target new-layer)
      (let ((floating (car (gimp-edit-paste new-layer #f))))
        (gimp-floating-sel-anchor floating))

      (gimp-message "Background copied via clipboard!")

      ; Save the result
      (gimp-file-save RUN-NONINTERACTIVE target (car (gimp-file-new "/home/christopher/Downloads/oc_work/output/01_quantentorpedos.xcf")))
      (gimp-message "Saved!"))

    (gimp-image-delete template)
    (gimp-image-delete target)
    (gimp-quit #t)))

(main)
