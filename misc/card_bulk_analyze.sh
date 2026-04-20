#!/bin/bash
# Process all XCF files in subfolders 1-4 and merge results into a single CSV

# Usage: ./process_cards_bulk.sh [base_directory]
# Default base_directory: /home/christopher/Downloads/oc

BASE_DIR="$1"
OUTPUT_DIR="/home/christopher/Dokumente/outer-colonies/misc"
FINAL_CSV="${OUTPUT_DIR}/cards.csv"

# Clean up temporary files
rm -f "${OUTPUT_DIR}"/cards_*.csv

# Process each subfolder
echo "Processing XCF files from ${BASE_DIR}/1-4..."
for i in 1 2; do
    SUBFOLDER="${BASE_DIR}/${i}"
    if [ -d "$SUBFOLDER" ]; then
        echo "  Processing subfolder ${i}..."
        flatpak run org.gimp.GIMP --batch-interpreter=python-fu-eval -b \
            "import sys; sys.argv = ['process_cards.py', '${SUBFOLDER}']; exec(open('/home/christopher/Dokumente/outer-colonies/misc/process_cards.py').read())" 2>/dev/null
        
        # Copy result to temporary file
        if [ -f "${FINAL_CSV}" ]; then
            cp "${FINAL_CSV}" "${OUTPUT_DIR}/cards_${i}.csv"
            rm -f "${FINAL_CSV}"
        fi
    else
        echo "  Skipping subfolder ${i} (not found)"
    fi
done

# Merge all temporary CSVs
echo "Merging results..."
# Write header from first file
if [ -f "${OUTPUT_DIR}/cards_1.csv" ]; then
    head -1 "${OUTPUT_DIR}/cards_1.csv" > "${FINAL_CSV}"
    # Append data rows from all files (skip headers)
    for i in 1 2 3 4; do
        if [ -f "${OUTPUT_DIR}/cards_${i}.csv" ]; then
            tail -n +2 "${OUTPUT_DIR}/cards_${i}.csv" >> "${FINAL_CSV}"
        fi
    done
    echo "Wrote merged results to ${FINAL_CSV}"
    
    # Clean up temporary files
    rm -f "${OUTPUT_DIR}"/cards_*.csv
else
    echo "No CSV files found to merge"
fi
