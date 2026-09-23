import type { Cafe } from '@/domain/types';
import { CafeCard } from './CafeCard';

interface CafeListProps {
  cafes: Cafe[];
  onSelect: (cafeId: string) => void;
  selectedId: string | null;
  emptyHint: string;
}

export function CafeList({ cafes, onSelect, selectedId, emptyHint }: CafeListProps) {
  if (cafes.length === 0) {
    return (
      <div className="cw-list-empty" role="status" data-testid="list-empty">
        <h3>這個條件下沒有資料</h3>
        <p>{emptyHint}</p>
      </div>
    );
  }

  return (
    <ol
      className="cw-list"
      aria-label="咖啡廳清單"
      data-testid="cafe-list"
      data-count={cafes.length}
    >
      {cafes.map((cafe) => (
        <li key={cafe.id}>
          <CafeCard
            cafe={cafe}
            onSelect={onSelect}
            isSelected={cafe.id === selectedId}
          />
        </li>
      ))}
    </ol>
  );
}
