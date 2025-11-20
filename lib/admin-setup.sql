-- Create admin table if it doesn't exist
CREATE TABLE IF NOT EXISTS its_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default admin if not exists
INSERT INTO its_admin (email, password, name, role)
VALUES ('admin@moe.gov.gy', 'password', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;
