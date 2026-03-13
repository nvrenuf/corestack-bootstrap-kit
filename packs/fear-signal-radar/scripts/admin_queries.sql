-- Latest runs by topic
SELECT topic_id, run_id, started_at, finished_at, status
FROM public.radar_runs
ORDER BY topic_id, started_at DESC;

-- Counts per platform for the last 7 days
SELECT platform, COUNT(*) AS signal_count
FROM public.signal_items
WHERE collected_at >= now() - interval '7 days'
GROUP BY platform
ORDER BY signal_count DESC;

-- Duplicate rate estimate by hash density over the last 7 days
SELECT
  COUNT(*) AS total_rows,
  COUNT(DISTINCT hash) AS distinct_hashes,
  CASE
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND((COUNT(*) - COUNT(DISTINCT hash))::numeric / COUNT(*)::numeric, 4)
  END AS duplicate_rate
FROM public.signal_items
WHERE collected_at >= now() - interval '7 days';

-- Daily volume for the last 7 days
SELECT date_trunc('day', collected_at) AS day, COUNT(*) AS signal_count
FROM public.signal_items
WHERE collected_at >= now() - interval '7 days'
GROUP BY day
ORDER BY day DESC;
