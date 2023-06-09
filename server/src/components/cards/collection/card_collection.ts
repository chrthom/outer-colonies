import ColonyCard from '../types/colony_card';
import { Card160, Card186, Card220, Card243, Card342, Card348, Card351, Card436, Card439, Card450 } from './hull_1_part_cards';
import { Card103, Card140, Card163, Card170, Card171, Card184, Card240, Card349, Card406, Card447 } from './equipment_defense_cards';
import { Card130, Card168, Card181, Card234, Card237, Card339, Card340, Card424, Card440, Card441 } from './equipment_weapon_point_defense_cards';
import { Card135, Card154, Card164, Card183 } from './infrastructure_action_cards';
import { Card105, Card145, Card185, Card187, Card188, Card242, Card244, Card245, Card350, Card352, Card353, Card451, Card452, Card453 } from './infrastructure_energy_cards';
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
import { Card172 } from './infrastructure_util.cards';

export default class CardCollection {
    static cards = {
        0: <Card> new ColonyCard(),
        101: <Card> new Card101(),
        103: <Card> new Card103(),
        105: <Card> new Card105(),
        106: <Card> new Card106(),
        107: <Card> new Card107(),
        109: <Card> new Card109(),
        110: <Card> new Card110(),
        116: <Card> new Card116(),
        117: <Card> new Card117(),
        118: <Card> new Card118(),
        119: <Card> new Card119(),
        120: <Card> new Card120(),
        121: <Card> new Card121(),
        122: <Card> new Card122(),
        125: <Card> new Card125(),
        126: <Card> new Card126(),
        127: <Card> new Card127(),
        130: <Card> new Card130(),
        131: <Card> new Card131(),
        132: <Card> new Card132(),
        133: <Card> new Card133(),
        134: <Card> new Card134(),
        135: <Card> new Card135(),
        136: <Card> new Card136(),
        140: <Card> new Card140(),
        141: <Card> new Card141(),
        145: <Card> new Card145(),
        151: <Card> new Card151(),
        152: <Card> new Card152(),
        153: <Card> new Card153(),
        154: <Card> new Card154(),
        157: <Card> new Card157(),
        160: <Card> new Card160(),
        161: <Card> new Card161(),
        163: <Card> new Card163(),
        164: <Card> new Card164(),
        165: <Card> new Card165(),
        166: <Card> new Card166(),
        168: <Card> new Card168(),
        170: <Card> new Card170(),
        171: <Card> new Card171(),
        172: <Card> new Card172(),
        174: <Card> new Card174(),
        177: <Card> new Card177(),
        178: <Card> new Card178(),
        179: <Card> new Card179(),
        180: <Card> new Card180(),
        181: <Card> new Card181(),
        182: <Card> new Card182(),
        183: <Card> new Card183(),
        184: <Card> new Card184(),
        185: <Card> new Card185(),
        186: <Card> new Card186(),
        187: <Card> new Card187(),
        188: <Card> new Card188(),
        207: <Card> new Card207(),
        209: <Card> new Card209(),
        213: <Card> new Card213(),
        216: <Card> new Card216(),
        220: <Card> new Card220(),
        221: <Card> new Card221(),
        223: <Card> new Card223(),
        226: <Card> new Card226(),
        228: <Card> new Card228(),
        232: <Card> new Card232(),
        234: <Card> new Card234(),
        237: <Card> new Card237(),
        240: <Card> new Card240(),
        242: <Card> new Card242(),
        243: <Card> new Card243(),
        244: <Card> new Card244(),
        245: <Card> new Card245(),
        303: <Card> new Card303(),
        304: <Card> new Card304(),
        306: <Card> new Card306(),
        308: <Card> new Card308(),
        309: <Card> new Card309(),
        310: <Card> new Card310(),
        313: <Card> new Card313(),
        314: <Card> new Card314(),
        315: <Card> new Card315(),
        321: <Card> new Card321(),
        326: <Card> new Card326(),
        327: <Card> new Card327(),
        328: <Card> new Card328(),
        329: <Card> new Card329(),
        337: <Card> new Card337(),
        338: <Card> new Card338(),
        339: <Card> new Card339(),
        340: <Card> new Card340(),
        342: <Card> new Card342(),
        343: <Card> new Card343(),
        344: <Card> new Card344(),
        347: <Card> new Card347(),
        348: <Card> new Card348(),
        349: <Card> new Card349(),
        350: <Card> new Card350(),
        351: <Card> new Card351(),
        352: <Card> new Card352(),
        353: <Card> new Card353(),
        406: <Card> new Card406(),
        409: <Card> new Card409(),
        412: <Card> new Card412(),
        418: <Card> new Card418(),
        420: <Card> new Card420(),
        421: <Card> new Card421(),
        424: <Card> new Card424(),
        427: <Card> new Card427(),
        434: <Card> new Card434(),
        436: <Card> new Card436(),
        439: <Card> new Card439(),
        440: <Card> new Card440(),
        441: <Card> new Card441(),
        444: <Card> new Card444(),
        445: <Card> new Card445(),
        446: <Card> new Card446(),
        447: <Card> new Card447(),
        449: <Card> new Card449(),
        450: <Card> new Card450(),
        451: <Card> new Card451(),
        452: <Card> new Card452(),
        453: <Card> new Card453(),
    };

    static allCards = Object.values(this.cards);

