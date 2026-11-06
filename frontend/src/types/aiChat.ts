export interface ProductCardItem {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  price: number;
  original_price?: number | null;
  discount_percent?: number | null;
  category?: string;
  in_stock?: boolean;
  variant_id?: string | null;
}

export interface ProductCardsMetadata {
  type: 'product_cards';
  products: ProductCardItem[];
}

export interface ComparisonAttribute {
  name: string;
  values: string[];
}

export interface ComparisonTableMetadata {
  type: 'comparison_table';
  products: string[];
  attributes: ComparisonAttribute[];
  recommendation?: string;
}

export type ChatMetadataPayload = ProductCardsMetadata | ComparisonTableMetadata;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: ChatMetadataPayload | null;
  createdAt: string;
  isStreaming?: boolean;
}

export interface SSEStreamCallbacks {
  onSession?: (session: { session_id: string; session_token: string }) => void;
  onTextChunk: (chunk: string) => void;
  onMetadata?: (payload: ChatMetadataPayload) => void;
  onDone?: () => void;
  onError?: (errorMessage: string) => void;
  onModeChange?: (isMockFallback: boolean) => void;
}

