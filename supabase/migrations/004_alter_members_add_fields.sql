-- Add new fields to members table
ALTER TABLE members 
ADD COLUMN last_name VARCHAR(255),
ADD COLUMN work VARCHAR(255),
ADD COLUMN age INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN birth_date IS NOT NULL 
    THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::INTEGER
    ELSE NULL
  END
) STORED;

-- Add index on last_name for faster searches
CREATE INDEX idx_members_last_name ON members(last_name);

-- Add comment to explain the age column
COMMENT ON COLUMN members.age IS 'Automatically calculated from birth_date';
