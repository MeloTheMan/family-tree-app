-- Create relationships table
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  related_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('parent', 'child', 'spouse')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_relationship UNIQUE(member_id, related_member_id, relationship_type),
  CONSTRAINT no_self_relationship CHECK (member_id != related_member_id)
);

-- Create indexes for faster relationship queries
CREATE INDEX idx_relationships_member_id ON relationships(member_id);
CREATE INDEX idx_relationships_related_member_id ON relationships(related_member_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);

-- Create composite index for common query patterns
CREATE INDEX idx_relationships_member_type ON relationships(member_id, relationship_type);
