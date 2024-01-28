import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';
import { TSBaseAbility } from '../tsBaseAbilty';

@registerAbility()
export class Ability_undying_tombstone_zombie_deathstrike extends TSBaseAbility {
    GetIntrinsicModifierName(): string {
        return modifier_ability_undying_tombstone_zombie_deathstrike.name;
    }
}

@registerModifier()
export class modifier_ability_undying_tombstone_zombie_deathstrike extends BaseModifier {
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
        if (!IsServer()) return;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.MOVESPEED_BONUS_PERCENTAGE, ModifierFunction.ON_ATTACK];
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_move_speed');
    }
    OnAttack(event: ModifierAttackEvent): void {
        if (!IsServer()) return;
        if (event.attacker != this.GetParent()) return;
        if (!IsValid(event.target)) return;

        AMHC.AddNewModifier(event.target, this.GetCaster(), this.GetAbility(), modifier_ability_undying_tombstone_zombie_deathstrike_debuff.name, {
            duration: this.GetAbility().GetSpecialValueFor('duration'),
        });
    }
}

@registerModifier()
export class modifier_ability_undying_tombstone_zombie_deathstrike_debuff extends BaseModifier {
    slow: number;
    sTimers: string[];
    IsHidden(): boolean {
        return false;
    }
    IsDebuff(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return true;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.slow * this.GetStackCount();
    }
    OnCreated(params: object): void {
        this.OnRefresh(params);
    }
    OnRefresh(params: object): void {
        if (!IsValid(this.GetAbility())) return;
        this.slow = this.GetAbility().GetSpecialValueFor('slow');
        if (IsServer()) {
            this.IncrementStackCount();
            if (!this.sTimers) this.sTimers = [];
            this.sTimers.push(
                Timers.CreateTimer(params['duration'], () => {
                    if (IsValid(this)) this.DecrementStackCount();
                })
            );
        }
    }
    OnDestroy(): void {
        if (IsServer()) {
            for (const timer of this.sTimers) {
                Timers.RemoveTimer(timer);
            }

            const owner = this.GetParent();
            if (owner.IsRealHero()) ParaAdjuster.ModifyMana(owner);
        }
    }
}
