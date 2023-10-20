import { Player } from "../../player/player";
import { AHMC } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
        "DOTA_Tooltip_ability_Ability_pudge_rot"						"腐烂"
        "DOTA_Tooltip_ability_Ability_pudge_rot_Description"			"<font color='#4169E1'>开启/关闭</font> 持续性的毒性云雾，移动阶段伤害经过的英雄，并使其移速减缓。\n移动期间产生过伤害，消耗 <font color='#1E90FF'>■</font> <font color='#FFFFFF'><b>1</b></font>。"
        "DOTA_Tooltip_ability_Ability_pudge_rot_Lore"				"从屠夫腐烂肿胀的肉体中放出的有毒气体，气体恶心的令人窒息。"
        "DOTA_Tooltip_ability_Ability_pudge_rot_range"				"作用范围 :"
        "DOTA_Tooltip_ability_Ability_pudge_rot_damage"				"伤害 :"
        "DOTA_Tooltip_ability_Ability_pudge_rot_rot_slow"			"%减速 :"
            "AbilityError_NeedMana_1"		"至少需要1点魔法"
        "DOTA_Tooltip_modifier_Ability_pudge_rot_debuff"				"腐烂"
        "DOTA_Tooltip_modifier_Ability_pudge_rot_debuff_Description"	"被腐烂减速<font color='#FF0000'>%dMODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE%%%</font>"

 */
@registerAbility()
export class Ability_pudge_rot extends TSBaseAbility {
    m_tabPtclID: ParticleID[] = []

