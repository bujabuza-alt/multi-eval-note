import manifest from '../src/app/manifest';

describe('manifest()', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('icon configuration (SVG migration)', () => {
    it('uses a single SVG icon instead of multiple PNGs', () => {
      const result = manifest();
      expect(result.icons).toHaveLength(1);
    });

    it('icon src points to icon.svg', () => {
      const result = manifest();
      expect(result.icons[0].src).toBe('/icon.svg');
    });

    it('icon type is image/svg+xml', () => {
      const result = manifest();
      expect(result.icons[0].type).toBe('image/svg+xml');
    });

    it('icon sizes is "any"', () => {
      const result = manifest();
      expect(result.icons[0].sizes).toBe('any');
    });

    it('icon purpose is "any maskable"', () => {
      const result = manifest();
      expect(result.icons[0].purpose).toBe('any maskable');
    });

    it('does not include icon-192.png', () => {
      const result = manifest();
      const srcs = result.icons.map((icon) => icon.src);
      expect(srcs.some((src) => src.includes('icon-192'))).toBe(false);
    });

    it('does not include icon-512.png', () => {
      const result = manifest();
      const srcs = result.icons.map((icon) => icon.src);
      expect(srcs.some((src) => src.includes('icon-512'))).toBe(false);
    });

    it('does not include any PNG icons', () => {
      const result = manifest();
      result.icons.forEach((icon) => {
        expect(icon.type).not.toBe('image/png');
      });
    });
  });

  describe('basePath handling', () => {
    it('prepends basePath to icon src when NEXT_PUBLIC_BASE_PATH is set', () => {
      process.env.NEXT_PUBLIC_BASE_PATH = '/app';
      const result = manifest();
      expect(result.icons[0].src).toBe('/app/icon.svg');
    });

    it('uses empty string basePath by default (no env var)', () => {
      const result = manifest();
      expect(result.icons[0].src).toBe('/icon.svg');
    });

    it('prepends basePath to start_url', () => {
      process.env.NEXT_PUBLIC_BASE_PATH = '/app';
      const result = manifest();
      expect(result.start_url).toBe('/app/');
    });

    it('prepends basePath to scope', () => {
      process.env.NEXT_PUBLIC_BASE_PATH = '/app';
      const result = manifest();
      expect(result.scope).toBe('/app/');
    });

    it('uses "/" as start_url when no basePath', () => {
      const result = manifest();
      expect(result.start_url).toBe('/');
    });

    it('uses "/" as scope when no basePath', () => {
      const result = manifest();
      expect(result.scope).toBe('/');
    });
  });

  describe('manifest metadata', () => {
    it('returns an object', () => {
      expect(typeof manifest()).toBe('object');
    });

    it('has required PWA fields', () => {
      const result = manifest();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('short_name');
      expect(result).toHaveProperty('icons');
      expect(result).toHaveProperty('start_url');
      expect(result).toHaveProperty('display');
    });

    it('display is standalone', () => {
      const result = manifest();
      expect(result.display).toBe('standalone');
    });

    it('orientation is portrait', () => {
      const result = manifest();
      expect(result.orientation).toBe('portrait');
    });

    it('theme_color matches expected value', () => {
      const result = manifest();
      expect(result.theme_color).toBe('#6366F1');
    });

    it('background_color matches expected value', () => {
      const result = manifest();
      expect(result.background_color).toBe('#F8FAFC');
    });
  });
});