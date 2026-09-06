#!/bin/bash

echo "=========================================="
echo "1) المسار الحالي (Current working directory)"
echo "=========================================="
pwd

echo ""
echo "=========================================="
echo "2) هل فيه package.json هنا؟ (يعني إحنا في جذر مشروع)"
echo "=========================================="
if [ -f "package.json" ]; then
  echo "أيوه، package.json موجود هنا."
  echo "اسم المشروع:"
  grep '"name"' package.json
else
  echo "مفيش package.json في المسار ده — يمكن مش إحنا في جذر المشروع."
fi

echo ""
echo "=========================================="
echo "3) شجرة المشروع (بدون node_modules و .git و .next)"
echo "=========================================="
if command -v tree >/dev/null 2>&1; then
  tree -I 'node_modules|.git|.next|dist|build' -L 4
else
  find . \
    -path "*/node_modules" -prune -o \
    -path "*/.git" -prune -o \
    -path "*/.next" -prune -o \
    -path "*/dist" -prune -o \
    -path "*/build" -prune -o \
    -print | sed 's|[^/]*/|  |g'
fi

