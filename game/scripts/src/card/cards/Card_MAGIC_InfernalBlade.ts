import { TP_PRISON, TypeOprt } from '../../constants/gamemessage';
import { PathPrison } from '../../path/pathtype/pathprison';
import { IsValid } from '../../utils/amhc';
import { Card } from '../card';

/**阎刃 */
export class Card_MAGIC_InfernalBlade extends Card {
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }
    isCanCastSelf(): boolean {
        return true;
    }
    isCanCastInPrisonTarget(): boolean {
        return true;
    }
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (IsValid(target)) {
            if (!this.CanUseCard(target)) return UnitFilterResult.FAIL_CUSTOM;

            // 验证目标是玩家单位
            if (!GameRules.PlayerManager.isAlivePlayer(target.GetPlayerOwnerID())) {
                this.m_strCastError = 'AbilityError_TargetNotPlayer';
                return UnitFilterResult.FAIL_CUSTOM;
            }
            this.m_eTarget = target;
            return UnitFilterResult.SUCCESS;
        }
        return UnitFilterResult.FAIL_CUSTOM;
    }

    OnSpellStart(): void {
        if (!IsValid(this.m_eTarget)) return;

        const owner = this.GetOwner();
        const playerTarget = GameRules.PlayerManager.getPlayer(this.m_eTarget.GetPlayerOwnerID());
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
