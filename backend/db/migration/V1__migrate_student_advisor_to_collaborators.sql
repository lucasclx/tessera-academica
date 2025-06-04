-- Migrate legacy student/advisor columns to document_collaborators table
-- Create collaborator rows for existing student_id and advisor_id values
INSERT INTO document_collaborators (document_id, user_id, role, permission, added_at, active)
SELECT d.id, d.student_id, 'PRIMARY_STUDENT', 'FULL_ACCESS', NOW(), true
FROM documents d
WHERE d.student_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM document_collaborators c
    WHERE c.document_id = d.id AND c.user_id = d.student_id
);

INSERT INTO document_collaborators (document_id, user_id, role, permission, added_at, active)
SELECT d.id, d.advisor_id, 'PRIMARY_ADVISOR', 'FULL_ACCESS', NOW(), true
FROM documents d
WHERE d.advisor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM document_collaborators c
    WHERE c.document_id = d.id AND c.user_id = d.advisor_id
);

-- Remove legacy columns
ALTER TABLE documents DROP COLUMN IF EXISTS student_id;
ALTER TABLE documents DROP COLUMN IF EXISTS advisor_id;
