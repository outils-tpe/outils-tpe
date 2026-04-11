#!/bin/sh
# auto-backup.sh — Sauvegarde git automatique avant chaque Edit/Write
# Déclenché par le hook PreToolUse de Claude Code

# Vérifier qu'on est dans un dépôt git
git rev-parse --git-dir > /dev/null 2>&1 || exit 0

# Vérifier s'il y a des modifications non commitées (staged ou unstaged ou untracked)
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  git add -A
  git commit -m "Sauvegarde auto avant modification" --quiet 2>/dev/null || true
fi

# Ne jamais bloquer l'action
exit 0
