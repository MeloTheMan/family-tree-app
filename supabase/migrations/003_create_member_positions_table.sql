-- Create member_positions table to store custom layout positions
CREATE TABLE IF NOT EXISTS member_positions (
  member_id UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  position_x DOUBLE PRECISION NOT NULL,
  position_y DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_member_positions_member_id ON member_positions(member_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_member_position_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_update_member_position_timestamp
BEFORE UPDATE ON member_positions
FOR EACH ROW
EXECUTE FUNCTION update_member_position_timestamp();
