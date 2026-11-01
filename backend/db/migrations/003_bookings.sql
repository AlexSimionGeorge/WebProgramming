CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id          uuid NOT NULL REFERENCES courts (id) ON DELETE CASCADE,
  player_account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  booking_date      date NOT NULL,
  starts_at         time NOT NULL,
  ends_at           time NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  cancelled_at      timestamptz,
  CHECK (starts_at < ends_at),
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    court_id WITH =,
    tsrange(booking_date + starts_at, booking_date + ends_at) WITH &&
  ) WHERE (cancelled_at IS NULL)
);

CREATE INDEX bookings_player_idx ON bookings (player_account_id, booking_date);
CREATE INDEX bookings_date_idx ON bookings (booking_date);
