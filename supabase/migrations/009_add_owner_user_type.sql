-- Add 'owner' to the user_type enum
-- First, we need to add the new value to the enum type

-- Add 'owner' to user_type enum
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'owner';

-- Add a comment to explain the owner role
COMMENT ON TYPE user_type IS 'User types: admin (full access), owner (manage nuclear family), user (view only)';

