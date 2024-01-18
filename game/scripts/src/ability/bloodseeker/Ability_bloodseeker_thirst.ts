import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseAbility } from '../tsBaseAbilty';

@registerAbility()
export class Ability_bloodseeker_thirst extends TSBaseAbility {
    GetIntrinsicModifierName(): string {
        return 'modifier_ability_bloodseeker_thirst';
    }
}

@registerModifier()
export class modifier_ability_bloodseeker_thirst extends BaseModifier {
    min_bonus_pct: number;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnDestroy(): void {
        this.StartIntervalThink(-1);
    }
    OnCreated(params: object): void {
        if (IsClient()) return;
        this.min_bonus_pct = this.GetAbility().GetSpecialValueFor('min_bonus_pct');
        this.StartIntervalThink(1);
    }
    OnIntervalThink(): void {
        // 计算低于触发血量阈值的单位数量
        let count = 0;
        for (const player of GameRules.PlayerManager.m_tabPlayers) {
            if(player.m_eHero == this.GetParent()) continue;
            if (IsValid(player.m_eHero) && !player.m_bDie && player.m_eHero.GetHealthPercent() <= this.min_bonus_pct) {
                count++;
            }
            for (const eBZ of player.m_tabBz) {
                if (IsValid(eBZ) && eBZ.GetHealthPercent() <= this.min_bonus_pct) {
                    count++;
                }
            }
        }
        // 更新buff
        const owner = this.GetParent();
        if (!IsValid(owner)) return;
        if (count > 0) {
            let buff = owner.FindModifierByNameAndCaster(modifier_ability_bloodseeker_thirst_active.name, owner);
            if (!buff) buff = AMHC.AddNewModifier(owner, owner, this.GetAbility(), modifier_ability_bloodseeker_thirst_active.name, {});
            if (buff) {
                buff.SetStackCount(count);
                (buff as BaseModifier).OnRefresh({});
            }
        } else {
            AMHC.RemoveModifierByNameAndCaster(modifier_ability_bloodseeker_thirst_active.name, owner, owner);
        }
    }
}

@registerModifier()
export class modifier_ability_bloodseeker_thirst_active extends BaseModifier {
    bonus_movement_speed: number;
    bonus_attack_speed: number;
    IsHidden(): boolean {
        return false;
    }
    IsPurgable(): boolean {
        return false;
    }
    GetEffectName(): string {
        return 'particles/units/heroes/hero_bloodseeker/bloodseeker_thirst_owner.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.POINT_FOLLOW;
    }
    OnCreated(params: object): void {
        this.bonus_movement_speed = this.GetAbility().GetSpecialValueFor('bonus_movement_speed');
        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
    }

    OnRefresh(params: object): void {
        this.bonus_movement_speed = this.GetAbility().GetSpecialValueFor('bonus_movement_speed');
        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_CONSTANT, ModifierFunction.ATTACKSPEED_BONUS_CONSTANT];
    }
    GetModifierMoveSpeedBonus_Constant() {
        return this.bonus_movement_speed * this.GetStackCount();
    }
    GetModifierAttackSpeedBonus_Constant() {
        return this.bonus_attack_speed * this.GetStackCount();
    }
}
