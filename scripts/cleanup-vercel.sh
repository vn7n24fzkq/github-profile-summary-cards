#!/bin/bash

# Vercel Cleanup Script
# Requires: Vercel CLI via `npm i -g vercel`
# Usage: ./cleanup-vercel.sh

# fetch deployment IDs/URLs from JSON output and remove each one explicitly by ID.
set -euo pipefail

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is required but not installed. Please install it first."
    exit 1
fi

echo "Fetching deployments..."

# Ensure we are logged in
vercel whoami > /dev/null || exit 1

# Get project name
PROJECT_NAME=$(basename "$PWD")

echo "Targeting Project: $PROJECT_NAME (Staging/Preview only)"

# List deployments in JSON format to be safe
# Using -y to auto confirm
# List deployments for the project, filtering for Preview environment (staging)
# Note: Vercel CLI `ls` operates on the project linked in .vercel, providing project name just filters by name string match if used, 
# but best practice is to rely on the current directory's link.
echo "Listing staging deployments..."
deployments_json=$(vercel ls --environment=preview --meta-key=target --meta-value=staging --json)

# Parse IDs using jq
deployment_ids=$(echo "$deployments_json" | jq -r '.deployments[].uid')

if [ -z "$deployment_ids" ]; then
    echo "No staging/preview deployments found."
    exit 0
fi

count=$(echo "$deployment_ids" | wc -l | xargs)
echo "Found $count deployment(s) to remove."

echo ""
read -p "Are you sure you want to delete these $count deployments? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo "Removing deployments..."

# Loop and remove each deployment by ID
for id in $deployment_ids; do
    echo "Removing $id..."
    vercel remove "$id" --yes
done

echo "Done."

echo "Done."
