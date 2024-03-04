import { BuyState_Side } from "../../constants/gamemessage";
import { Card } from "../card";

/**商店卡 30002 */
export class Card_EVENT_Shop extends Card {
    isCanCastMove(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }
    isCanCastBZ(): boolean {
        return false;
    }
    isCanCastHero(): boolean {
        return false;
    }

    OnSpellStart(): void {
        const player = this.GetOwner()
        player.setBuyState(BuyState_Side, 1);
    }
}