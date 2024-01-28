import { DamageEvent } from '../../player/player';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseAbility } from '../tsBaseAbilty';

/**
 *  DOTA_Tooltip_ability_Ability_life_stealer_feast,,盛宴
    DOTA_Tooltip_ability_Ability_life_stealer_feast_Description,,噬魂鬼每次攻击时还会根据目标最大生命值造成额外伤害，同时自身回复一定量的生命。被动地提供攻击速度加成。
    max_health_damage 1.2 1.7 2.3	max_health_heal 1.8 2.6 3.4	bonus_attack_speed 20 35 50
 */
@registerAbility()
export class Ability_life_stealer_feast extends TSBaseAbility {
    IsPassive(): boolean {
        return true;
    }
    GetIntrinsicModifierName(): string {
        return modifer_ability_life_stealer_feast.name;
    }
}

@registerModifier()
export class modifer_ability_life_stealer_feast extends BaseModifier {
    /**造成目标最大生命值的百分比伤害 */
    damage_pct: number;
    /**产生目标最大生命值的百分比回血 */
    heal_pct: number;
    IsHidden(): boolean {
        return true;
    }
    IsDebuff(): boolean {
        return false;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        this.damage_pct = this.GetAbility().GetSpecialValueFor('max_health_damage');
        this.heal_pct = this.GetAbility().GetSpecialValueFor('max_health_heal');

        if (!IsServer()) return;
        const parent = this.GetParent();
        GameRules.EventManager.Register('Event_OnDamage', (event: DamageEvent) => {
            if (event.bIgnore || event.bIgnoreRepeat) return;
            const attacker = EntIndexToHScript(event.entindex_attacker_const) as CDOTA_BaseNPC;
            if (attacker != parent) return;
            const victim = EntIndexToHScript(event.entindex_victim_const) as CDOTA_BaseNPC;

            if (event.damage > 0) {
                // 额外伤害加到此次攻击伤害里
                event.damage += victim.GetMaxHealth() * (this.damage_pct / 100);
            }
        });
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED, ModifierFunction.ATTACKSPEED_BONUS_CONSTANT];
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        // 命中后产生回血，无视折光，但是受闪避影响
        if (event.attacker != this.GetParent()) return;
        event.attacker.Heal(event.target.GetMaxHealth() * (this.heal_pct / 100), this.GetAbility());
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
    }
}
