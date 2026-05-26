; Test using gimp-drawable-copy-contents to copy pixels directly

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

    ; Create a new layer in target with same dimensions
    (let* ((width (gimp-drawable-get-width bg-group))
           (height (gimp-drawable-get-height bg-group))
           (new-layer (car (gimp-layer-new target width height RGBA-IMAGE "background-new" 100 NORMAL-MODE))))

      (gimp-image-insert-layer target new-layer 0 0)
      (gimp-message "New layer created")

      ; Copy contents from bg-group to new-layer
      (gimp-drawable-copy-contents bg-group new-layer)
      (gimp-message "Contents copied")

      ; Save
      (gimp-file-save RUN-NONINTERACTIVE target (car (gimp-file-new "/home/christopher/Downloads/oc_work/output/test_direct.xcf")))
      (gimp-message "Saved!")))

    (gimp-image-delete template)
    (gimp-image-delete target)
    (gimp-quit #t)))

(main)
