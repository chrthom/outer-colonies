import ColonyCard from '../types/colony_card';
import { Card160, Card186, Card220, Card243, Card342, Card348, Card351, Card436, Card439, Card450 } from './hull_1_part_cards';
import { Card103, Card140, Card163, Card170, Card171, Card184, Card240, Card349, Card406, Card447 } from './equipment_defense_cards';
import { Card130, Card168, Card181, Card234, Card237, Card339, Card340, Card424, Card440, Card441 } from './equipment_weapon_point_defense_cards';
import { Card135, Card154, Card164, Card183 } from './infrastructure_action_cards';
import { Card145, Card185, Card187, Card188, Card242, Card244, Card245, Card350, Card352, Card353, Card451, Card452, Card453 } from './infrastructure_energy_cards';
import { Card141, Card165, Card232, Card321, Card427 } from './tactic_economy_cards';
import { Card119, Card152, Card153, Card228, Card446 } from './hull_staton_cards';
import { Card166, Card182, Card343, Card344, Card347, Card421 } from './equipment_weapon_laser_cards';
import { Card126, Card151, Card179, Card180, Card223, Card310, Card420 } from './equipment_weapon_kinetic_cards';
import { Card109, Card161, Card434, Card449 } from './equipment_util_cards';
import { Card118, Card125, Card157, Card209, Card303, Card409 } from './equipment_weapon_plasma_cards';
import { Card106, Card107, Card207 } from './equipment_weapon_particle_cards';
import { Card101, Card127, Card136, Card216, Card304, Card412 } from './equipment_weapon_torpedo_cards';
import { Card131, Card132, Card177, Card178, Card213, Card221, Card226, Card326, Card327, Card328, Card329, Card418, Card444, Card445 } from './hull_2_part_cards';
import { Card116, Card117, Card120, Card121, Card122, Card133, Card134, Card306, Card308, Card309, Card313, Card314, Card315 } from './hull_3_part_cards';
import { Card174, Card337, Card338 } from './tactic_military_cards';
import { Card110 } from './tactic_science_cards';
import Card from '../card';

export default class CardCollection {
    static cardColony = new ColonyCard();
    static card101 = new Card101();
    static card103 = new Card103();
    static card106 = new Card106();
    static card107 = new Card107();
    static card109 = new Card109();
    static card110 = new Card110();
    static card116 = new Card116();
    static card117 = new Card117();
    static card118 = new Card118();
    static card119 = new Card119();
    static card120 = new Card120();
    static card121 = new Card121();
    static card122 = new Card122();
    static card125 = new Card125();
    static card126 = new Card126();
    static card127 = new Card127();
    static card130 = new Card130();
    static card131 = new Card131();
    static card132 = new Card132();
    static card133 = new Card133();
    static card134 = new Card134();
    static card135 = new Card135();
    static card136 = new Card136();
    static card140 = new Card140();
    static card141 = new Card141();
    static card145 = new Card145();
    static card151 = new Card151();
    static card152 = new Card152();
    static card153 = new Card153();
    static card154 = new Card154();
    static card157 = new Card157();
    static card160 = new Card160();
    static card161 = new Card161();
    static card163 = new Card163();
    static card164 = new Card164();
    static card165 = new Card165();
    static card166 = new Card166();
    static card168 = new Card168();
    static card170 = new Card170();
    static card171 = new Card171();
    static card174 = new Card174();
    static card177 = new Card177();
    static card178 = new Card178();
    static card179 = new Card179();
    static card180 = new Card180();
    static card181 = new Card181();
    static card182 = new Card182();
    static card183 = new Card183();
    static card184 = new Card184();
    static card185 = new Card185();
    static card186 = new Card186();
    static card187 = new Card187();
    static card188 = new Card188();
    static card207 = new Card207();
    static card209 = new Card209();
    static card213 = new Card213();
    static card216 = new Card216();
    static card220 = new Card220();
    static card221 = new Card221();
    static card223 = new Card223();
    static card226 = new Card226();
    static card228 = new Card228();
    static card232 = new Card232();
    static card234 = new Card234();
    static card237 = new Card237();
    static card240 = new Card240();
    static card242 = new Card242();
    static card243 = new Card243();
    static card244 = new Card244();
    static card245 = new Card245();
    static card303 = new Card303();
    static card304 = new Card304();
    static card306 = new Card306();
    static card308 = new Card308();
    static card309 = new Card309();
    static card310 = new Card310();
    static card313 = new Card313();
    static card314 = new Card314();
    static card315 = new Card315();
    static card321 = new Card321();
    static card326 = new Card326();
    static card327 = new Card327();
    static card328 = new Card328();
    static card329 = new Card329();
    static card337 = new Card337();
    static card338 = new Card338();
    static card339 = new Card339();
    static card340 = new Card340();
    static card342 = new Card342();
    static card343 = new Card343();
    static card344 = new Card344();
    static card347 = new Card347();
    static card348 = new Card348();
    static card349 = new Card349();
    static card350 = new Card350();
    static card351 = new Card351();
    static card352 = new Card352();
    static card353 = new Card353();
    static card406 = new Card406();
    static card409 = new Card409();
    static card412 = new Card412();
    static card418 = new Card418();
    static card420 = new Card420();
    static card421 = new Card421();
    static card424 = new Card424();
    static card427 = new Card427();
    static card434 = new Card434();
    static card436 = new Card436();
    static card439 = new Card439();
    static card440 = new Card440();
    static card441 = new Card441();
    static card444 = new Card444();
    static card445 = new Card445();
    static card446 = new Card446();
    static card447 = new Card447();
    static card449 = new Card449();
    static card450 = new Card450();
    static card451 = new Card451();
    static card452 = new Card452();
    static card453 = new Card453();

