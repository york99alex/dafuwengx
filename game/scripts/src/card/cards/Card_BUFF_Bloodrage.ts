import { AbilityManager } from '../../ability/abilitymanager';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { Card } from '../card';

/**血怒 20020 */
export class Card_BUFF_Bloodrage extends Card {
    m_sName: string = '血怒';
    isCanCastMove(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }
    isCanCastInPrisonTarget(): boolean {
        return true;
    }
    isCanCastBattleTarget(): boolean {
        return true;
    }
    isCanCastMonster(): boolean {
        return true;
    }
    isCanCastSelf(): boolean {
        return true;
    }

    OnSpellStart(): void {
        const target = this.GetCursorTarget();
        if (!IsValid(target)) return;

        const player = this.GetOwner();

        AMHC.AddNewModifier(target, player.m_eHero, null, modifier_bloodseeker_bloodrage_card.name, { m_nRound: 1 });
        EmitGlobalSound('hero_bloodseeker.bloodRage');
    }
}

/**血怒buff */
@registerModifier()
export class modifier_bloodseeker_bloodrage_card extends BaseModifier {
    damage_out_amplify = 20;
    damage_in_amplify = 20;
    m_nRound = 1;
    IsHidden(): boolean {
        return false;
    }
    IsPurgable(): boolean {
        return true;
    }
    IsDebuff(): boolean {
        return this.GetParent().GetPlayerOwnerID() != this.GetCaster().GetPlayerOwnerID();
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    GetTexture(): string {
        return 'bloodseeker_bloodrage';
    }
    GetEffectName(): string {
        return 'particles/units/heroes/hero_bloodseeker/bloodseeker_bloodrage.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.POINT_FOLLOW;
    }
    OnCreated(params: object): void {
        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.INCOMING_DAMAGE_PERCENTAGE, ModifierFunction.TOTALDAMAGEOUTGOING_PERCENTAGE];
    }
    GetModifierIncomingDamage_Percentage(event: ModifierAttackEvent): number {
        const nStack = math.max(this.GetStackCount(), 1);
        return this.damage_in_amplify * nStack;
    }
    GetModifierTotalDamageOutgoing_Percentage(event: ModifierAttackEvent): number {
        const nStack = math.max(this.GetStackCount(), 1);
        return this.damage_out_amplify * nStack;
    }
    GetPriority(): ModifierPriority {
        return ModifierPriority.LOW;
    }
}
