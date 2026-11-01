CREATE TABLE centers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_account_id uuid NOT NULL UNIQUE REFERENCES accounts (id) ON DELETE CASCADE,
  name             text NOT NULL,
  address          text NOT NULL,
  city             text NOT NULL,
  slot_minutes     smallint NOT NULL CHECK (slot_minutes IN (60, 90, 120)),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE courts (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES centers (id) ON DELETE CASCADE,
  name      text NOT NULL,
  position  integer NOT NULL CHECK (position >= 1),
  UNIQUE (center_id, position)
);

CREATE TABLE opening_intervals (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES centers (id) ON DELETE CASCADE,
  weekday   smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  opens_at  time NOT NULL,
  closes_at time NOT NULL,
  CHECK (opens_at < closes_at)
);

CREATE INDEX opening_intervals_center_weekday_idx ON opening_intervals (center_id, weekday);
