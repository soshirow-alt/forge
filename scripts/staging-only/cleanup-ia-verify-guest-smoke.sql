-- STAGING ONLY — delete Cursor guest-FB smoke rows (not seed).
-- Target: vuqpwvjvgyxffmvpfrxo
-- Safe: only rows matching the smoke marker or known smoke id.

DELETE FROM public.project_guest_feedback
WHERE id = 'f4ff4018-a857-4170-b26f-1cff92a80b84'::uuid
   OR coalesce(good_points, '') LIKE '%[ia-verify-smoke]%'
   OR coalesce(concerns, '') LIKE '%[ia-verify-smoke]%'
   OR coalesce(other_notes, '') LIKE '%[ia-verify-smoke]%';

-- Confirm seed guests remain (expect 7):
-- SELECT count(*) FROM public.project_guest_feedback
-- WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%';
