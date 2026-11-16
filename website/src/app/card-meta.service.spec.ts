import { TestBed } from '@angular/core/testing';
import { CardMetaService } from './card-meta.service';
import { TacticDiscipline } from '@shared/config/enums';

describe('CardMetaService', () => {
  let service: CardMetaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardMetaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('cardIdToEditionName maps cardId hundreds to the edition name', () => {
    expect(service.cardIdToEditionName(101)).toBe('Outer Colonies');
    expect(service.cardIdToEditionName(201)).toBe('Jovians Freihändler');
    expect(service.cardIdToEditionName(301)).toBe('Marsianische Hegemonie');
    expect(service.cardIdToEditionName(401)).toBe('Kuiper-Gürtel');
    expect(service.cardIdToEditionName(501)).toBe('Sichere Häfen');
    expect(service.cardIdToEditionName(99)).toBe('');
  });

  it('disciplineToText maps every TacticDiscipline to a German label', () => {
    expect(service.disciplineToText(TacticDiscipline.Intelligence)).toBe('Information');
    expect(service.disciplineToText(TacticDiscipline.Military)).toBe('Militär');
    expect(service.disciplineToText(TacticDiscipline.Science)).toBe('Wissenschaft');
    expect(service.disciplineToText(TacticDiscipline.Trade)).toBe('Wirtschaft');
    expect(service.disciplineToText(undefined)).toBe('');
  });

  it('typeTooltip maps every card type to a German tooltip', () => {
    expect(service.typeTooltip('hull')).toBe('Rumpf');
    expect(service.typeTooltip('equipment')).toBe('Ausrüstung');
    expect(service.typeTooltip('infrastructure')).toBe('Infrastruktur');
    expect(service.typeTooltip('orb')).toBe('Himmelskörper');
    expect(service.typeTooltip('tactic')).toBe('Taktik');
    expect(service.typeTooltip('unknown')).toBe('');
  });

  it('defenseTooltip maps each defense token to its German variant', () => {
    expect(service.defenseTooltip('armour_1')).toBe('1x Panzerung');
    expect(service.defenseTooltip('armour_2')).toBe('2x Panzerung');
    expect(service.defenseTooltip('armour_3')).toBe('3x Panzerung');
    expect(service.defenseTooltip('shield_1')).toBe('1x Schild');
    expect(service.defenseTooltip('shield_2')).toBe('2x Schild');
    expect(service.defenseTooltip('point_defense_1')).toBe('1x Punktabwehr');
    expect(service.defenseTooltip('point_defense_2')).toBe('2x Punktabwehr');
    expect(service.defenseTooltip('unknown')).toBe('');
  });

  it('rarityTooltip maps each rarity tier to its German label', () => {
    expect(service.rarityTooltip(0)).toBe('Häufig');
    expect(service.rarityTooltip(1)).toBe('Gewöhnlich');
    expect(service.rarityTooltip(2)).toBe('Ungewöhnlich');
    expect(service.rarityTooltip(3)).toBe('Selten');
    expect(service.rarityTooltip(4)).toBe('Außergewöhnlich');
    expect(service.rarityTooltip(5)).toBe('Legendär');
    expect(service.rarityTooltip(99)).toBe('');
  });
});
