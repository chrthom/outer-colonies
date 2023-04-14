import { EquipmentProfile } from "./types/equipmentCard";

export default class CardProfile extends EquipmentProfile {}

export class AttackProfile {
    readonly range: number;
    readonly damage: number;
    readonly pointDefense: number;
    readonly shield: number;
    readonly armour: number;
}
