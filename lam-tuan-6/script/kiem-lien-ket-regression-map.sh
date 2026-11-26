#!/usr/bin/env bash
# Kiểm từng link "file#Ldòng" trong docs/regression-map.md (link ghim commit 711a22e) còn trỏ đúng dòng trên main hay không.
# Chạy trong một bản clone của repo pos-cafe đã fetch origin/docs và origin/main:
#   bash kiem-lien-ket-regression-map.sh <thư mục lưu kết quả>
# Ghi: <thư mục>/rm-links-check.tsv với cột ID, FILE, L_OLD, LINE_OLD, STATUS (SAME_LINE / MOVED / NOT_FOUND / FILE_MISSING), L_NEW
set -euo pipefail
OUT="${1:?Thiếu thư mục lưu kết quả}"
OLD=711a22e71983e3d6aa17799649af05ce4c762555
mkdir -p "$OUT"
git show origin/docs:docs/regression-map.md > "$OUT/regression-map.md"
grep -oE '^\| (FR|NFR)-[0-9]+|blob/'"$OLD"'/[^)#]+#L[0-9]+' "$OUT/regression-map.md" \
  | awk '/^\|/{id=substr($0,3);next}{sub("blob/'"$OLD"'/","");split($0,a,"#L");print id"\t"a[1]"\t"a[2]}' > "$OUT/rm-links.tsv"
printf "ID\tFILE\tL_OLD\tLINE_OLD\tSTATUS\tL_NEW\n" > "$OUT/rm-links-check.tsv"
while IFS=$'\t' read -r id f l; do
  old=$(git show "$OLD:$f" 2>/dev/null | sed -n "${l}p" | sed 's/^[[:space:]]*//' | cut -c1-110)
  if ! git cat-file -e "origin/main:$f" 2>/dev/null; then st="FILE_MISSING"; nl="-"
  else
    newl=$(git show "origin/main:$f" | sed -n "${l}p" | sed 's/^[[:space:]]*//' | cut -c1-110)
    if [ "$newl" = "$old" ]; then st="SAME_LINE"; nl=$l
    else nl=$(git show "origin/main:$f" | grep -nF -- "$old" | head -1 | cut -d: -f1)
      if [ -n "$nl" ]; then st="MOVED"; else st="NOT_FOUND"; nl="-"; fi
    fi
  fi
  printf "%s\t%s\t%s\t%s\t%s\t%s\n" "$id" "$f" "$l" "$old" "$st" "$nl" >> "$OUT/rm-links-check.tsv"
done < "$OUT/rm-links.tsv"
rm -f "$OUT/rm-links.tsv" "$OUT/regression-map.md"
cut -f5 "$OUT/rm-links-check.tsv" | tail -n +2 | sort | uniq -c
