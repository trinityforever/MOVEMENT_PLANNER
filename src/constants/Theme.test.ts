import { COLORS, SPACING, BORDER_RADIUS, THEME } from './Theme';

describe('Theme constants', () => {
  describe('COLORS', () => {
    it('has all required color keys', () => {
      expect(COLORS.background).toBe('#000000');
      expect(COLORS.surface).toBe('#1A1A1A');
      expect(COLORS.afterparty).toBe('#7C3AED');
      expect(COLORS.dayParty).toBe('#F59E0B');
      expect(COLORS.sunrise).toBe('#F97316');
      expect(COLORS.festival).toBe('#0D9488');
      expect(COLORS.textPrimary).toBe('#FFFFFF');
      expect(COLORS.textSecondary).toBe('#94A3B8');
    });

    it('all color values are valid hex colors', () => {
      const hexColor = /^#[0-9A-Fa-f]{6}$/;
      for (const [key, value] of Object.entries(COLORS)) {
        expect(hexColor.test(value)).toBe(true);
      }
    });
  });

  describe('SPACING', () => {
    it('has all required spacing keys', () => {
      expect(SPACING.xs).toBe(4);
      expect(SPACING.sm).toBe(8);
      expect(SPACING.md).toBe(16);
      expect(SPACING.lg).toBe(24);
      expect(SPACING.xl).toBe(32);
    });

    it('spacing values are in ascending order', () => {
      const values = [SPACING.xs, SPACING.sm, SPACING.md, SPACING.lg, SPACING.xl];
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });
  });

  describe('THEME', () => {
    it('is a composite of COLORS, SPACING, and BORDER_RADIUS', () => {
      expect(THEME.colors).toBe(COLORS);
      expect(THEME.spacing).toBe(SPACING);
      expect(THEME.borderRadius).toBe(BORDER_RADIUS);
    });
  });
});
