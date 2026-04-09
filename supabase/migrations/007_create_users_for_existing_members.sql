-- First, ensure the function exists (in case migration 006 wasn't applied)
CREATE OR REPLACE FUNCTION generate_member_credentials(
  p_name VARCHAR,
  p_last_name VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
  first_name VARCHAR;
  first_last_name VARCHAR;
  credentials VARCHAR;
BEGIN
  -- Extract first name (first word from name)
  first_name := LOWER(TRIM(SPLIT_PART(p_name, ' ', 1)));
  
  -- Extract first last name (first word from last_name if exists)
  IF p_last_name IS NOT NULL AND p_last_name != '' THEN
    first_last_name := LOWER(TRIM(SPLIT_PART(p_last_name, ' ', 1)));
    credentials := first_name || first_last_name;
  ELSE
    credentials := first_name;
  END IF;
  
  RETURN credentials;
END;
$$ LANGUAGE plpgsql;

-- Create users for all existing members that don't have a user account yet
DO $$
DECLARE
  member_record RECORD;
  v_credentials VARCHAR;
BEGIN
  -- Loop through all members
  FOR member_record IN 
    SELECT m.id, m.name, m.last_name 
    FROM members m
    LEFT JOIN users u ON u.member_id = m.id
    WHERE u.id IS NULL  -- Only members without a user account
  LOOP
    -- Generate credentials using the function
    v_credentials := generate_member_credentials(member_record.name, member_record.last_name);
    
    -- Insert user with generated credentials
    INSERT INTO users (username, password, user_type, member_id)
    VALUES (v_credentials, v_credentials, 'user', member_record.id)
    ON CONFLICT (username) DO NOTHING;
    
    RAISE NOTICE 'Created user % for member %', v_credentials, member_record.name;
  END LOOP;
END $$;
