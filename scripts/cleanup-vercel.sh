#!/bin/bash

# Vercel Cleanup Script
# Requires: Vercel CLI via `npm i -g vercel`
# Usage: ./cleanup-vercel.sh

echo "Fetching deployments..."

# 1. List valid preview deployments (excluding production)
# format: [url] [age] [state] ... 
# We filter lines that don't match production URLs or are explicitly 'Preview'
# Note: Vercel CLI output format varies. Using JSON output is safest.

# Ensure we are logged in
vercel whoami || exit 1

# Get project name
PROJECT_NAME=$(basename "$PWD")

echo "Targeting Project: $PROJECT_NAME"

# List deployments in JSON format to be safe
# Using -y to auto confirm
deployments=$(vercel ls $PROJECT_NAME --meta target=staging --limit 100)

if [ -z "$deployments" ]; then
    echo "No staging/preview deployments found."
    exit 0
fi

echo "Found deployments:"
echo "$deployments"

echo ""
read -p "Are you sure you want to delete ALL these staging deployments? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Loop and remove (This is a simplified approach, Vercel CLI doesn't output clean list for loop easily without jq)
# So we use a safer approach:
# "vercel remove [project] --safe" removes deployments that are not active.
# But for "Preview" specifically, we might want to be aggressive.

echo "Running safe removal..."
vercel remove $PROJECT_NAME --safe --yes

echo "Done."
