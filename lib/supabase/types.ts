// TypeScript 介面 給 API routes 用
export interface Review {
  id: string;
  cafe_id: string;
  user_id: string;
  rating: number; // 1-5
  content: string;
  photos: string[];
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  cafe_id?: string | null;
  review_id?: string | null;
  user_id: string;
  reason: 'spam' | 'fake' | 'off_topic' | 'other';
  notes?: string | null;
  created_at: string;
}

export interface ReportPayload {
  cafeId?: string;
  reviewId?: string;
  reason: 'spam' | 'fake' | 'off_topic' | 'other';
  notes?: string;
}
