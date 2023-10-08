import { CardManager } from "../../card/cardmanager";
import { CameraManage } from "../../mode/CameraManage";
import { GameMessage } from "../../mode/gamemessage";
import { Player } from "../../player/player";
import { AHMC } from "../../utils/amhc";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";
/**
 * // 技能：幻影突袭    英雄：幻影刺客 PA
    "DOTA_Tooltip_ability_Ability_phantom_strike_Description" "闪烁到一个目标身边，并攻击%attack_times%次。"
    "DOTA_Tooltip_ability_Ability_phantom_strike_attack_times" "攻击次数 :"
    "DOTA_Tooltip_ability_Ability_phantom_strike_range" "施法范围 :"
    "AbilityValues" {
        "attack_times" "1 2 3"
        "range" "900 1600 2000"
    }
 */
@registerAbility()
export class Ability_phantom_strike extends TSBaseAbility {

    constructor() {
        super()
        print("constructor()======幻影突袭")
    }

    /**
     * 选择无目标时
     */
    CastFilterResult(): UnitFilterResult {
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM
        }
        if (GameRules.PlayerManager != null) {
            // 如果是玩家英雄
            const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
            if (oPlayer != null) {
                // 获取前进区域最近玩家
                if (GameRules.PlayerManager.findClosePlayer(oPlayer, this.filterTarget, -1) == null) {
                    // 没有有效攻击目标
                    this.m_strCastError = "AbilityError_NoTarget"
                    return UnitFilterResult.FAIL_CUSTOM
                }
            }
        }
        return UnitFilterResult.SUCCESS
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
        print("开始释放技能===Ability_phantom_strike")
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())

        // 判断是否选择目标
        const oPlayerTarget: Player = this.GetCursorTarget() != undefined ? GameRules.PlayerManager.getPlayer(this.GetCursorTarget().GetPlayerOwnerID()) : GameRules.PlayerManager.findClosePlayer(oPlayer, this.filterTarget, 1)
        if (oPlayerTarget == null) {
            return
        }

        // 音效
        EmitGlobalSound("Hero_PhantomAssassin.Strike.Start")

        // 创建闪烁特效
        const cPtclID1 = AHMC.CreateParticle("particles/units/heroes/hero_phantom_assassin/phantom_assassin_loadout.vpcf", ParticleAttachment.POINT, false, oPlayer.m_eHero, 3)
        ParticleManager.SetParticleControl(cPtclID1, 0, oPlayer.m_eHero.GetAbsOrigin())
        ParticleManager.ReleaseParticleIndex(cPtclID1)
        const cPtclID2 = AHMC.CreateParticle("particles/units/heroes/hero_phantom_assassin/phantom_assassin_loadout.vpcf", ParticleAttachment.RENDERORIGIN_FOLLOW, false, oPlayer.m_eHero, 3)
        ParticleManager.SetParticleControl(cPtclID2, 0, oPlayerTarget.m_eHero.GetOrigin())
        ParticleManager.ReleaseParticleIndex(cPtclID2)

        // 设置自身pos至目标身后
        oPlayer.m_eHero.SetOrigin(oPlayerTarget.m_eHero.GetOrigin() - oPlayerTarget.m_eHero.GetForwardVector() * 100 as Vector)
        FindClearSpaceForUnit(oPlayer.m_eHero, oPlayer.m_eHero.GetOrigin(), true)
        oPlayer.m_eHero.SetAngles(0, oPlayerTarget.m_eHero.GetAnglesAsVector().y, 0)
        oPlayer.setPath(oPlayerTarget.m_pathCur)
        CameraManage.LookAt(oPlayer.m_nPlayerID, oPlayer.m_eHero.GetAbsOrigin(), 0.1)

        // 攻击
        const typeTeam = oPlayerTarget.m_eHero.GetTeamNumber()
        oPlayerTarget.m_eHero.SetTeam(DotaTeam.BADGUYS)
        oPlayer.setPlayerState(GameMessage.PS_AtkHero)
        Timers.CreateTimer(0.5, () => {
            oPlayer.m_eHero.MoveToTargetToAttack(oPlayerTarget.m_eHero)

            // 攻击结束移动到目标所在路径
            let tEventID = []
            function atkEnd() {
                print("进入atkEnd()======幻影突袭")
                if (tEventID) {
                    for (const ID of tEventID) {
                        GameRules.EventManager.UnRegisterByID(ID)
                    }
                    tEventID = null
                    oPlayerTarget.m_eHero.SetTeam(typeTeam)
                    oPlayer.setPlayerState(-GameMessage.PS_AtkHero)
                    oPlayer.moveToPath(oPlayerTarget.m_pathCur)
                }
            }

            tEventID.push(GameRules.EventManager.Register("Event_Atk", (tEvent) => {
                if (tEvent.entindex_attacker_const == oPlayer.m_eHero.GetEntityIndex()) {
                    atkEnd()
                    return true
                }
            }))
            Timers.CreateTimer(oPlayer.m_eHero.GetAttackAnimationPoint() * (this.GetSpecialValueFor("attack_times") + 0.9), () => atkEnd())
        })

        // 触发耗蓝
        GameRules.EventManager.FireEvent("Event_HeroManaChange", { player: oPlayer, oAblt: this })

        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this)
    }

    filterTarget(player: Player) {
        if (player.m_eHero == this.GetCaster()   // 自身
            || !this.checkTarget(player.m_eHero)
            || 0 < bit.band(
                GameMessage.PS_InPrison       // 入狱
                + GameMessage.PS_Invis          // 隐身
                + GameMessage.PS_AtkHero
                + GameMessage.PS_AtkMonster
                , player.m_nPlayerState)) {
            return false
        }
        return true
    }
}