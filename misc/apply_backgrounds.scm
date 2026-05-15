; Scheme script to apply backgrounds to Edition 1-4 cards
; Uses GIMP's Scheme PDB (Script-Fu)

(define (get-card-type card-id)
  (cond
   ((string=? card-id "101") 'hull)
   ((string=? card-id "102") 'equipment)
   ((string=? card-id "103") 'tactic)
   ((string=? card-id "104") 'infrastructure)
   ((string=? card-id "105") 'orb)
   (else 'hull)))

(define (get-discipline card-id)
  (cond
   ((string=? card-id "103") "Information")
   ((string=? card-id "104") "Wirtschaft")
   (else "")))

(define (get-tags card-id)
  (cond
   ((string=? card-id "104") "Planetar")
   (else "")))

(define (get-stat card-id stat)
  0)

(define (string-contains? str substr)
  (string-contains str substr))

(define (determine-bg-layer card-id)
  (let* ((type (get-card-type card-id))
         (discipline (get-discipline card-id))
         (tags (get-tags card-id)))
    (cond
     ((and (eq? type 'infrastructure) (string-contains? tags "Planetar")) "infrastructure_planetary_bg")
     ((and (eq? type 'infrastructure) (> (get-stat card-id 'energy) 0)) "infrastructure_energy_bg")
     ((eq? type 'infrastructure) "infrastructure_others_bg")
     ((and (eq? type 'equipment) (> (get-stat card-id 'damage) 0)) "equipment_weapon_bg")
     ((and (eq? type 'equipment) (or (> (get-stat card-id 'abm) 0) (> (get-stat card-id 'shield) 0) (> (get-stat card-id 'armour) 0))) "equipment_defense_bg")
     ((eq? type 'equipment) "equipment_others_bg")
     ((and (eq? type 'tactic) (string=? discipline "Information")) "tactic_intelligence_bg")
     ((and (eq? type 'tactic) (string=? discipline "Militär")) "tactic_military_bg")
     ((and (eq? type 'tactic) (string=? discipline "Wirtschaft")) "tactic_trade_bg")
     ((and (eq? type 'tactic) (string=? discipline "Wissenschaft")) "tactic_science_bg")
     ((eq? type 'hull) "hull_bg")
     ((eq? type 'orb) "orb_bg")
     (else ""))))

(define (hide-all-children layer)
  (let loop ((children (gimp-layer-get-children layer)))
    (if (not (null? children))
        (begin
          (gimp-layer-set-visible (car children) FALSE)
          (loop (cdr children))))))

(define (process-card xcf-path card-id template-img)
  (let* ((target-img (car (gimp-file-load RUN-NONINTERACTIVE xcf-path xcf-path)))
         (bg-layer-name (determine-bg-layer card-id)))
    (if (string-null? bg-layer-name)
        (begin
          (gimp-image-delete target-img)
          #f))

    (gimp-message (string-append "Processing " card-id ": " bg-layer-name))

    (let* ((bg-group (car (gimp-image-get-layer-by-name template-img "background")))
           (card-border (car (gimp-image-get-layer-by-name template-img "card_border"))))

      (if (not bg-group)
          (begin
            (gimp-message "ERROR: Template missing background group")
            (gimp-image-delete target-img)
            #f))

      (if (not card-border)
          (begin
            (gimp-message "ERROR: Template missing card_border layer")
            (gimp-image-delete target-img)
            #f))

      ; Remove old background layer from target
      (let ((old-bg (car (gimp-image-get-layer-by-name target-img "background"))))
        (if old-bg
            (gimp-image-remove-layer target-img old-bg)))

      ; Copy background group from template
      (let* ((copied-bg (car (gimp-layer-copy bg-group FALSE)))
             (new-bg (car (gimp-image-insert-layer target-img copied-bg 0 0))))

        ; Copy card_border from template (at top)
        (let* ((copied-border (car (gimp-layer-copy card-border FALSE)))
               (new-border (car (gimp-image-insert-layer target-img copied-border 0 -1))))

          ; Find background_types group in the copied background
          (let* ((bg-types-group (car (gimp-image-get-layer-by-name new-bg "background_types"))))
            (if bg-types-group
                (begin
                  ; Hide all children of background_types
                  (hide-all-children bg-types-group)

                  ; Show the correct background layer
                  (let ((target-bg (car (gimp-image-get-layer-by-name bg-types-group bg-layer-name))))
                    (if target-bg
                        (gimp-layer-set-visible target-bg TRUE)
                        (gimp-message (string-append "WARNING: Background layer " bg-layer-name " not found"))))

                  ; Save XCF
                  (let* ((basename (car (string-split xcf-path "/")))
                         (output-xcf (string-append "/home/christopher/Downloads/oc_work/output/" basename)))
                    (make-directory "/home/christopher/Downloads/oc_work/output/")
                    (gimp-file-save RUN-NONINTERACTIVE target-img (car (gimp-file-new output-xcf)))

                    ; Export PNG
                    (let* ((output-png (string-append "/home/christopher/Downloads/oc_work/output/" (car (string-split basename ".")) ".png")))
                      (gimp-file-export RUN-NONINTERACTIVE target-img (car (gimp-image-get-active-layer target-img)) (car (gimp-file-new output-png)) "PNG"))

                    (gimp-message (string-append "Saved: " output-xcf))
                    #t)
                  #f)))
            #f)))
        #f))
      #f))
    #f))

(define (main)
  (let* ((template-path "/home/christopher/Downloads/oc_work/template.xcf")
         (template-img (car (gimp-file-load RUN-NONINTERACTIVE template-path template-path))))
    ; Process first few test cards
    (process-card "/home/christopher/Downloads/oc_work/1/01_quantentorpedos.xcf" "101" template-img)
    (process-card "/home/christopher/Downloads/oc_work/1/02_photonentorpedos.xcf" "102" template-img)
    (process-card "/home/christopher/Downloads/oc_work/1/03_ionenkanone.xcf" "103" template-img)
    (gimp-image-delete template-img)
    (gimp-quit TRUE)))

(main)
