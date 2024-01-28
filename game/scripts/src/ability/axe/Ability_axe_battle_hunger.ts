import { Player } from '../../player/player';
import { AMHC } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';

/**
 * 
* 	"DOTA_Tooltip_ability_Ability_axe_battle_hunger"					"战斗威吓"
    "DOTA_Tooltip_ability_Ability_axe_battle_hunger_Description"		"恐吓一个敌方单位，降低他的攻击力，并且在其自身回合开始受到伤害。"
    "DOTA_Tooltip_ability_Ability_axe_battle_hunger_Lore"				"通常英雄无法抵挡蒙哥可汗的战斗狂怒，他们会一直畏惧，直到蒙哥可汗的狂怒平息。"
    "DOTA_Tooltip_ability_Ability_axe_battle_hunger_duration"				"持续回合 :"
    "DOTA_Tooltip_ability_Ability_axe_battle_hunger_bonus_atk"				"%攻击力降低 :"
    "DOTA_Tooltip_ability_Ability_axe_battle_hunger_damage"					"每回合伤害 "
    "DOTA_Tooltip_Modifier_Ability_axe_battle_hunger"						"战斗威吓"
    "DOTA_Tooltip_Modifier_Ability_axe_battle_hunger_Description"			"持续 <font color='#FF0000'>%dMODIFIER_PROPERTY_BONUS_NIGHT_VISION%</font> 回合：降低 <font color='#FF0000'>%dMODIFIER_PROPERTY_DAMAGEOUTGOING_PERCENTAGE%%%</font> 的攻击力，回合开始时受到 <font color='#FF0000'>%dMODIFIER_PROPERTY_BONUS_DAY_VISION%</font> 点魔法伤害，"
 */
@registerAbility()
export class Ability_axe_battle_hunger extends TSBaseAbility {
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0;
    }

    /**选择目标时 */
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!this.isCanCast(target)) {
            return UnitFilterResult.FAIL_CUSTOM;
        }

        // 不能是自己
        if (target.GetPlayerOwnerID() == this.GetCaster().GetPlayerOwnerID()) {
            this.m_strCastError = 'AbilityError_SelfCant';
            return UnitFilterResult.FAIL_CUSTOM;
        }
        return UnitFilterResult.SUCCESS;
    }

    /**开始技能效果 */
    OnSpellStart(): void {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        const target = this.GetCursorTarget();

        // 添加减攻击buff
        AbilityManager.setCopyBuff(modifier_ability_axe_battle_hunger.name, target, this.GetCaster(), this);
        EmitGlobalSound('Hero_Axe.Battle_Hunger');

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: oPlayer, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this);
    }
}

@registerModifier()
export class modifier_ability_axe_battle_hunger extends BaseModifier {
    m_tEventID: number[];
    m_nRound: number;
    m_nDamage: number;

    IsDebuff(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return true;
    }

    GetTexture(): string {
        return 'axe_battle_hunger';
    }

    GetEffectName(): string {
        return 'particles/units/heroes/hero_axe/axe_battle_hunger.vpcf';
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.DAMAGEOUTGOING_PERCENTAGE, ModifierFunction.BONUS_DAY_VISION, ModifierFunction.BONUS_NIGHT_VISION];
    }

    OnDestroy(): void {
        if (IsClient()) return;
        GameRules.EventManager.FireEvent('modifier_ability_axe_battle_hunger', this);
        GameRules.EventManager.UnRegisterByIDs(this.m_tEventID);
    }

    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');
        this.m_nDamage = this.GetAbility().GetSpecialValueFor('damage');

        if (IsClient()) return;

        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);

        this.m_tEventID = [];
        // 检测目标玩家每轮开始
        this.m_tEventID.push(
            GameRules.EventManager.Register('Event_PlayerRoundBegin', (event: { oPlayer: Player }) => {
                if (!this) {
                    return true;
                }
                if (this.GetParent().GetPlayerOwnerID() != event.oPlayer.m_nPlayerID) {
                    return;
                }
                // 造成伤害
                AMHC.Damage(this.GetCaster(), this.GetParent(), this.m_nDamage, this.GetAbility().GetAbilityDamageType(), this.GetAbility());
            })
        );
    }

    GetModifierDamageOutgoing_Percentage(event: ModifierAttackEvent): number {
        return this.GetAbility().GetSpecialValueFor('bonus_atk');
    }

    GetBonusDayVision(): number {
        return this.m_nDamage;
    }

    GetBonusNightVision(): number {
        return this.m_nRound;
    }
}
