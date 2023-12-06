import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';

/**
 * 洞察烟斗，3500，1000斗篷+500回复戒指+1000治疗指环+1000卷轴，30%魔抗，18%回血
 * bonus_magical_armor 30	health_regen_hero 18	health_regen_bz 18	resist_perct 35
 * 技能：切换
 */
@registerAbility()
export class item_qtg_pipe extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
    CastFilterResult(): UnitFilterResult {
        if (!IsServer()) return;
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM;
        }
        return UnitFilterResult.SUCCESS;
    }
    OnSpellStart(): void {
        print('===item_qtg_pipe===OnSpellStart');
    }
}

@registerModifier()
export class item_qtg_pipe_modifier extends BaseModifier {
    health_regen_hero: number;
    health_regen_bz: number;
    bonus_magical_armor: number;
    eventID: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.health_regen_hero = this.GetAbility().GetSpecialValueFor('health_regen_hero');
        this.health_regen_bz = this.GetAbility().GetSpecialValueFor('health_regen_bz');
        this.bonus_magical_armor = this.GetAbility().GetSpecialValueFor('bonus_magical_armor');

        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) {
            // 英雄回血
            this.eventID = GameRules.EventManager.Register('Event_ItemHuiXueByRound', (event: { entity: CDOTA_BaseNPC_Hero; nHuiXue: number }) => {
                if (event.entity == this.GetCaster()) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    event.nHuiXue += event.entity.GetMaxHealth() * (this.health_regen_hero / 100);
                }
            });
        } else {
            // 兵卒回血
            this.eventID = GameRules.EventManager.Register('Event_ItemHuiXueByRound', (event: { entity: CDOTA_BaseNPC_BZ; nHuiXue: number }) => {
                if (event.entity == this.GetCaster()) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    event.nHuiXue += event.entity.GetMaxHealth() * (this.health_regen_bz / 100);
                }
            });
        }
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        GameRules.EventManager.UnRegisterByID(this.eventID);
        this.eventID = null;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MAGICAL_RESISTANCE_BONUS];
    }
    GetModifierMagicalResistanceBonus(): number {
        return this.bonus_magical_armor;
    }
}
