#!/bin/bash
# ─────────────────────────────────────────────
# 5 Stacks — Workshop Signal Sources
# ─────────────────────────────────────────────
# Reddit RSS feeds to find SME owners talking about
# rising costs, margins, operational efficiency.
# These are posts Cat can respond to helpfully
# before posting the workshop promo.
#
# Run after Airlock server is running on localhost:3577.

TOKEN="airlock-service-token-change-me"
USER_ID="961185f3-18db-43d1-bd9a-bb95196dfca7"
BASE="http://localhost:3577/api/signals/sources"

# ════════════════════════════════════════════
#  r/smallbusiness — Rising costs & margins
# ════════════════════════════════════════════

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/smallbusiness - rising costs", "config": {"subreddit": "smallbusiness", "sort": "relevance", "query": "rising costs margins shrinking expenses"}}'

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/smallbusiness - energy costs", "config": {"subreddit": "smallbusiness", "sort": "relevance", "query": "energy costs utility bills electricity gas"}}'

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/smallbusiness - operational costs", "config": {"subreddit": "smallbusiness", "sort": "relevance", "query": "operational costs overhead reduce expenses"}}'

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/smallbusiness - profit margins", "config": {"subreddit": "smallbusiness", "sort": "relevance", "query": "profit margins eroding losing money costs"}}'

# ════════════════════════════════════════════
#  r/Entrepreneur — Cost pressure & efficiency
# ════════════════════════════════════════════

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/Entrepreneur - rising costs", "config": {"subreddit": "Entrepreneur", "sort": "relevance", "query": "rising costs inflation margins expenses"}}'

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/Entrepreneur - operational efficiency", "config": {"subreddit": "Entrepreneur", "sort": "relevance", "query": "operational efficiency reduce waste costs"}}'

# ════════════════════════════════════════════
#  r/manufacturing — Cost pressure
# ════════════════════════════════════════════

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/manufacturing - costs", "config": {"subreddit": "manufacturing", "sort": "relevance", "query": "costs rising energy materials margins"}}'

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/manufacturing - efficiency", "config": {"subreddit": "manufacturing", "sort": "relevance", "query": "operational efficiency waste reduction cost per unit"}}'

# ════════════════════════════════════════════
#  r/operations — Direct target audience
# ════════════════════════════════════════════

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/operations - new", "config": {"subreddit": "operations", "sort": "new"}}'

# ════════════════════════════════════════════
#  r/logistics — Fuel & transport costs
# ════════════════════════════════════════════

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/logistics - fuel costs", "config": {"subreddit": "logistics", "sort": "relevance", "query": "fuel costs rising diesel gas prices margins"}}'

# ════════════════════════════════════════════
#  r/foodindustry — Food production costs
# ════════════════════════════════════════════

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "r/foodindustry - costs", "config": {"subreddit": "foodindustry", "sort": "relevance", "query": "costs rising ingredient energy packaging margins"}}'

# ════════════════════════════════════════════
#  Cross-subreddit — Inflation & price pressure
# ════════════════════════════════════════════

curl -s -X POST $BASE \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "reddit_rss", "label": "SME inflation pressure", "config": {"subreddit": "smallbusiness+Entrepreneur+manufacturing", "sort": "relevance", "query": "inflation prices going up can not afford costs"}}'

echo ""
echo "Done! 5 Stacks workshop signal sources configured."
echo "Run the pipeline: curl -X POST http://localhost:3577/api/cron/run-pipeline -H 'Authorization: Bearer \$TOKEN'"
