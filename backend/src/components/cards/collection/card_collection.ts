import ColonyCard from '../types/colonyCard';
import { Card160, Card348 } from './hull_cards';
import { Card163 } from './equipment_defense_cards';
import { Card130, Card166 } from './equipment_weapon_cards';
import { Card135 } from './infrastructure_action_cards';
import { Card185, Card242, Card350, Card453 } from './infrastructure_energy_cards';

export default class CardCollection {
    static cardColony = new ColonyCard();
    static card130 = new Card130();
    static card135 = new Card135();
    static card160 = new Card160();
    static card163 = new Card163();
    static card166 = new Card166();
    static card185 = new Card185();
    static card242 = new Card242();
    static card348 = new Card348();
    static card350 = new Card350();
    static card453 = new Card453();
}