    static starterDeckSettlers: Card[] = [ // 70 cards
        // Hull (18)
        Array(6).fill(this.cards[186]), // Korvette
        Array(4).fill(this.cards[160]), // Leichter Frachter
        Array(2).fill(this.cards[133]), // Kreuzer
        Array(2).fill(this.cards[116]), // Kreuzer
        Array(2).fill(this.cards[134]), // Kreuzer
        Array(2).fill(this.cards[446]), // Außenposten
        // Equipment (27 - 19/24 Theta, 2/4 Xi)
        Array(2).fill(this.cards[421]), // Salvenlaser
        Array(4).fill(this.cards[441]), // Flechettewerfer
        Array(3).fill(this.cards[234]), // Punktabwehrlaser
        Array(4).fill(this.cards[237]), // Fokus-Laser
        Array(4).fill(this.cards[157]), // Plasmawerfer
        Array(2).fill(this.cards[151]), // Kinetikwaffenbatterie
        Array(2).fill(this.cards[170]), // Strahlenschilde
        Array(2).fill(this.cards[447]), // Schildgondel
        Array(4).fill(this.cards[184]), // Rumpferweiterung
        // Infrastructure (13)
        Array(3).fill(this.cards[185]), // Kraftwerk
        Array(3).fill(this.cards[183]), // Industriekomplex
        Array(2).fill(this.cards[187]), // Atomreaktor
        Array(2).fill(this.cards[188]), // Solarpanele
        Array(2).fill(this.cards[172]), // Ressourcensilo
        Array(1).fill(this.cards[164]), // Rüstungsschmiede
        // Tactic (12)
        Array(4).fill(this.cards[232]), // Warenlieferung
        Array(2).fill(this.cards[165]), // Konvoi
        Array(2).fill(this.cards[427]), // Immigranten von der Erde
        Array(2).fill(this.cards[321]), // Recycling
        Array(2).fill(this.cards[174]), // Feldreperaturen
        // TEST CARDS
    ].flat();
    
    static starterDeckTraders: Card[] = [ // 70 cards
        // Hull (18)
        Array(6).fill(this.cards[243]), // Korvette
        Array(4).fill(this.cards[348]), // Kanonenboot
        Array(3).fill(this.cards[221]), // Schwerer Frachter
        Array(3).fill(this.cards[327]), // Schwerer Frachter
        Array(2).fill(this.cards[446]), // Außenposten
        // Equipment (27 - 16/19 Theta, 4/4 Xi)
        Array(4).fill(this.cards[180]), // Railgun
        Array(4).fill(this.cards[224]), // Bergbaulaser
        Array(4).fill(this.cards[237]), // Mini-Railgun
        Array(3).fill(this.cards[339]), // Gatling
        Array(3).fill(this.cards[166]), // Laserkanone
        Array(2).fill(this.cards[166]), // Laserphalanx
        Array(5).fill(this.cards[240]), // Ceramo-Stahl
        Array(2).fill(this.cards[171]), // Titanplattenpanzer
        // Infrastructure (15)
        Array(1).fill(this.cards[242]), // Kraftwerk
        Array(1).fill(this.cards[183]), // Industriekomplex
        Array(5).fill(this.cards[244]), // Atomreaktor
        Array(2).fill(this.cards[245]), // Solarpanele
        Array(2).fill(this.cards[172]), // Ressourcensilo
        Array(1).fill(this.cards[135]), // Werft
        Array(3).fill(this.cards[164]), // Rüstungsschmiede
        // Tactic (10)
        Array(2).fill(this.cards[232]), // Warenlieferung
        Array(2).fill(this.cards[165]), // Konvoi
        Array(2).fill(this.cards[321]), // Recycling
        Array(2).fill(this.cards[174]), // Feldreperaturen
        Array(2).fill(this.cards[141]), // Externe Arbeitskräfte
        // TEST CARDS
    ].flat();
    
    static starterDeckExpedition: Card[] = [ // 70 cards
        // Hull (18)
        Array(6).fill(this.cards[351]), // Korvette
        Array(4).fill(this.cards[342]), // Torpedoboot
        Array(3).fill(this.cards[444]), // Zerstörer
        Array(3).fill(this.cards[445]), // Zerstörer
        Array(2).fill(this.cards[446]), // Außenposten
        // Equipment (27 - 14/19 Theta, 2/3 Xi, 5/7 Phi)
        Array(2).fill(this.cards[340]), // Abfangraketenwerfer
        Array(3).fill(this.cards[136]), // Plasmatorpedos
        Array(2).fill(this.cards[182]), // Dual-Lasergeschütz
        Array(5).fill(this.cards[440]), // Impulskanone
        Array(4).fill(this.cards[168]), // Automatikkanone
        Array(5).fill(this.cards[179]), // Pulskanone
        Array(4).fill(this.cards[163]), // Verbundpanzerung
        Array(2).fill(this.cards[170]), // Strahlenschilde
        // Infrastructure (11)
        Array(2).fill(this.cards[350]), // Kraftwerk
        Array(2).fill(this.cards[183]), // Industriekomplex
        Array(3).fill(this.cards[352]), // Atomreaktor
        Array(2).fill(this.cards[353]), // Solarpanele
        Array(2).fill(this.cards[172]), // Ressourcensilo
        // Tactic (14)
        Array(6).fill(this.cards[337]), // Militärpioniere
        Array(4).fill(this.cards[338]), // Nachschub
        Array(2).fill(this.cards[321]), // Recycling
        Array(2).fill(this.cards[174]), // Feldreperaturen
        // TEST CARDS
    ].flat();

    static starterDecks: Card[][] = [ this.starterDeckSettlers, this.starterDeckTraders, this.starterDeckExpedition ]

    static pickRandomDeck(): Card[] {
        return this.starterDecks[Math.floor(Math.random() * this.starterDecks.length)].slice();
    }
}
