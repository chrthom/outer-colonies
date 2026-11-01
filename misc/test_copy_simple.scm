; Simple test: copy layer between images

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

    ; Copy the background group layer
    (let ((copied-layer (car (gimp-layer-copy bg-group #f))))
      (gimp-message "Layer copied")

      ; Insert into target image at position 0
      (let ((new-layer (car (gimp-image-insert-layer target copied-layer 0 0))))
        (gimp-message "Layer inserted into target")

        ; Save
        (gimp-file-save RUN-NONINTERACTIVE target (car (gimp-file-new "/home/christopher/Downloads/oc_work/output/test_simple.xcf")))
        (gimp-message "Saved!"))))

    (gimp-image-delete template)
    (gimp-image-delete target)
    (gimp-quit #t)))

(main)