    static starterDeckSettlers = [
        // Hull (18)
        Array(6).fill(this.card186), // Korvette
        Array(4).fill(this.card160), // Leichter Frachter
        Array(3).fill(this.card177), // Zerstörer
        Array(3).fill(this.card178), // Zerstörer
        Array(2).fill(this.card446), // Außenposten
        // Equipment (29 - 17/23 Theta, 2/3 Xi, 2/3 Phi)
        Array(2).fill(this.card340), // Abfangraketenwerfer
        Array(2).fill(this.card347), // Impulslaser
        Array(6).fill(this.card441), // Flechettewerfer
        Array(4).fill(this.card234), // Punktabwehrlaser
        Array(7).fill(this.card237), // Fokus-Laser
        Array(4).fill(this.card170), // Strahlenschilde
        Array(4).fill(this.card184), // Rumpferweiterung
        // Infrastructure (6)
        Array(3).fill(this.card185), // Kraftwerk
        Array(3).fill(this.card183), // Industriekomplex
        // Tactic (7)
        Array(4).fill(this.card232), // Warenlieferung
        Array(3).fill(this.card321), // Recycling
        // TEST
        Array(6).fill(this.card177), // Zerstörer
        Array(6).fill(this.card178), // Zerstörer
    ].flat();
    
    static starterDeckTraders = [
        // Hull (18)
        Array(6).fill(this.card243), // Korvette
        Array(4).fill(this.card348), // Kanonenboot
        Array(3).fill(this.card221), // Schwerer Frachter
        Array(3).fill(this.card327), // Schwerer Frachter
        Array(2).fill(this.card446), // Außenposten
        // Equipment (28 - 16/19 Theta, 4/4 Xi)
        Array(4).fill(this.card180), // Railgun
        Array(5).fill(this.card237), // Mini-Railgun
        Array(3).fill(this.card339), // Gatling
        Array(8).fill(this.card166), // Laserkanone
        Array(5).fill(this.card240), // Ceramo-Stahl
        Array(3).fill(this.card171), // Titanplattenpanzer
        // Tactic (14)
        Array(7).fill(this.card337), // Militärpioniere
        Array(4).fill(this.card165), // Konvoi
        Array(3).fill(this.card321), // Recycling
        // TEST
        Array(6).fill(this.card177), // Zerstörer
        Array(6).fill(this.card178), // Zerstörer
    ].flat();
    
    static starterDeckExpedition = [
        // Hull (18)
        Array(6).fill(this.card351), // Korvette
        Array(4).fill(this.card439), // Mittelschwerer Frachter
        Array(3).fill(this.card444), // Zerstörer
        Array(3).fill(this.card445), // Zerstörer
        Array(2).fill(this.card446), // Außenposten
        // Equipment (24 - 16/23 Theta, 2/3 Xi, 2/3 Phi)
        Array(2).fill(this.card340), // Abfangraketenwerfer
        Array(2).fill(this.card182), // Dual-Lasergeschütz
        Array(6).fill(this.card440), // Impulskanone
        Array(4).fill(this.card168), // Automatikkanone
        Array(4).fill(this.card179), // Pulskanone
        Array(2).fill(this.card343), // Laserphalanx
        Array(4).fill(this.card163), // Verbundpanzerung
        // Infrastructure (10)
        Array(6).fill(this.card187), // Atomreaktor
        Array(1).fill(this.card453), // Kraftwerk
        Array(3).fill(this.card164), // Rüstungsschmiede
        // Tactic (8)
        Array(2).fill(this.card337), // Militärpioniere
        Array(3).fill(this.card338), // Nachschub
        Array(3).fill(this.card321), // Recycling
        // TEST
        Array(6).fill(this.card177), // Zerstörer
        Array(6).fill(this.card178), // Zerstörer
    ].flat();

    static pickRandomDeck(): Card[] {
        const allDecks = [ this.starterDeckExpedition, this.starterDeckSettlers, this.starterDeckTraders ];
        return allDecks[Math.floor(Math.random() * allDecks.length)].slice();
    }
}
