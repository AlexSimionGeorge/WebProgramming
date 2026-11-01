CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name  text NOT NULL,
  role          text NOT NULL CHECK (role IN ('centerAdmin', 'player')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
