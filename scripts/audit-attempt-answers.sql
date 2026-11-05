-- Audit Script: Detect Suspicious or Tampered attempt_answer Records (Issue #45)
--
-- Safety Notice:
-- This script is strictly READ-ONLY. It never deletes or updates data.
-- Do NOT perform automated batch deletes on R2, as malicious keys may reference innocent users' audio.
--
-- How to run:
-- Local D1:
--   pnpm wrangler d1 execute DB --local --file=scripts/audit-attempt-answers.sql
-- Remote Production D1:
--   pnpm wrangler d1 execute DB --remote --file=scripts/audit-attempt-answers.sql

SELECT 
    aa.id AS answer_id,
    aa.attempt_id,
    a.user_id AS expected_user_id,
    aa.audio_key,
    aa.mime_type,
    CASE 
        WHEN aa.audio_key IS NULL OR aa.audio_key = '' THEN 'missing_audio_key'
        WHEN SUBSTR(aa.audio_key, 1, LENGTH('users/' || a.user_id || '/attempts/' || a.id || '/')) 
             <> ('users/' || a.user_id || '/attempts/' || a.id || '/') THEN 'mismatched_key_prefix'
        WHEN aa.audio_key LIKE '%..%' THEN 'path_traversal_key'
        WHEN aa.audio_key NOT LIKE '%.webm' 
             AND aa.audio_key NOT LIKE '%.mp4' 
             AND aa.audio_key NOT LIKE '%.ogg' 
             AND aa.audio_key NOT LIKE '%.wav' 
             AND aa.audio_key NOT LIKE '%.mp3' THEN 'disallowed_extension'
        ELSE 'valid_key'
    END AS key_status,
    CASE 
        WHEN aa.mime_type NOT IN ('audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg') 
             AND aa.mime_type NOT LIKE 'audio/webm;%' 
             AND aa.mime_type NOT LIKE 'audio/mp4;%' 
             AND aa.mime_type NOT LIKE 'audio/ogg;%' 
             AND aa.mime_type NOT LIKE 'audio/wav;%' 
             AND aa.mime_type NOT LIKE 'audio/mpeg;%' THEN 'unsupported_or_suspicious_mime'
        ELSE 'valid_mime'
    END AS mime_status,
    aa.created_at
FROM attempt_answer aa
INNER JOIN attempt a ON aa.attempt_id = a.id
WHERE 
    aa.audio_key IS NULL
    OR aa.audio_key = ''
    -- Key prefix does not match attempt owner / attemptId
    OR SUBSTR(aa.audio_key, 1, LENGTH('users/' || a.user_id || '/attempts/' || a.id || '/')) 
        <> ('users/' || a.user_id || '/attempts/' || a.id || '/')
    OR aa.audio_key LIKE '%..%'
    OR (
        aa.audio_key NOT LIKE '%.webm' 
        AND aa.audio_key NOT LIKE '%.mp4' 
        AND aa.audio_key NOT LIKE '%.ogg' 
        AND aa.audio_key NOT LIKE '%.wav' 
        AND aa.audio_key NOT LIKE '%.mp3'
    )
    -- Mime type is missing or outside the allowlist (ignoring codec parameters)
    OR aa.mime_type IS NULL
    OR aa.mime_type = ''
    OR (
        aa.mime_type NOT IN ('audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg')
        AND aa.mime_type NOT LIKE 'audio/webm;%'
        AND aa.mime_type NOT LIKE 'audio/mp4;%'
        AND aa.mime_type NOT LIKE 'audio/ogg;%'
        AND aa.mime_type NOT LIKE 'audio/wav;%'
        AND aa.mime_type NOT LIKE 'audio/mpeg;%'
    )
ORDER BY aa.created_at DESC;
