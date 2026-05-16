/**
 * Service for mapping icon names to icon font Unicode characters.
 * This service provides a centralized way to access the Outer Colonies icon font.
 */
export class IconService {
  /**
   * Mapping of icon names to their Unicode Private Use Area code points.
   * These correspond to the glyphs in the outer-colonies-icons font.
   * Font mapping (from mapping.md):
   * U+EA01 = armour, U+EA02 = control, U+EA03 = damage, U+EA04 = energy
   * U+EA05 = equip, U+EA06 = hp, U+EA07 = hull, U+EA08 = infra
   * U+EA09 = orb, U+EA0A = point_def, U+EA0B = shield, U+EA0C = tactic
   */
  private readonly iconMap: Record<string, string> = {
    // Game resource icons - matching the font mapping
    hp: '\uea06',
    hitpoints: '\uea06',
    damage: '\uea03',
    energy: '\uea04',
    control: '\uea02',
    armour: '\uea01',
    armour_1: '\uea01',
    armour_2: '\uea01',
    armour_3: '\uea01',
    shield: '\uea0b',
    shield_1: '\uea0b',
    shield_2: '\uea0b',
    shield_3: '\uea0b',
    // Additional icons from the font
    equipment: '\uea05',
    equip: '\uea05',
    hull: '\uea07',
    infrastructure: '\uea08',
    infra: '\uea08',
    orb: '\uea09',
    point_defense: '\uea0a',
    point_def: '\uea0a',
    point_defense_1: '\uea0a',
    point_defense_2: '\uea0a',
    tactic: '\uea0c',
    speed: '\uea02',
    // Colony card type - maps to infrastructure icon as fallback
    colony: '\uea08'
  };

  /**
   * Get the Unicode character for an icon name.
   * @param name The icon name (e.g., 'hp', 'damage', 'armour_1')
   * @returns The Unicode character for the icon, or null if not found
   */
  getIcon(name: string): string | null {
    return this.iconMap[name.toLowerCase()] ?? null;
  }

  /**
   * Get the HTML entity for an icon name.
   * @param name The icon name
   * @returns The HTML entity string (e.g., '&#xEA01;'), or null if not found
   */
  getIconHtml(name: string): string | null {
    const icon = this.getIcon(name);
    if (!icon) return null;
    // Convert \uea01 to &#xEA01;
    const codePoint = icon.charCodeAt(0).toString(16).toUpperCase();
    return `&#x${codePoint};`;
  }

  /**
   * Get the CSS class name for an icon.
   * @param name The icon name
   * @returns The CSS class name (e.g., 'oc-icon-hp')
   */
  getIconClass(name: string): string {
    return `oc-icon-${name.toLowerCase()}`;
  }

  /**
   * Check if an icon exists in the font.
   * @param name The icon name
   * @returns True if the icon exists in the font
   */
  hasIcon(name: string): boolean {
    return name.toLowerCase() in this.iconMap;
  }

  /**
   * Get all available icon names.
   * @returns Array of all available icon names
   */
  getAvailableIcons(): string[] {
    return Object.keys(this.iconMap);
  }
}
