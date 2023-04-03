#!/bin/bash -e

# Walks the l10n folder structure and combines ftl files into single master file.
# This reduces the number of requests needed by a client.

PACKAGE=$1
FOLDER="public/locales"
PREFIX="[l10n/prime]"

if [ -z "$PACKAGE" ]; then
    echo "$PREFIX: A package must be defined as argument 1."
    exit 1
fi

# Move to monorepo root
cd "$(dirname "$0")/../.."
ROOT_FOLDER=$(pwd)

if [ ! -d "$ROOT_FOLDER/external/l10n/locale" ]; then
    echo "$PREFIX: No external/l10n folder exists! Run yarn l10n:clone script first."
    exit 1
fi

# Determine Target Folder
TARGET_FOLDER="packages/$PACKAGE/$FOLDER"

# Check if we've already primed
if [ -f "$ROOT_FOLDER/$TARGET_FOLDER/git-head.txt" ]; then

    target_head_rev=$(cat "$ROOT_FOLDER/$TARGET_FOLDER/git-head.txt")
    cd "$ROOT_FOLDER/external/l10n"
    current_head_rev=$(git rev-parse HEAD)

    # If the two values are the same, then we can exit early.
    if [ "$target_head_rev" == "$current_head_rev" ]; then
        echo "$PREFIX: Already primed with latest l10n files."
        exit 0
    else
        echo "$PREFIX: Primed l10n files are out of date. Updating..."
        cd "$ROOT_FOLDER"
    fi
else
    echo "$PREFIX: Priming l10n files..."
fi

# Check path is valid
rm -rf "$TARGET_FOLDER"
mkdir -p "$TARGET_FOLDER"

# Loop through all files and combine
cd "$ROOT_FOLDER/external/l10n/locale";
for d in */; do
    cd "$d";
    locale=$(echo $d | sed 's/_/-/' | sed 's/\/$//')
    count=$(ls | grep .ftl | wc -l)
    if [[ $((count)) == 0 ]]; then
        echo "$PREFIX: $locale has no .ftl files"
    else
        mkdir -p "$ROOT_FOLDER/$TARGET_FOLDER/$locale"
        cp *.ftl "$ROOT_FOLDER/$TARGET_FOLDER/$locale/"
    fi
    cd ..
done

# Record the current git version
cd "$ROOT_FOLDER/external/l10n"
git rev-parse HEAD > "$ROOT_FOLDER/$TARGET_FOLDER/git-head.txt"
