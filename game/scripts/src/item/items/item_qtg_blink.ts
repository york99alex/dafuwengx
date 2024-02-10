import { AMHC, IsValid } from '../../utils/amhc';
import { registerAbility } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';
import { AbilityManager } from '../../ability/abilitymanager';
import { CameraManage } from '../../mode/S2Cmode/CameraManage';

/**
 * 闪烁匕首 2000，5回合CD
 */
@registerAbility()
export class item_qtg_blink extends TSBaseItem {
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0;
    }

    CastFilterResultLocation(location: Vector): UnitFilterResult {
        if (!IsServer()) return;
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM;
        }
        if (IsServer() && GameRules.PathManager && GameRules.PathManager.m_tabPaths) {
            const path = GameRules.PathManager.getClosePath(location);
            const dis = ((location - path.m_entity.GetAbsOrigin()) as Vector).Length2D();
            if (dis < 150) {
                this.m_pathTarget = path;
                return UnitFilterResult.SUCCESS;
            }
            this.m_strCastError = 'ItemError_TargetNotPath';
            return UnitFilterResult.FAIL_CUSTOM;
        } else {
            return UnitFilterResult.SUCCESS;
        }
    }

    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (IsValid(target)) {
            return this.CastFilterResultLocation(target.GetAbsOrigin());
        }
        return UnitFilterResult.FAIL_CUSTOM;
    }

    /**技能释放 */
    OnSpellStart(): void {
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player) return;

        // 特效
        let nPtclID = AMHC.CreateParticle('particles/items_fx/blink_dagger_start.vpcf', ParticleAttachment.ABSORIGIN, false, player.m_eHero, 2);
        ParticleManager.SetParticleControl(nPtclID, 0, player.m_eHero.GetAbsOrigin());

        // 音效
        EmitGlobalSound('DOTA_Item.BlinkDagger.Activate');

        // 闪现到路径
        player.blinkToPath(this.m_pathTarget);
        // 判断路径触发功能
        player.m_pathCur.onPath(player);

        nPtclID = AMHC.CreateParticle('particles/items_fx/blink_dagger_end.vpcf', ParticleAttachment.ABSORIGIN, false, player.m_eHero, 2);
        ParticleManager.SetParticleControl(nPtclID, 0, player.m_eHero.GetAbsOrigin());

        // 视角
        CameraManage.LookAt(player.m_nPlayerID, player.m_eHero.GetAbsOrigin(), 0.1);

        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }
}