    /**施法距离 */
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return this.GetSpecialValueFor("range")
    }

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM
        }

        // 至少需要1点魔法
        if (this.GetCaster().GetMana() < 1) {
            this.m_strCastError = "AbilityError_NeedMana_1"
            return UnitFilterResult.FAIL_CUSTOM
        }
        return UnitFilterResult.SUCCESS
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        if (this.m_tabPtclID.length == 0) {
            print("OnSpellStart_pudge_rot_腐烂开启")
            // 开启腐烂
            this.m_tabPtclID[0] = AHMC.CreateParticle("particles/units/heroes/hero_pudge/pudge_rot.vpcf"
                , ParticleAttachment.POINT_FOLLOW, false, this.GetCaster())

            const nRange = this.GetSpecialValueFor("range")
            ParticleManager.SetParticleControl(this.m_tabPtclID[0], 1, Vector(nRange, 0, 0))    // 范围
            print("OnSpellStart_pudge_rot_0")
            // 注册移动监听
            GameRules.EventManager.Register("Event_Move", (event: { entity: CDOTA_BaseNPC_Hero }) => this.onEvent_Move(event), this)
            // 注册英雄魔法修改
            GameRules.EventManager.Register("Event_HeroManaChange", (event: { player: Player, oAblt: TSBaseAbility }) => this.onEvent_HeroManaChange(event), this)

            // 音效
            EmitSoundOn("Hero_Pudge.Rot", this.GetCaster())
            Timers.CreateTimer(2, () => {
                StopSoundOn("Hero_Pudge.Rot", this.GetCaster())
            })
        } else {
            print("OnSpellStart_pudge_rot_腐烂关闭")
            // 关闭
            for (const nPtclID of this.m_tabPtclID) {
                ParticleManager.DestroyParticle(nPtclID, false)
            }
            this.m_tabPtclID = []

            StopSoundOn("Hero_Pudge.Rot", this.GetCaster())

            GameRules.EventManager.UnRegister("Event_Move", (event: { entity: CDOTA_BaseNPC_Hero }) => this.onEvent_Move(event))
            GameRules.EventManager.UnRegister("Event_HeroManaChange", (event: { player: Player, oAblt: TSBaseAbility }) => this.onEvent_HeroManaChange(event))
        }
    }

    /**移动监听回调 */
    onEvent_Move(event: {
        entity: CDOTA_BaseNPC_Hero
    }) {
        print("OnSpellStart_pudge_rot_0.1")

        if (!this.checkTarget(event.entity)) {
            return
        }
        print("OnSpellStart_pudge_rot_1")

        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())
        if (!oPlayer) {
            return
        }
        print("OnSpellStart_pudge_rot_2")

        const nRange = this.GetSpecialValueFor("range")
        const nDamage = this.GetSpecialValueFor("damage")
        const nTime = this.GetSpecialValueFor("time_damage")

        // 监听移动结束
        let bMoveEnd = false
        GameRules.EventManager.Register("Event_MoveEnd", (endEvent: { entity: CDOTA_BaseNPC_Hero }) => {
            if (event.entity == endEvent.entity) {
                bMoveEnd = true
                if (this.GetCaster().GetMana() == 0) {
                    // 魔法耗尽, 结束技能
                    if (this.m_tabPtclID.length > 0) {
                        this.OnSpellStart()
                    }
                }
                return true
            }
        })
        print("OnSpellStart_pudge_rot_3")

        let bUseMana = false  // 是否扣了蓝
        /**对敌人的检测 */
        const funcCheck = (enemy: CDOTA_BaseNPC) => {
            print("OnSpellStart_pudge_rot_4, bMoveEnd:", bMoveEnd)

            // 持续判断范围
            Timers.CreateTimer(() => {
                if (bMoveEnd) {
                    // 移动结束, 结束检测
                    enemy.RemoveModifierByName("modifier_Ability_pudge_rot_debuff")
                    return null
                }

                // 判断距离
                const nDis = (enemy.GetAbsOrigin() - this.GetCaster().GetAbsOrigin() as Vector).Length()
                if (nDis > nRange) {
                    enemy.RemoveModifierByName("modifier_Ability_pudge_rot_debuff")
                    return 0.1
                }
                print("OnSpellStart_pudge_rot_5")

                // 范围内对敌人造成伤害
                AHMC.Damage(this.GetCaster(), enemy, nDamage, this.GetAbilityDamageType(), this)
                enemy.AddNewModifier(this.GetCaster(), this, modifier_Ability_pudge_rot_debuff.name, null)

                // 检测耗蓝
                if (!bUseMana) {
                    bUseMana = true
                    this.GetCaster().SpendMana(1, this)
                    print("OnSpellStart_pudge_rot_6")

                }
            })
        }

        if (this.GetCaster() == event.entity) {
            print("OnSpellStart_pudge_rot_7")

            // 自己移动, 伤害全部敌人英雄
            for (const player of GameRules.PlayerManager.m_tabPlayers) {
                if (event.entity != player.m_eHero) {
                    funcCheck(player.m_eHero)
                }
            }
        } else {
            print("OnSpellStart_pudge_rot_8")
            // 敌人移动
            funcCheck(event.entity)
        }
    }

    /**英雄魔法修改回调 */
    onEvent_HeroManaChange(event: {
        player: Player,
        oAblt: TSBaseAbility
    }) {
        if (event.player.m_eHero != this.GetCaster()) {
            return
        }
        if (event.oAblt != this) {
            return
        }
        if (this.GetCaster().GetMana() < 1) {
            // 没蓝就关闭技能
            if (this.m_tabPtclID.length! + 0) {
                this.OnSpellStart()
            }
        }
    }

    isCanCDSub(): boolean {
        return false
    }

    isCanManaSub(): boolean {
        return false
    }

    isCanCastSelf(): boolean {
        return true
    }
}

/**腐烂范围减速 */
@registerModifier()
export class modifier_Ability_pudge_rot_aura extends BaseModifier {
    IsDebuff(): boolean {
        return true
    }

    IsPurgable(): boolean {
        return false
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE]
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.GetAbility().GetSpecialValueFor("rot_slow")
    }
}

/** */
@registerModifier()
export class modifier_Ability_pudge_rot_debuff extends BaseModifier {
    IsHidden(): boolean {
        return true
    }

    IsPurgable(): boolean {
        return false
    }

    IsAura(): boolean {
        return true
    }

    GetModifierAura(): string {
        return "modifier_Ability_pudge_rot_aura"
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return UnitTargetTeam.FRIENDLY
    }

    GetAuraSearchType(): UnitTargetType {
        return UnitTargetType.HERO
    }

    GetAuraRadius(): number {
        return this.GetAbility().GetSpecialValueFor("range")
    }
}