; Minimal test

(gimp-message "Starting...")
(let ((img (car (gimp-file-load RUN-NONINTERACTIVE "/home/christopher/Downloads/oc_work/1/01_quantentorpedos.xcf" "/home/christopher/Downloads/oc_work/1/01_quantentorpedos.xcf"))))
  (gimp-message "Image loaded")
  (gimp-file-save RUN-NONINTERACTIVE img (car (gimp-file-new "/home/christopher/Downloads/oc_work/output/test_minimal2.xcf")))
  (gimp-message "Saved")
  (gimp-image-delete img)
(gimp-quit #t)
