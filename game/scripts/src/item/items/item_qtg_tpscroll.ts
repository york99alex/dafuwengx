import { PS_InPrison } from "../../mode/gamemessage";
import { PathTP } from "../../path/pathtp";
import { AMHC, IsValid } from "../../utils/amhc";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../../ability/abilitymanager";
import { TSBaseItem } from "../tsBaseItem";

@registerAbility()
export class item_qtg_tpscroll extends TSBaseItem {

    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        AbilityManager.showAbltMark(this, this.GetCaster(), [6, 16, 26, 36])
        return 0
    }

    CastFilterResultLocation(location: Vector): UnitFilterResult {
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM
        }
        if (IsServer() && GameRules.PathManager && GameRules.PathManager.m_tabPaths) {
            const path = GameRules.PathManager.getClosePath(location)
            const dis = (location - path.m_entity.GetAbsOrigin() as Vector).Length2D()
            if (dis < 150) {
                if ([6, 16, 26, 36].indexOf(path.m_nID) > -1) {
                    this.m_pathTarget = path
                    return UnitFilterResult.SUCCESS
                } else {
                    this.m_strCastError = "ItemError_TargetNotTP"
                    return UnitFilterResult.FAIL_CUSTOM
                }
            }
            this.m_strCastError = "ItemError_TargetNotPath"
            return UnitFilterResult.FAIL_CUSTOM
        } else {
            return UnitFilterResult.SUCCESS
        }
    }

    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (IsValid(target)) {
            return this.CastFilterResultLocation(target.GetAbsOrigin())
        }
        return UnitFilterResult.FAIL_CUSTOM
    }

    /**技能释放 */
    OnSpellStart(): void {
        const owner = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
        const path = this.m_pathTarget as PathTP
        if (!owner || !path) return

        // 过掉其他操作
        GameRules.GameConfig.autoOptionalOprt(owner)

        // 特效
        AMHC.CreateParticle("particles/events/ti6_teams/teleport_start_ti6_lvl3_wings_gaming.vpcf"
            , ParticleAttachment.POINT, false, owner.m_eHero, 2.5)
        const nPtclID = AMHC.CreateParticle("particles/events/ti6_teams/teleport_start_ti6_lvl3_wings_gaming.vpcf"
            , ParticleAttachment.POINT, false, owner.m_eHero, 2.5)
        ParticleManager.SetParticleControl(nPtclID, 0, path.m_entity.GetAbsOrigin())
        EmitSoundOn("Custom.TP.Begin", owner.m_eHero)

        // 传送动作2.5秒
        GameRules.GameLoop.GameStateService.send("towait")
        this.yieldWait = true
        owner.m_eHero.StartGesture(GameActivity.DOTA_TELEPORT)
        Timers.CreateTimer(2.5, () => {
            // 传送
            StopSoundOn("Custom.TP.Begin", owner.m_eHero)
            EmitSoundOn("Custom.TP.End", owner.m_eHero)

            owner.m_eHero.RemoveGesture(GameActivity.DOTA_TELEPORT)
            owner.m_eHero.StartGesture(GameActivity.DOTA_TELEPORT_END)

            if (0 < bit.band(PS_InPrison, owner.m_nPlayerState)) return

            // 设置游戏记录
            // TODO:

            owner.blinkToPath(path)
            GameRules.GameLoop.GameStateService.send("towaitoprt")
            this.yieldWait = null

            // 别人的tp点给钱
            if (path.m_nOwnerID != null && path.m_nOwnerID != owner.m_nPlayerID)
                path.onPath(owner)
        })
        // 触发耗蓝
        GameRules.EventManager.FireEvent("Event_HeroManaChange", { player: owner, oAblt: this })
        // 设置冷却
        AbilityManager.setRoundCD(owner, this)
        // 消耗充能
        this.SpendCharge()
    }
}