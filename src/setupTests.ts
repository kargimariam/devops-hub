import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock fetch globally so tests don't fail on relative URLs
global.fetch = vi.fn();
