-- Function to generate username/password from member name and last_name
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

-- Function to automatically create user when member is inserted
CREATE OR REPLACE FUNCTION create_user_for_member()
RETURNS TRIGGER AS $$
DECLARE
  v_credentials VARCHAR;
BEGIN
  -- Generate credentials
  v_credentials := generate_member_credentials(NEW.name, NEW.last_name);
  
  -- Insert user with generated credentials
  INSERT INTO users (username, password, user_type, member_id)
  VALUES (v_credentials, v_credentials, 'user', NEW.id)
  ON CONFLICT (username) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create user when member is inserted
CREATE TRIGGER create_user_on_member_insert
  AFTER INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION create_user_for_member();

-- Function to update user credentials when member name/last_name changes
CREATE OR REPLACE FUNCTION update_user_credentials_on_member_update()
RETURNS TRIGGER AS $$
DECLARE
  v_new_credentials VARCHAR;
BEGIN
  -- Only update if name or last_name changed
  IF NEW.name != OLD.name OR NEW.last_name IS DISTINCT FROM OLD.last_name THEN
    v_new_credentials := generate_member_credentials(NEW.name, NEW.last_name);
    
    -- Update user credentials
    UPDATE users
    SET username = v_new_credentials,
        password = v_new_credentials
    WHERE member_id = NEW.id AND user_type = 'user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user credentials when member is updated
CREATE TRIGGER update_user_on_member_update
  AFTER UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credentials_on_member_update();
