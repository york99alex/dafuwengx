import { PathRune } from '../../path/pathtype/pathrune';
import { Card } from '../card';

/**智慧神符 */
export class Card_MAGIC_BottleXP extends Card {
    m_sName: string = '智慧神符';
    isCanCastMove(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }

    OnSpellStart(): void {
        const player = this.GetOwner();
        const path = GameRules.PathManager.getPathByID(17) as PathRune;
        if (!path) return;
        path.onRune(player, RuneType.XP);
    }
}
