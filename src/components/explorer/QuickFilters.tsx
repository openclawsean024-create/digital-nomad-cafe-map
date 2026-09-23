import type { QuickChipId } from '@/domain/filter';
import { QUICK_CHIPS } from '@/domain/filter';

interface QuickFiltersProps {
  activeChip: QuickChipId | null;
  onToggle: (chipId: QuickChipId) => void;
}

export function QuickFilters({ activeChip, onToggle }: QuickFiltersProps) {
  return (
    <section className="cw-quick" aria-label="快速條件" data-testid="quick-filters">
      <div className="cw-quick-head">
        <h2>快速條件</h2>
        <p>沒勾也能查。勾了之後，未達門檻的咖啡廳會自動從結果中隱藏 — 尚未驗證的資料不會偽裝成符合。</p>
      </div>
      <div role="group" className="cw-chip-row" aria-label="常見工作條件">
        {QUICK_CHIPS.map((chip) => {
          const isActive = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              className={`cw-chip${isActive ? ' cw-chip--active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onToggle(chip.id)}
              data-testid={`chip-${chip.id}`}
              title={chip.description}
            >
              <span className="cw-chip-label">{chip.label}</span>
              <span className="cw-chip-desc">{chip.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
