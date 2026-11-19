CREATE TABLE friendships (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  addressee_account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  status               text NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  accepted_at          timestamptz,
  CHECK (requester_account_id <> addressee_account_id),
  CHECK ((status = 'accepted') = (accepted_at IS NOT NULL))
);

CREATE UNIQUE INDEX friendships_one_per_pair_idx ON friendships (
  LEAST(requester_account_id, addressee_account_id),
  GREATEST(requester_account_id, addressee_account_id)
);
CREATE INDEX friendships_requester_idx ON friendships (requester_account_id);
CREATE INDEX friendships_addressee_idx ON friendships (addressee_account_id);
