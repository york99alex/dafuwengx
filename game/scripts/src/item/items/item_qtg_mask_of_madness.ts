import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';
import { AbilityManager } from '../../ability/abilitymanager';
import { Player } from '../../player/player';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 疯狂面具(item_lua)，1000+1000，10攻击力，10攻速，25%吸血
 * bonus_damage 10	bonus_attack_speed 10	lifesteal_percent 25	creep_lifesteal_reduction_pct 40
 *
 * berserk_bonus_attack_speed 100	berserk_bonus_movement_speed 20	berserk_armor_reduction 8	duration 1
 * CD 5 耗蓝 1
 */
@registerAbility()
export class item_qtg_mask_of_madness extends TSBaseItem {
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0;
    }
    CastFilterResult(): UnitFilterResult {
        if (!IsServer()) return;
        if (this.isCanCast()) return UnitFilterResult.SUCCESS;
        return UnitFilterResult.FAIL_CUSTOM;
    }

    /**技能释放 */
    OnSpellStart(): void {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());

        EmitSoundOn('DOTA_Item.MaskOfMadness.Activate', this.GetCaster());
        // 添加buff
        for (const BZ of oPlayer.m_tabBz) {
            AbilityManager.setCopyBuff(modifier_qtg_mask_of_madness_berserk.name, BZ, this.GetCaster(), this);
        }
        const buff = AbilityManager.setCopyBuff(modifier_qtg_mask_of_madness_berserk.name, this.GetCaster(), this.GetCaster(), this);
        // 兵卒创建更新buff
        if (buff) {
            buff['updateBZBuffByCreate'] = AbilityManager.updateBZBuffByCreate(oPlayer, null, (eBZ: CDOTA_BaseNPC_BZ) => {
                AbilityManager.setCopyBuff(modifier_qtg_mask_of_madness_berserk.name, eBZ, this.GetCaster(), this, null, false, buff);
            });
        }

        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this);
    }

    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_mask_of_madness_modifier extends BaseModifier {
    bonus_damage: number;
    bonus_attack_speed: number;
    lifesteal_percent: number;
    creep_lifesteal_percent: number;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_damage');
        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
        this.lifesteal_percent = this.GetAbility().GetSpecialValueFor('lifesteal_percent');
        this.creep_lifesteal_percent = this.lifesteal_percent * (1 - this.GetAbility().GetSpecialValueFor('creep_lifesteal_reduction_pct') / 100);
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.ON_TAKEDAMAGE];
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.bonus_damage;
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonus_attack_speed;
    }
    OnTakeDamage(event: ModifierInstanceEvent): void {
        if (IsServer()) {
            if (event.attacker == this.GetParent()) {
                const percent = event.unit.IsConsideredHero() ? this.lifesteal_percent : this.creep_lifesteal_percent;
                const heal = (event.damage * percent) / 100;
                this.GetParent().Heal(heal, this.GetAbility());
                let effect = ParticleManager.CreateParticle(
                    'particles/generic_gameplay/generic_lifesteal.vpcf',
                    ParticleAttachment.ABSORIGIN_FOLLOW,
                    this.GetParent()
                );
                ParticleManager.SetParticleControl(effect, 0, this.GetParent().GetAbsOrigin());
                ParticleManager.ReleaseParticleIndex(effect);
            }
        }
    }
}

/**
 * berserk_bonus_attack_speed 100	berserk_bonus_movement_speed 20	berserk_armor_reduction 8
 * duration 1
 */
@registerModifier()
export class modifier_qtg_mask_of_madness_berserk extends BaseModifier {
    berserk_bonus_attack_speed: number;
    berserk_bonus_movement_speed: number;
    berserk_armor_reduction: number;
    m_nRound: number;
    eventID: number;
    IsPurgable(): boolean {
        return true;
    }
    GetTexture(): string {
        return 'item_mask_of_madness';
    }
    GetEffectName(): string {
        return 'particles/items2_fx/mask_of_madness.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
    }
    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');
        this.berserk_bonus_attack_speed = this.GetAbility().GetSpecialValueFor('berserk_bonus_attack_speed');
        this.berserk_bonus_movement_speed = this.GetAbility().GetSpecialValueFor('berserk_bonus_movement_speed');
        this.berserk_armor_reduction = this.GetAbility().GetSpecialValueFor('berserk_armor_reduction');
        if (IsClient()) return;

        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);

        // 检测目标玩家每轮开始
        this.eventID = GameRules.EventManager.Register('Event_PlayerRoundBegin', (event: { oPlayer: Player }) => {
            if (!this) {
                return true;
            }
            if (this.GetParent().GetPlayerOwnerID() != event.oPlayer.m_nPlayerID) {
                return;
            }
        });
    }
    OnDestroy(): void {
        if (IsClient()) return;
        if (this['updateBZBuffByCreate']) {
            GameRules.EventManager.UnRegisterByID(this['updateBZBuffByCreate'], 'Event_BZCreate');
        }
        GameRules.EventManager.UnRegisterByID(this.eventID);
        this.eventID = null;

        const parent = this.GetParent();
        if (parent.IsRealHero()) ParaAdjuster.ModifyMana(parent);
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.MOVESPEED_BONUS_CONSTANT, ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.berserk_bonus_attack_speed;
    }
    GetModifierMoveSpeedBonus_Constant(): number {
        return this.berserk_bonus_movement_speed;
    }
    GetModifierPhysicalArmorBonus(): number {
        return -this.berserk_armor_reduction;
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.SILENCED]: true,
        };
    }
}
