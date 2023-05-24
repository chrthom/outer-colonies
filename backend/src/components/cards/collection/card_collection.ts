import ColonyCard from '../types/colony_card';
import { Card160, Card186, Card220, Card243, Card342, Card348, Card351, Card436, Card439, Card450 } from './hull_1_part_cards';
import { Card163, Card170 } from './equipment_defense_cards';
import { Card130, Card166 } from './equipment_weapon_cards';
import { Card135 } from './infrastructure_action_cards';
import { Card185, Card242, Card350, Card453 } from './infrastructure_energy_cards';
import { Card141, Card232 } from './tactic_economy_cards';

export default class CardCollection {
    static cardColony = new ColonyCard();
    static card130 = new Card130();
    static card135 = new Card135();
    static card141 = new Card141();
    static card160 = new Card160();
    static card163 = new Card163();
    static card166 = new Card166();
    static card170 = new Card170();
    static card185 = new Card185();
    static card186 = new Card186();
    static card220 = new Card220();
    static card232 = new Card232();
    static card242 = new Card242();
    static card243 = new Card243();
    static card342 = new Card342();
    static card348 = new Card348();
    static card350 = new Card350();
    static card351 = new Card351();
    static card436 = new Card436();
    static card439 = new Card439();
    static card450 = new Card450();
    static card453 = new Card453();
}
