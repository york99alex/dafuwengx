import { TP_PRISON, TypeOprt } from '../../constants/gamemessage';
import { PathPrison } from '../../path/pathtype/pathprison';
import { IsValid } from '../../utils/amhc';
import { Card } from '../card';

/**阎刃333 30003 */
export class Card_EVENT_Infernal_Blade_333 extends Card {
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }

    OnSpellStart(): void {
        const alivePlayers = GameRules.PlayerManager.getAlivePlayers();
        const targetID = RandomInt(0, alivePlayers.length - 1);

        const owner = this.GetOwner();
        const playerTarget = GameRules.PlayerManager.getPlayer(targetID);
        const path = GameRules.PathManager.getPathByType(TP_PRISON)[0] as PathPrison;
        if (!owner || !playerTarget || !path) return;

        if (path.isInPrison(playerTarget.m_eHero.GetEntityIndex())) {
            // 在监狱就出来
            path.setOutPrison(playerTarget);
            if (GameRules.GameConfig.m_nOrderID == playerTarget.m_nPlayerID) {
                // 当前在操作买活自动处理
                GameRules.GameConfig.autoOprt(TypeOprt.TO_PRISON_OUT, playerTarget);
            }
        } else {
            // 不在就进去吧你嘞
            path.setInPrison(playerTarget);
        }
    }
}
