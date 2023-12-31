import { PS_AbilityImmune, PS_AtkMonster, PS_Die, PS_InPrison } from "../../constants/gamemessage";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { Player } from "../../player/player";
import { AMHC } from "../../utils/amhc";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 	"DOTA_Tooltip_ability_Ability_meepo_poof"				"忽悠"
    "DOTA_Tooltip_ability_Ability_meepo_poof_Description"	"通过从大地中汲取神秘的能量，一个米波可以在施法1.5秒后传送至另一个米波或自身所在之处，在离开和到达的区域都造成伤害。"
    "DOTA_Tooltip_ability_Ability_meepo_poof_Lore"			"有时候打碎一块影墟水晶可以作为自己摆脱陷阱的方法，或者是另外一个自己。"
    "DOTA_Tooltip_ability_Ability_meepo_poof_range"			"作用格数 :"
    "DOTA_Tooltip_ability_Ability_meepo_poof_poof_damage"	"忽悠伤害 :"
    "AbilityError_not_meepo"								"目标不是米波"
 */
@registerAbility()
export class Ability_meepo_poof extends TSBaseAbility {

    /**选择目标时 */
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!this.isCanCast(target)) {
            return UnitFilterResult.FAIL_CUSTOM
        }
        if (GameRules.GameConfig != null) {
            // 判断目标是否是米波
            if (target.GetModelName() != "models/heroes/meepo/meepo.vmdl") {
                this.m_strCastError = "AbilityError_not_meepo"
                return UnitFilterResult.FAIL_CUSTOM
            }
        }
        return UnitFilterResult.SUCCESS
    }

    /**开始施法 */
    OnAbilityPhaseStart(): boolean {
        print("===meepo_poof_OnAbilityPhaseStart===0")
        if (IsServer()) {
            GameRules.GameLoop.GameStateService.send("towait")
            this.yieldWait = true
        }
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
        print("===meepo_poof_OnAbilityPhaseStart===1_oPlayer:", oPlayer.m_eHero.GetUnitName())

        // 声音
        EmitGlobalSound("Hero_Meepo.Poof.Channel")

        // 离开持续施法特效
        const nPtclID = AMHC.CreateParticle("particles/units/heroes/hero_meepo/meepo_poof_start.vpcf"
            , ParticleAttachment.POINT, false, oPlayer.m_eHero, 3)
        ParticleManager.SetParticleControl(nPtclID, 0, oPlayer.m_eHero.GetAbsOrigin())
        ParticleManager.ReleaseParticleIndex(nPtclID)
        print("===meepo_poof_OnAbilityPhaseStart===2")
        return true
    }

    OnAbilityPhaseInterrupted(): void {
        print("===meepo_poof_OnAbilityPhaseInterrupted===0")
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        print("===meepo_poof_OnSpellStart===0")
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
        const eTarget = this.GetCursorTarget()

        // 离开的遁地特效
        const nPtclID = AMHC.CreateParticle("particles/units/heroes/hero_meepo/meepo_loadout.vpcf"
            , ParticleAttachment.POINT, false, oPlayer.m_eHero, 3)

        // 获取施法位置作用格数内的玩家
        const nRange = this.GetSpecialValueFor("range")
        let tabPlayer: Player[] = []
        GameRules.PlayerManager.findRangePlayer(tabPlayer, oPlayer.m_pathCur, nRange, null, (player: Player) => {
            if (player == oPlayer
                || bit.band(
                    PS_AbilityImmune
                    + PS_Die
                    + PS_InPrison
                    + PS_AtkMonster, player.m_nPlayerState) > 0) {
                return false    //  排除死亡,自身,技能免疫
            }
            return true
        })

        tabPlayer.forEach((player: Player) => {
            print("===meepo_poof_OnSpellStart===tabPlayer_", player.m_nPlayerID, "name:", player.m_eHero.GetUnitName())
        })

        print("===meepo_poof_OnSpellStart===1")
        // 对玩家造成伤害
        this.atk(tabPlayer)

        print("===meepo_poof_OnSpellStart===2")
        oPlayer.m_eHero.SetOrigin(oPlayer.m_eHero.GetOrigin() - Vector(0, 9999, 9999) as Vector)
        print("===meepo_poof_OnSpellStart===3")
        Timers.CreateTimer(0.5, () => {
            print("===meepo_poof_OnSpellStart===4")
            // 再现的遁地特效
            if (eTarget.IsRealHero()) {
                oPlayer.blinkToPath(GameRules.PlayerManager.getPlayer(eTarget.GetPlayerOwnerID()).m_pathCur)
            } else {
                oPlayer.blinkToPath((eTarget as CDOTA_BaseNPC_BZ).m_path)
            }
            const nPtclID2 = AMHC.CreateParticle("particles/units/heroes/hero_meepo/meepo_loadout.vpcf"
                , ParticleAttachment.POINT, false, oPlayer.m_eHero, 3)

            // 再现声音
            EmitGlobalSound("Hero_Meepo.Poof.End")

            // 获取目标位置作用格数内的玩家
            tabPlayer = []
            if (!eTarget.IsRealHero()) {
                const bzPath = (eTarget as CDOTA_BaseNPC_BZ).m_path
                GameRules.PlayerManager.findRangePlayer(tabPlayer, bzPath, nRange, null, (player) => {
                    if (player == oPlayer
                        || !this.checkTarget(player.m_eHero)) {
                        return false
                    }
                    return true
                })
            }
            print("===meepo_poof_OnSpellStart===5")
            tabPlayer.forEach((player: Player) => {
                print("===meepo_poof_OnSpellStart Leave===tabPlayer_", player.m_nPlayerID, "name:", player.m_eHero.GetUnitName())
            })
            // 对玩家造成伤害
            this.atk(tabPlayer)
            print("===meepo_poof_OnSpellStart===6")

            // 重置状态
            GameRules.GameLoop.GameStateService.send("towaitoprt")
            this.yieldWait = null
        })

        // 触发耗蓝
        GameRules.EventManager.FireEvent("Event_HeroManaChange", { player: oPlayer, oAblt: this })

        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this)
    }


    atk(tabPlayer: Player[]) {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())

        // 获取伤害数值
        let nDamage = this.GetSpecialValueFor("poof_damage")
        const cBuff = oPlayer.getBuffByName("modifier_meepo_ransack")
        if (cBuff) {
            nDamage += cBuff.GetStackCount()
        }
        // 造成伤害
        for (const player of tabPlayer) {
            if (player != oPlayer) {
                AMHC.Damage(this.GetCaster(), player.m_eHero, nDamage, this.GetAbilityDamageType(), this)
            }
        }
    }

    isCanCastSelf(): boolean {
        return true
    }
}
