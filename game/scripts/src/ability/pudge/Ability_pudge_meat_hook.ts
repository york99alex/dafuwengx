import { PS_AtkHero, PS_AtkMonster, PS_InPrison, PS_Invis } from "../../mode/gamemessage";
import { Player } from "../../player/player";
import { AHMC } from "../../utils/amhc";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 		"DOTA_Tooltip_ability_Ability_pudge_meat_hook"				"肉钩"
        "DOTA_Tooltip_ability_Ability_pudge_meat_hook_Description"	"向英雄射出血腥的肉钩，并将它拖到帕吉的身边。"
        "DOTA_Tooltip_ability_Ability_pudge_meat_hook_Lore"			"屠夫的肉钩是噩梦的象征，锋利的倒钩暗示了他嗜血的本性。"
        "DOTA_Tooltip_ability_Ability_pudge_meat_hook_damage"		"伤害 :"
 */
@registerAbility()
export class Ability_pudge_meat_hook extends TSBaseAbility {

    /**选择目标时 */
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM
        }
        if (IsServer()) {
            this.m_strCastError = "ERROR"
            const playerTarget = GameRules.PlayerManager.getPlayer(target.GetPlayerOwnerID())
            if (!this.filterTarget(playerTarget)) {
                return UnitFilterResult.FAIL_CUSTOM
            }
        }
        return UnitFilterResult.SUCCESS
    }

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM
        }

        if (GameRules.PlayerManager) {
            // 获取随机玩家
            const tabPlayer = GameRules.PlayerManager.findRandomPlayer(1, this.filterTarget)
            if (!tabPlayer || tabPlayer.length != 1) {
                // 没有有效攻击目标
                this.m_strCastError = "AbilityError_TargetNull"
                return UnitFilterResult.FAIL_CUSTOM
            }
        }
        return UnitFilterResult.SUCCESS
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
        const hTarget = this.GetCursorTarget()
        let oPlayerTarget: Player
        if (IsValidEntity(hTarget)) {
            oPlayerTarget = GameRules.PlayerManager.getPlayer(hTarget.GetPlayerOwnerID())
        }
        if (!oPlayerTarget) {
            // 获取随机玩家
            const tabPlayer = GameRules.PlayerManager.findRandomPlayer(1, this.filterTarget)
            if (!tabPlayer || tabPlayer.length != 1) {
                return
            }
            oPlayerTarget = tabPlayer[0]
        }

        const nDamage = this.GetSpecialValueFor("damage")

        // 计算运动
        const nFps = 30
        const nFpsTime = 1 / nFps
        const v3Dis = oPlayerTarget.m_eHero.GetAbsOrigin() - this.GetCaster().GetAbsOrigin() as Vector
        let nTime = math.floor(math.floor(v3Dis.Length() / 500) * 0.2 * nFps)  // 每500码耗时0.2秒
        if (nTime > nFps * 2) {
            nTime = math.floor(nFps * 2)
        } else if (nTime <= nFps * 0.2) {
            nTime = math.floor(nFps * 0.2)
        }
        const v3Speed = v3Dis / nTime
        let v3Cur = this.GetCaster().GetAbsOrigin()
        let nTimeCur = nTime

        // 创建肉钩特效
        const nPtclID = AHMC.CreateParticle("particles/econ/items/pudge/pudge_trapper_beam_chain/pudge_nx_meathook.vpcf"
            , ParticleAttachment.CUSTOMORIGIN, false, this.GetCaster(), nFpsTime * nTime * 2)
        ParticleManager.SetParticleControlEnt(nPtclID, 0, this.GetCaster(), ParticleAttachment.POINT_FOLLOW, "attach_weapon_chain_rt", this.GetCaster().GetAbsOrigin(), true)
        ParticleManager.SetParticleControl(nPtclID, 3, Vector(5, 0, 0)) // 持续时间
        this.GetCaster().StartGesture(GameActivity.DOTA_OVERRIDE_ABILITY_1) // 出钩动作
        EmitSoundOn("Hero_Pudge.AttackHookExtend", oPlayer.m_eHero)
        Timers.CreateTimer(0, () => {
            v3Cur = v3Cur + v3Speed as Vector
            ParticleManager.SetParticleControl(nPtclID, 6, v3Cur)
            ParticleManager.SetParticleControl(nPtclID, 1, v3Cur)
            nTimeCur -= 1
            if (nTimeCur < 0)
                return

            // 钩到目标, 伤害
            AHMC.Damage(this.GetCaster(), oPlayerTarget.m_eHero, nDamage, this.GetAbilityDamageType(), this)

            // 拉回来
            this.GetCaster().RemoveGesture(GameActivity.DOTA_OVERRIDE_ABILITY_1)
            this.GetCaster().StartGesture(GameActivity.DOTA_CHANNEL_ABILITY_1)  // 收钩动作
            StopSoundOn("Hero_Pudge.AttackHookExtend", oPlayer.m_eHero)
            EmitSoundOn("Hero_Pudge.AttackHookImpact", oPlayer.m_eHero)
            EmitSoundOn("Hero_Pudge.AttackHookRetract", oPlayer.m_eHero)
            Timers.CreateTimer(0, () => {
                v3Cur = v3Cur - v3Speed as Vector
                ParticleManager.SetParticleControl(nPtclID, 6, v3Cur)
                ParticleManager.SetParticleControl(nPtclID, 1, v3Cur)
                oPlayerTarget.m_eHero.SetAbsOrigin(v3Cur)
                nTimeCur += 1
                if (nTimeCur < nTime) {
                    return nFpsTime
                }

                // 结束
                this.GetCaster().RemoveGesture(GameActivity.DOTA_CHANNEL_ABILITY_1)
                StopSoundOn("Hero_Pudge.AttackHookRetract", oPlayer.m_eHero)
                oPlayerTarget.blinkToPath(oPlayer.m_pathCur)
                return null
            })
            return null
        })

        // 触发耗蓝
        GameRules.EventManager.FireEvent("Event_HeroManaChange", { player: oPlayer, oAblt: this })
        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this)
    }

    /**过滤技能目标 */
    filterTarget(player: Player): boolean {
        if (player.m_eHero == this.GetCaster()   // 自身
            || !this.checkTarget(player.m_eHero)
            || 0 < bit.band(
                PS_InPrison       // 入狱
                + PS_Invis          // 隐身
                + PS_AtkHero
                + PS_AtkMonster
                , player.m_nPlayerState)) {
            return false
        }
        return true
    }
}