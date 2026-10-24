import { ZONE_ENTRY_REASONS } from '../data/characterConstants';

// Translate predefined choices only; custom biographies remain exactly as authored.
export function translateZoneReason(value: string, translate: (source: string) => string) {
  const reason = ZONE_ENTRY_REASONS.find((item) => `${item.title}: ${item.description}` === value);
  return reason ? `${translate(reason.title)}: ${translate(reason.description)}` : value;
}

const statuses: Record<string, string> = {
  draft: 'Чернетка', pending: 'На розгляді', approved: 'Схвалено', rejected: 'Відхилено',
  active: 'Активний', archived: 'Архівовано', dead: 'Мертвий',
};

export function translateCharacterStatus(value: string, translate: (source: string) => string) {
  return translate(statuses[value] || value);
}
