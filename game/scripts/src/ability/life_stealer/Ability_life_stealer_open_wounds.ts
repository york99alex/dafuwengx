import { DamageEvent } from '../../player/player';
import { AMHC } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';

/**
 *  DOTA_Tooltip_ability_Ability_life_stealer_open_wounds,,撕裂伤口
    DOTA_Tooltip_ability_Ability_life_stealer_open_wounds_Description,,噬魂鬼撕裂一个敌方单位，减缓受害者的移动速度，并使所有单位在攻击该受害者时造成一定比例原始伤害的额外伤害。额外伤害的来源和收益均为噬魂鬼本鬼。
    slow_pct -20 -25 -30	amplify 15 20 25	duration 1 1 2
 */
@registerAbility()
export class Ability_life_stealer_open_wounds extends TSBaseAbility {
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

        // 添加debuff
        AMHC.AddNewModifier(target, this.GetCaster(), this, modifier_ability_life_stealer_open_wounds.name, {});
        EmitGlobalSound('Hero_LifeStealer.OpenWounds.Cast');

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: oPlayer, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this);
    }
}

@registerModifier()
export class modifier_ability_life_stealer_open_wounds extends BaseModifier {
    m_nRound: number;
    amplify: number;
    slow_pct: number;
    eventID: number;
    IsDebuff(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return true;
    }
    GetTexture(): string {
        return 'life_stealer_open_wounds';
    }
    GetEffectName(): string {
        return 'particles/econ/items/lifestealer/ls_ti9_immortal/ls_ti9_open_wounds.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.POINT_FOLLOW;
    }
    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');
        this.amplify = this.GetAbility().GetSpecialValueFor('amplify');
        this.slow_pct = this.GetAbility().GetSpecialValueFor('slow_pct');

        if (!IsServer()) return;
        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);
        const ablity = this.GetAbility();
        const caster = ablity.GetCaster();

        this.eventID = GameRules.EventManager.Register(
            'Event_OnDamage',
            (event: DamageEvent) => {
                if (event.bIgnore || event.bIgnoreRepeat) return;

                if (event.damage > 0) {
                    const victim = EntIndexToHScript(event.entindex_victim_const) as CDOTA_BaseNPC;
                    if (victim.HasModifier(modifier_ability_life_stealer_open_wounds.name)) {
                        AMHC.Damage(caster, victim, (event.damage * this.amplify) / 100, event.damagetype_const, ablity, 1, {
                            bIgnoreRepeat: true,
                        });
                    }
                }
            },
            this,
            -10000
        );
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.slow_pct;
    }
}
