-- Add matching_existing_content column to track related existing content
ALTER TABLE opportunity_insights ADD COLUMN matching_existing_content TEXT;

-- Add blog_post column for AI-generated blog post drafts
ALTER TABLE opportunity_insights ADD COLUMN blog_post TEXT;
