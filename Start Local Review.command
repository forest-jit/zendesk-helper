#!/bin/zsh
# Start the local reviewer and open it in your usual browser.
ZDH_PROJECT_DIR="${0:A:h}"
cd -- "$ZDH_PROJECT_DIR" || exit 1
python3 scripts/local_review.py --open
