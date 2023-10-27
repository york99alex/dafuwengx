import { PS_AbilityImmune, PS_AtkMonster, PS_Die, PS_InPrison } from "../../mode/gamemessage";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { Player } from "../../player/player";
import { AHMC, IsValid } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 	"DOTA_Tooltip_ability_Ability_lina_light_strike_array"					"光击阵"
    "DOTA_Tooltip_ability_Ability_lina_light_strike_array_Description"		"召唤柱状火焰伤害并眩晕敌人。目标地为中心的%range%格范围。"
    "DOTA_Tooltip_ability_Ability_lina_light_strike_array_Lore"			"莉娜的精华让她能够集中太阳的能量，随时让空气燃烧。"
    "DOTA_Tooltip_ability_Ability_lina_light_strike_array_light_strike_array_damage"			"伤害 :"
    "DOTA_Tooltip_ability_Ability_lina_light_strike_array_range"			"范围格数 :"
    "DOTA_Tooltip_ability_Ability_lina_light_strike_array_light_strike_array_stun_duration"	"眩晕回合 :"
    "DOTA_Tooltip_Modifier_Ability_lina_light_strike_array"						"光击阵"
    "DOTA_Tooltip_Modifier_Ability_lina_light_strike_array_Description"			"眩晕 <font color='#FF0000'>%dMODIFIER_PROPERTY_BONUS_DAY_VISION%</font> 回合 ：跳过自身回合无法操作。兵卒眩晕无法攻击，无法触发攻城。"
 */
@registerAbility()
export class Ability_lina_light_strike_array extends TSBaseAbility {

    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0
    }

    /**
     * 选择目标地点时
     * @param location 
     */
    CastFilterResultLocation(location: Vector): UnitFilterResult {
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM
        }
        if (IsServer() && GameRules.PathManager && GameRules.PathManager.m_tabPaths) {
            const path = GameRules.PathManager.getClosePath(location)
            const dis = (location - path.m_entity.GetAbsOrigin() as Vector).Length2D()
            if (dis < 150) {
                this.m_pathTarget = path
                return UnitFilterResult.SUCCESS
            }
            this.m_strCastError = "AbilityError_TargetNotPath"
            return UnitFilterResult.FAIL_CUSTOM
        } else {
            return UnitFilterResult.SUCCESS
        }
    }

    /**开始施法 */
    OnAbilityPhaseStart(): boolean {
        EmitGlobalSound("Ability.PreLightStrikeArray")
        // 切换至wait状态停止计时
        GameRules.GameLoop.Timer(() => {
            GameRules.GameLoop.GameStateService.send("towait")
            return null
        }, 0)
        return true
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        // 切换至waitoprt,恢复计时
        GameRules.GameLoop.Timer(() => {
            GameRules.GameLoop.GameStateService.send("towaitoprt")
            return null
        }, 0)

        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
        const nRange = this.GetSpecialValueFor("range")

        // 特效
        let path = GameRules.PathManager.getNextPath(this.m_pathTarget, -math.floor((nRange - 1) * 0.5))
        for (let i = 0; i < nRange; i++) {
            if (path && path.m_entity) {
                const nPtclID = AHMC.CreateParticle("particles/units/heroes/hero_lina/lina_spell_light_strike_array.vpcf"
                    , ParticleAttachment.POINT, false, oPlayer.m_eHero, 1)
                ParticleManager.SetParticleControl(nPtclID, 0, path.m_entity.GetAbsOrigin())
                ParticleManager.SetParticleControl(nPtclID, 1, Vector(150, 1, 1))
            }
            path = GameRules.PathManager.getNextPath(path, 1)
        }

        // 获取施法位置作用格数内的玩家
        const tabPlayer: Player[] = []
        GameRules.PlayerManager.findRangePlayer(tabPlayer, this.m_pathTarget, nRange, null, (player: Player) => {
            if (player == oPlayer
                || !this.checkTarget(player.m_eHero)
                || 0 < bit.band(PS_AbilityImmune + PS_Die + PS_InPrison + PS_AtkMonster, player.m_nPlayerState)) {
                return false
            }
            return true
        })

        // 对玩家造成伤害
        const nDamage = this.GetSpecialValueFor("light_strike_array_damage")
        const nDuration = this.GetSpecialValueFor("light_strike_array_stun_duration")
        const caster = this.GetCaster()
        for (const player of tabPlayer) {
            AHMC.Damage(caster, player.m_eHero, nDamage, this.GetAbilityDamageType(), this)
            // 设置眩晕回合
            player.setPass(nDuration)
            // 设置眩晕BUFF
            for (const eBZ of player.m_tabBz) {
                AbilityManager.setCopyBuff(modifier_ability_lina_light_strike_array.name
                    , eBZ, caster, this)
            }
            const buff = AbilityManager.setCopyBuff(modifier_ability_lina_light_strike_array.name
                , player.m_eHero, caster, this)
            // 兵卒创建更新buff
            if (buff) {
                buff["updateBZBuffByCreate"] = AbilityManager.updateBZBuffByCreate(player, null, (eBZ: CDOTA_BaseNPC_BZ) => {
                    AbilityManager.setCopyBuff(modifier_ability_lina_light_strike_array.name
                        , eBZ, caster, this)
                })
            }
        }
    }
}

@registerModifier()
export class modifier_ability_lina_light_strike_array extends BaseModifier {

    m_nDuration: number
    m_nRound: number

    IsDebuff(): boolean {
        return true
    }

    IsStunDebuff(): boolean {
        return true
    }

    IsPurgable(): boolean {
        return false
    }

    GetTexture(): string {
        return "lina_light_strike_array"
    }

    GetEffectName(): string {
        return "particles/generic_gameplay/generic_stunned.vpcf"
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW
    }

    OnCreated(params: object): void {
        this.m_nDuration = this.GetAbility().GetSpecialValueFor("light_strike_array_stun_duration")
        if (IsServer() && IsValid(this.GetCaster())) {
            this.m_nRound = this.m_nDuration
            AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this)
            // 兵卒被眩晕结束攻城
            if (this.GetParent().IsRealHero() && (this.GetParent() as CDOTA_BaseNPC_BZ).m_path) {
                if ((this.GetParent() as CDOTA_BaseNPC_BZ).m_path.m_nPlayerIDGCLD) {
                    (this.GetParent() as CDOTA_BaseNPC_BZ).m_path.atkCityEnd(false)
                }
            }
        }
    }

    OnDestroy(): void {
        if (this["updateBZBuffByCreate"]) {
            this["updateBZBuffByCreate"]()
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.OVERRIDE_ANIMATION
            , ModifierFunction.BONUS_DAY_VISION]
    }

    GetOverrideAnimation(): GameActivity {
        return GameActivity.DOTA_DISABLED
    }

    GetBonusDayVision(): number {
        return this.m_nDuration
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.STUNNED]: true
        }
    }
}