CREATE TABLE games (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
  host_account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  finished_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE game_seats (
  game_id    uuid NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  seat_index smallint NOT NULL CHECK (seat_index BETWEEN 1 AND 4),
  account_id uuid REFERENCES accounts (id) ON DELETE CASCADE,
  status     text NOT NULL CHECK (status IN ('empty', 'invited', 'filled')),
  PRIMARY KEY (game_id, seat_index),
  CHECK ((status = 'empty') = (account_id IS NULL))
);

CREATE UNIQUE INDEX game_seats_one_seat_per_account_idx ON game_seats (game_id, account_id)
  WHERE account_id IS NOT NULL;
CREATE INDEX game_seats_account_idx ON game_seats (account_id) WHERE account_id IS NOT NULL;

CREATE TABLE game_sets (
  game_id   uuid NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  set_index smallint NOT NULL CHECK (set_index BETWEEN 1 AND 5),
  team_a    smallint NOT NULL CHECK (team_a BETWEEN 0 AND 15),
  team_b    smallint NOT NULL CHECK (team_b BETWEEN 0 AND 15),
  PRIMARY KEY (game_id, set_index)
);

INSERT INTO games (booking_id, host_account_id, created_at)
SELECT id, player_account_id, created_at FROM bookings WHERE cancelled_at IS NULL;

INSERT INTO game_seats (game_id, seat_index, account_id, status)
SELECT games.id,
       seat_index,
       CASE WHEN seat_index = 1 THEN games.host_account_id END,
       CASE WHEN seat_index = 1 THEN 'filled' ELSE 'empty' END
  FROM games
 CROSS JOIN generate_series(1, 4) AS seat_index;
