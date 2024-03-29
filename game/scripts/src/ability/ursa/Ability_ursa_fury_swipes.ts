import { AMHC } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';

/**
 * fury_swipes怒意狂击
 * damage_per_stack 10 17 17	reset_round 1 1 2

 */
@registerAbility()
export class Ability_ursa_fury_swipes extends TSBaseAbility {
    GetIntrinsicModifierName(): string {
        return modifier_ability_ursa_fury_swipes_handle.name;
    }
}

@registerModifier()
export class modifier_ability_ursa_fury_swipes_handle extends BaseModifier {
    damage_per_stack: number;
    reset_round: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        this.OnRefresh(params);
    }
    OnRefresh(params: object): void {
        this.damage_per_stack = this.GetAbility().GetSpecialValueFor('damage_per_stack');
        this.reset_round = this.GetAbility().GetSpecialValueFor('reset_round');
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PROCATTACK_BONUS_DAMAGE_PHYSICAL];
    }
    GetModifierProcAttack_BonusDamage_Physical(event: ModifierAttackEvent): number {
        AMHC.AddNewModifier(event.target, event.attacker, this.GetAbility(), modifier_ability_ursa_fury_swipes_debuff.name, { add: 1 });
        return this.damage_per_stack * event.target.GetModifierStackCount(modifier_ability_ursa_fury_swipes_debuff.name, event.attacker);
    }
}

@registerModifier()
export class modifier_ability_ursa_fury_swipes_debuff extends BaseModifier {
    damage_per_stack: number;
    reset_round: number;
    m_nRound: number;
    GetTexture(): string {
        return 'ursa_fury_swipes';
    }
    IsDebuff(): boolean {
        return true;
    }
    IsHidden(): boolean {
        return false;
    }
    IsPurgable(): boolean {
        return false;
    }
    GetEffectName(): string {
        return 'particles/units/heroes/hero_ursa/ursa_fury_swipes_debuff.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }
    OnCreated(params: object): void {
        this.SetHasCustomTransmitterData(true);
        this.damage_per_stack = this.GetAbility().GetSpecialValueFor('damage_per_stack');
        this.reset_round = this.GetAbility().GetSpecialValueFor('reset_round');
        if (this.GetStackCount() == 0) this.SetStackCount(1);
        if (IsServer()) {
            this.m_nRound = this.reset_round;
            AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this, () => this.SendBuffRefreshToClients());
            ParticleManager.CreateParticle(
                'particles/units/heroes/hero_ursa/ursa_fury_swipes.vpcf',
                ParticleAttachment.OVERHEAD_FOLLOW,
                this.GetParent()
            );
            this.SendBuffRefreshToClients();
        }
    }
    AddCustomTransmitterData() {
        return {
            m_nRound: this.m_nRound,
        };
    }
    HandleCustomTransmitterData(data: { m_nRound: number }) {
        this.m_nRound = data.m_nRound;
    }
    OnRefresh(params: object): void {
        this.damage_per_stack = this.GetAbility().GetSpecialValueFor('damage_per_stack');
        this.reset_round = this.GetAbility().GetSpecialValueFor('reset_round');
        if (IsServer()) {
            this.m_nRound = this.reset_round;
            this.IncrementStackCount();
            this.SendBuffRefreshToClients();
        }

        const parent = this.GetParent();
        if (parent.IsRealHero()) ParaAdjuster.ModifyMana(parent);
    }
    OnDestroy(): void {
        const parent = this.GetParent();
        if (parent.IsRealHero()) ParaAdjuster.ModifyMana(parent);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.TOOLTIP, ModifierFunction.TOOLTIP2];
    }
    OnTooltip(): number {
        return this.damage_per_stack * this.GetStackCount();
    }
    OnTooltip2(): number {
        return this.m_nRound;
    }
}
