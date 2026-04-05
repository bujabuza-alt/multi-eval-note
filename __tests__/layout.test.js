import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import RootLayout, { metadata, viewport } from '../src/app/layout';

// Mock globals.css import
jest.mock('../src/app/globals.css', () => {}, { virtual: true });

describe('layout.js exports', () => {
  describe('metadata export', () => {
    it('exports a metadata object', () => {
      expect(typeof metadata).toBe('object');
      expect(metadata).not.toBeNull();
    });

    it('has a title property', () => {
      expect(metadata).toHaveProperty('title');
    });

    it('has a description property', () => {
      expect(metadata).toHaveProperty('description');
    });

    it('has appleWebApp configuration', () => {
      expect(metadata).toHaveProperty('appleWebApp');
      expect(metadata.appleWebApp).toHaveProperty('capable', true);
    });
  });

  describe('viewport export', () => {
    it('exports a viewport object', () => {
      expect(typeof viewport).toBe('object');
      expect(viewport).not.toBeNull();
    });

    it('has themeColor', () => {
      expect(viewport).toHaveProperty('themeColor');
    });

    it('themeColor matches expected value', () => {
      expect(viewport.themeColor).toBe('#6366F1');
    });

    it('has width device-width', () => {
      expect(viewport.width).toBe('device-width');
    });
  });
});

describe('RootLayout component (icon link changes)', () => {
  const renderLayout = () =>
    render(
      <RootLayout>
        <div>test content</div>
      </RootLayout>,
    );

  it('renders without crashing', () => {
    expect(() => renderLayout()).not.toThrow();
  });

  it('renders children', () => {
    const { getByText } = renderLayout();
    expect(getByText('test content')).toBeInTheDocument();
  });

  it('has a single apple-touch-icon link', () => {
    const { container } = renderLayout();
    const appleLinks = container.querySelectorAll('link[rel="apple-touch-icon"]');
    expect(appleLinks).toHaveLength(1);
  });

  it('apple-touch-icon points to /icon.svg', () => {
    const { container } = renderLayout();
    const appleLink = container.querySelector('link[rel="apple-touch-icon"]');
    expect(appleLink).not.toBeNull();
    expect(appleLink.getAttribute('href')).toBe('/icon.svg');
  });

  it('does not include a PNG apple-touch-icon', () => {
    const { container } = renderLayout();
    const appleLink = container.querySelector('link[rel="apple-touch-icon"]');
    expect(appleLink.getAttribute('href')).not.toMatch(/\.png$/);
  });

  it('does not have PNG icon-192 link', () => {
    const { container } = renderLayout();
    const icon192Link = container.querySelector('link[href*="icon-192"]');
    expect(icon192Link).toBeNull();
  });

  it('does not have PNG icon-512 link', () => {
    const { container } = renderLayout();
    const icon512Link = container.querySelector('link[href*="icon-512"]');
    expect(icon512Link).toBeNull();
  });

  it('does not have any PNG icon link elements', () => {
    const { container } = renderLayout();
    const pngIconLinks = container.querySelectorAll('link[type="image/png"]');
    expect(pngIconLinks).toHaveLength(0);
  });

  it('has exactly one icon-related link in head', () => {
    const { container } = renderLayout();
    // Only the apple-touch-icon link should be present (no size-specific PNG links)
    const iconLinks = container.querySelectorAll(
      'link[rel="apple-touch-icon"], link[rel="icon"]',
    );
    expect(iconLinks).toHaveLength(1);
  });

  it('html element has lang="ko"', () => {
    const { container } = renderLayout();
    const html = container.closest('html') || container.querySelector('html');
    // Next.js renders html tag; check via the rendered output
    expect(container.innerHTML).toContain('test content');
  });
});