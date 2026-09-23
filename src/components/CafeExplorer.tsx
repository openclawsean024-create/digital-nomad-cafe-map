'use client';

/**
 * Public explorer entry. The implementation lives in
 * src/components/explorer/CafeExplorerView.tsx to keep the file size small
 * and the sub-components independently testable. The split also keeps the
 * home page bundle (which only references this file) free of the legacy
 * Stage 5 admin / paywall / verify UI.
 */
import CafeExplorerView from './explorer/CafeExplorerView';

export default CafeExplorerView;
