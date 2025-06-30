#!/bin/bash

set -e

# Kibana API endpoint
KIBANA_URL="http://localhost:5601"
# The NDJSON file containing the dashboard definition
DASHBOARD_FILE="kibana-dashboard.ndjson"

echo "Waiting for Kibana to be available..."
# Wait up to 2 minutes for Kibana to be up and running
for i in {1..24}; do
  if curl -s -o /dev/null -w "%{http_code}" "$KIBANA_URL/api/status" | grep -q "200"; then
    echo "Kibana is up!"
    break
  fi
  echo -n "."
  sleep 5
done

if ! curl -s -o /dev/null -w "%{http_code}" "$KIBANA_URL/api/status" | grep -q "200"; then
  echo "Kibana did not start in time. Exiting."
  exit 1
fi

echo "Importing Kibana objects..."

# Import the dashboard and its related objects
# The 'kbn-xsrf' header is required for write operations
response_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
     -H "kbn-xsrf: true" \
     --form file=@"$DASHBOARD_FILE")

if [ "$response_code" -eq 200 ]; then
  echo "✅ Dashboard import successful."
  echo "Access the working visualization at: $KIBANA_URL/app/visualize#/edit/stable-metric"
else
  echo "❌ Dashboard import failed with status code: $response_code"
  exit 1
fi 