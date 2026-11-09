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

export interface ProductProsCons {
  product: string;
  pros: string[];
  cons: string[];
}

export interface ComparisonTableMetadata {
  type: 'comparison_table';
  products: string[];
  attributes: ComparisonAttribute[];
  highlights?: ProductProsCons[];
  recommendation?: string;
}

export interface ChatSessionSummary {
  session_token: string;
  session_id?: string;
  title: string;
  is_guest: boolean;
  updated_at: string;
  message_count: number;
}

export type ChatMetadataPayload = ProductCardsMetadata | ComparisonTableMetadata;

export type SSEMessageType = 'text_chunk' | 'metadata' | 'done' | 'error' | 'session';

export type SSEConnectionState =
  | 'idle'
  | 'connecting'
  | 'streaming_text'
  | 'receiving_metadata'
  | 'done'
  | 'error';

export interface SSEEventPacket {
  type: SSEMessageType;
  content?: string;
  payload?: ChatMetadataPayload;
  session_id?: string;
  session_token?: string;
  message?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: ChatMetadataPayload | null;
  createdAt: string;
  isStreaming?: boolean;
  streamState?: SSEConnectionState;
}

export interface SSEStreamCallbacks {
  onSession?: (session: { session_id: string; session_token: string }) => void;
  onTextChunk: (chunk: string) => void;
  onMetadata?: (payload: ChatMetadataPayload) => void;
  onStateChange?: (state: SSEConnectionState) => void;
  onDone?: () => void;
  onError?: (errorMessage: string) => void;
  onModeChange?: (isMockFallback: boolean) => void;
}
