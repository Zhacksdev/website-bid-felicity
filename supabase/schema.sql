-- =============================================================
-- Felicity Vol. 4 — Art Auction Schema
-- Jalankan ini di Supabase SQL Editor
-- =============================================================

-- Artworks
CREATE TABLE IF NOT EXISTS artworks (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT        NOT NULL,
  description     TEXT        DEFAULT '',
  image_url       TEXT        DEFAULT '',
  starting_price  INTEGER     NOT NULL DEFAULT 0,
  current_price   INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Bids
CREATE TABLE IF NOT EXISTS bids (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id  UUID        NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  bidder_name TEXT        NOT NULL,
  amount      INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auction config (single row — id always 1)
CREATE TABLE IF NOT EXISTS auction_config (
  id          INTEGER     PRIMARY KEY DEFAULT 1,
  end_time    TIMESTAMPTZ,
  is_running  BOOLEAN     DEFAULT false,
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO auction_config (id, end_time, is_running)
VALUES (1, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Atomic bid function (prevents race conditions)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION place_bid(
  p_artwork_id  UUID,
  p_bidder_name TEXT,
  p_amount      INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_price INTEGER;
  v_is_active     BOOLEAN;
  v_bid_id        UUID;
BEGIN
  SELECT current_price, is_active
    INTO v_current_price, v_is_active
    FROM artworks
   WHERE id = p_artwork_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Karya tidak ditemukan');
  END IF;

  IF NOT v_is_active THEN
    RETURN json_build_object('error', 'Lelang untuk karya ini sudah ditutup');
  END IF;

  IF p_amount <= v_current_price THEN
    RETURN json_build_object(
      'error',
      'Bid harus lebih tinggi dari harga saat ini: Rp ' || to_char(v_current_price, 'FM999G999G999')
    );
  END IF;

  INSERT INTO bids (artwork_id, bidder_name, amount)
  VALUES (p_artwork_id, p_bidder_name, p_amount)
  RETURNING id INTO v_bid_id;

  UPDATE artworks SET current_price = p_amount WHERE id = p_artwork_id;

  RETURN json_build_object('success', true, 'bid_id', v_bid_id);
END;
$$;

-- ----------------------------------------------------------------
-- Disable RLS (simple event site — admin ops use service role key)
-- ----------------------------------------------------------------
ALTER TABLE artworks      DISABLE ROW LEVEL SECURITY;
ALTER TABLE bids          DISABLE ROW LEVEL SECURITY;
ALTER TABLE auction_config DISABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Enable Realtime
-- Buka Supabase Dashboard → Database → Replication → enable tables,
-- ATAU jalankan SQL berikut (jika gagal, aktifkan manual di dashboard):
-- ----------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE artworks;
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE auction_config;
