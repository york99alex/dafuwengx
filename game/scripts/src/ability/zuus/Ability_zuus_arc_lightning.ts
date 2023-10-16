import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { Player } from "../../player/player";
import { AHMC } from "../../utils/amhc";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 	"DOTA_Tooltip_ability_Ability_zuus_arc_lightning"					"弧形闪电"
    "DOTA_Tooltip_ability_Ability_zuus_arc_lightning_Description"		"释放一道会跳跃穿越附近敌人的闪电。每次在目标<font color='#FFFFFF'> 5 </font>格范围跳跃。"
    "DOTA_Tooltip_ability_Ability_zuus_arc_lightning_Lore"				"弧形闪电是宙斯在对付渺小的凡人时最喜欢用的法术。"
    "DOTA_Tooltip_ability_Ability_zuus_arc_lightning_arc_damage"			"伤害 :"
    "DOTA_Tooltip_ability_Ability_zuus_arc_lightning_jump_count"			"跳跃次数 :"
 */
@registerAbility()
export class Ability_zuus_arc_lightning extends TSBaseAbility {

    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0
    }

    /**选择目标时 */
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!this.isCanCast(target)) {
            return UnitFilterResult.FAIL_CUSTOM
        }
        // 不能是自己
        if (target.GetPlayerOwnerID() == this.GetCaster().GetPlayerOwnerID()) {
            this.m_strCastError = "AbilityError_SelfCant"
            return UnitFilterResult.FAIL_CUSTOM
        }
        return UnitFilterResult.SUCCESS
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
        const target = this.GetCursorTarget()
        const nRange = this.GetSpecialValueFor("range")
        const nCount = this.GetSpecialValueFor("jump_count")
        const fDelay = this.GetSpecialValueFor("jump_delay")
        const nDamage = this.GetSpecialValueFor("arc_damage")

        // 获取玩家
        const tabTarget = [this.GetCaster(), target]
        const tabTargetV3 = [this.GetCaster().GetAbsOrigin(), target.GetAbsOrigin()]
        for (let i = 0; i < nCount; i++) {
            const eCur = tabTarget[tabTarget.length - 1] as CDOTA_BaseNPC_BZ
            const tab: Player[] = []
            GameRules.PlayerManager.findRangePlayer(tab, eCur.m_path, nRange, 0, (player: Player) => {
                if (player == oPlayer
                    || !this.checkTarget(player.m_eHero)
                    || tabTarget.indexOf(player.m_eHero) > -1) {
                    return false
                }
                return true
            })
            // 获取最近的玩家
            let playerMin: Player
            let nMin: number
            for (const v of tab) {
                const nDis = (v.m_eHero.GetAbsOrigin() - target.GetAbsOrigin() as Vector).Length()
                if (!nMin || nDis < nMin) {
                    nMin = nDis
                    playerMin = v
                }
            }
            if (playerMin) {
                tabTarget.push(playerMin.m_eHero)
                tabTargetV3.push(playerMin.m_eHero.GetAbsOrigin())
            } else {
                break
            }
        }

        function onDamage(nIDCur: number) {
            // 特效
            const nPtclID = AHMC.CreateParticle("particles/units/heroes/hero_zuus/zuus_arc_lightning_head.vpcf"
                , ParticleAttachment.POINT_FOLLOW, false, tabTarget[nIDCur], 1)
            ParticleManager.SetParticleControl(nPtclID, 1, tabTargetV3[nIDCur - 1])
            ParticleManager.SetParticleControl(nPtclID, 0, tabTargetV3[nIDCur])
            if (nIDCur == 1) {
                EmitGlobalSound("Hero_Zuus.ArcLightning.Cast")
            } else {
                EmitGlobalSound("Hero_Zuus.ArcLightning.Target")
            }
            // 对玩家造成伤害
            AHMC.Damage(this.GetCaster(), tabTarget[nIDCur], nDamage, this.GetAbilityDamageType(), this)
        }

        // 释放闪电
        for (let i = 1; i < tabTarget.length; i++) {
            const nIDCur = i
            const nTime = fDelay * (nIDCur - 2)
            if (nTime > 0) {
                Timers.CreateTimer(nTime, () => {
                    onDamage(nIDCur)
                })
            } else {
                onDamage(nIDCur)
            }
        }

        // 触发耗蓝
        GameRules.EventManager.FireEvent("Event_HeroManaChange", { player: oPlayer, oAblt: this })
        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this)
    }
}