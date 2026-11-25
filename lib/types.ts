export interface Artwork {
  id: string
  title: string
  description: string
  image_url: string
  starting_price: number
  current_price: number
  is_active: boolean
  created_at: string
}

export interface Bid {
  id: string
  artwork_id: string
  bidder_name: string
  amount: number
  created_at: string
}

export interface AuctionConfig {
  id: number
  end_time: string | null
  is_running: boolean
}
