// Augment Vitest's expect with @testing-library/jest-dom matchers.
// Without this, TypeScript can't see .toBeDisabled() / .toHaveTextContent() etc.
import '@testing-library/jest-dom';
