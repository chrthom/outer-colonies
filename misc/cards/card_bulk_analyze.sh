#!/bin/bash
# Process all XCF files in subfolders 1-5 and merge results into a single CSV
#
# Usage: ./card_bulk_analyze.sh <base_directory>
# The base directory must contain the edition subfolders 1-5 with the XCF files.

set -e

SCRIPT_PATH=`realpath "$0"`
SCRIPT_DIR=`dirname $SCRIPT_PATH`
FINAL_CSV="${SCRIPT_DIR}/cards.csv"

if [ "$#" -ne 1 ]; then
    echo "Illegal number of parameters"
    echo "Usage: card_bulk_analyze.sh BASE_DIRECTORY"
    exit 1
fi

BASE_DIR="$1"

# Clean up temporary files
rm -f "${SCRIPT_DIR}"/cards_*.csv

# Process each subfolder
echo "Processing XCF files from ${BASE_DIR}/1-5..."
for i in 1 2 3 4 5; do
    SUBFOLDER="${BASE_DIR}/${i}"
    if [ -d "$SUBFOLDER" ]; then
        echo "  Processing subfolder ${i}..."
        OC_CARDS_CSV="${FINAL_CSV}" flatpak run org.gimp.GIMP --batch-interpreter=python-fu-eval -b \
            "import sys; sys.argv = ['process_cards.py', '${SUBFOLDER}']; exec(open('${SCRIPT_DIR}/process_cards.py').read())" 2>/dev/null

        # Copy result to temporary file
        if [ -f "${FINAL_CSV}" ]; then
            cp "${FINAL_CSV}" "${SCRIPT_DIR}/cards_${i}.csv"
            rm -f "${FINAL_CSV}"
        fi
    else
        echo "  Skipping subfolder ${i} (not found)"
    fi
done

# Merge all temporary CSVs
echo "Merging results..."
# Write header from first file
if [ -f "${SCRIPT_DIR}/cards_1.csv" ]; then
    head -1 "${SCRIPT_DIR}/cards_1.csv" > "${FINAL_CSV}"
    # Append data rows from all files (skip headers)
    for i in 1 2 3 4 5; do
        if [ -f "${SCRIPT_DIR}/cards_${i}.csv" ]; then
            tail -n +2 "${SCRIPT_DIR}/cards_${i}.csv" >> "${FINAL_CSV}"
        fi
    done
    echo "Wrote merged results to ${FINAL_CSV}"

    # Clean up temporary files
    rm -f "${SCRIPT_DIR}"/cards_*.csv
else
    echo "No CSV files found to merge"
fi
