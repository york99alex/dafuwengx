import { PathRune } from '../../path/pathtype/pathrune';
import { Card } from '../card';

/**隐身神符 */
export class Card_MAGIC_BottleInvisibility extends Card {
    m_sName: string = '隐身神符';
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
        path.onRune(player, RuneType.INVISIBILITY);
    }
}
