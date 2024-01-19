import { PS_AbilityImmune } from '../../constants/gamemessage';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';
import { TSBaseAbility } from '../tsBaseAbilty';

@registerAbility()
export class Ability_dragon_knight_elder_dragon_form extends TSBaseAbility {
    /**变龙皮肤ID -1人类，0毒，1火，2冰 */
    m_nSkinID: number;
    m_sModelBase: string;
    m_sModelDragon: string;

    CastFilterResult(): UnitFilterResult {
        if (!this.isCanCast()) return UnitFilterResult.FAIL_CUSTOM;
        else return UnitFilterResult.SUCCESS;
    }
    isCanCastOtherRound(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastMove(): boolean {
        return !this.GetCaster().IsRealHero() || GameRules.GameConfig.m_nOrderID != this.GetCaster().GetPlayerOwnerID();
    }
    isCanCastSupply(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }
    isCanCastAtk(): boolean {
        return false;
    }
    GetIntrinsicModifierName(): string {
        return 'modifier_dragonknight_elder_dragon_form';
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const level = this.GetLevel() - 1;
        if (!this.m_nSkinID) this.m_nSkinID = -1;
        this.m_nSkinID += 1;
        if (this.m_nSkinID > 2) this.m_nSkinID = -1;

        this.m_sModelBase = 'models/heroes/dragon_knight/dragon_knight.vmdl';
        // 变龙皮肤ID -1人类，0毒，1火，2冰
        this.m_sModelDragon = 'models/heroes/dragon_knight/dragon_knight_dragon.vmdl';
        const typeAtkCap = this.m_nSkinID >= 0 ? UnitAttackCapability.RANGED_ATTACK : UnitAttackCapability.MELEE_ATTACK;
        caster.SetAttackCapability(typeAtkCap);

        CustomNetTables.SetTableValue('common', 'modifier_dragonknight_elder_dragon_form' + caster.GetEntityIndex(), {
            nLevel: this.m_nSkinID,
        });
        AMHC.RemoveModifierByName(modifier_dragonknight_elder_dragon_form.name, caster);
        const buff = AMHC.AddNewModifier(caster, caster, this, modifier_dragonknight_elder_dragon_form.name, { nLevel: this.m_nSkinID });
        buff.SetStackCount(this.m_nSkinID + 1);

        caster.StartGesture(GameActivity.DOTA_CAST_ABILITY_4);
        caster.SetSkin(this.m_nSkinID);

        if (this.m_nSkinID >= 0) caster.EmitSound('Hero_DragonKnight.ElderDragonForm');
        else caster.EmitSound('Hero_DragonKnight.ElderDragonForm.Revert');
    }
}

@registerModifier()
export class modifier_dragonknight_elder_dragon_form extends BaseModifier {
    /**变龙皮肤ID -1人类，0毒，1火，2冰 */
    nLevel: number;
    magic_resistance_bonus: number;
    armor_bonus: number;
    atk_range: number;
    debuff_max_count: number;
    debuff_duration: number;
    particlePath: string;

    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        this.nLevel = -1;
        this.OnRefresh(params);
    }
    OnRefresh(params: object): void {
        this.magic_resistance_bonus = this.GetAbility().GetSpecialValueFor('magic_resistance_bonus');
        this.armor_bonus = this.GetAbility().GetSpecialValueFor('armor_bonus');
        this.atk_range = this.GetAbility().GetSpecialValueFor('atk_range');

        if (IsServer()) {
            if (params['nLevel']) this.nLevel = params['nLevel'];
            this.debuff_max_count = this.GetAbility().GetSpecialValueFor('debuff_' + this.nLevel + '_max_count');
            this.debuff_duration = this.GetAbility().GetSpecialValueFor('debuff_duration');
            if (this.nLevel == 0) this.particlePath = 'particles/units/heroes/hero_dragon_knight/dragon_knight_transform_green.vpcf';
            else if (this.nLevel == 1) this.particlePath = 'particles/units/heroes/hero_dragon_knight/dragon_knight_transform_red.vpcf';
            else if (this.nLevel == 2) this.particlePath = 'particles/units/heroes/hero_dragon_knight/dragon_knight_transform_blue.vpcf';
            if (this.particlePath) {
                const particleID = ParticleManager.CreateParticle(this.particlePath, ParticleAttachment.ABSORIGIN_FOLLOW, this.GetParent());
                ParticleManager.ReleaseParticleIndex(particleID);
            }
        } else {
            params = CustomNetTables.GetTableValue('common', 'modifier_dragonknight_elder_dragon_form' + this.GetParent().GetEntityIndex());
            if (params && params['nLevel']) this.nLevel = params['nLevel'];
        }
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.ON_ATTACK_LANDED,
            ModifierFunction.ATTACK_RANGE_BONUS,
            ModifierFunction.PROJECTILE_NAME,
            ModifierFunction.MODEL_CHANGE,
            ModifierFunction.TRANSLATE_ATTACK_SOUND,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.MAGICAL_RESISTANCE_BONUS,
        ];
    }
    OnAttackLanded(event: ModifierAttackEvent): void {
        if (IsServer()) {
            if (event.attacker == this.GetParent()) {
                // 添加攻击附加Debuff
                const target = event.target;
                if (IsValid(target)) {
                    // TODO:注意技能免疫情况
                    if (IsValid(this.GetAbility())) {
                        const targetPlayer = GameRules.PlayerManager.getPlayer(target.GetPlayerOwnerID());
                        if (targetPlayer && 0 < bit.band(PS_AbilityImmune, targetPlayer.m_nPlayerState)) {
                            return;
                        }
                    }
                    const buff = target.FindModifierByName('modifier_dragon_knight_elder_dragon_form_debuff_' + this.nLevel);
                    if (!IsValid(buff)) {
                        // 不存在加buff
                        if (this.nLevel == 0)
                            AMHC.AddNewModifier(target, event.attacker, this.GetAbility(), modifier_dragon_knight_elder_dragon_form_debuff_0.name, {
                                duration: this.debuff_duration,
                            });
                        else if (this.nLevel == 1)
                            AMHC.AddNewModifier(
                                target,
                                event.attacker,
                                this.GetAbility(),
                                modifier_dragon_knight_elder_dragon_form_debuff_1.name,
                                {}
                            );
                        else if (this.nLevel == 2)
                            AMHC.AddNewModifier(target, event.attacker, this.GetAbility(), modifier_dragon_knight_elder_dragon_form_debuff_2.name, {
                                duration: this.debuff_duration,
                            });
                        else return;
                    } else {
                        // 存在加层数
                        AMHC.AddNewModifier(target, event.attacker, this.GetAbility(), buff.GetName(), { duration: buff.GetDuration() });
                        if (this.debuff_max_count <= 0 || this.debuff_max_count > buff.GetStackCount()) {
                            buff.IncrementStackCount();
                        }
                    }
                }
            }
        }
    }
    // 提升攻击距离
    GetModifierAttackRangeBonus(): number {
        if (this.nLevel >= 0) return this.atk_range;
        else return 0;
    }
    // 弹道投掷物改变
    GetModifierProjectileName(): string {
        if (this.nLevel == 0) return 'particles/units/heroes/hero_dragon_knight/dragon_knight_elder_dragon_corrosive.vpcf';
        else if (this.nLevel == 1) return 'particles/units/heroes/hero_dragon_knight/dragon_knight_elder_dragon_fire.vpcf';
        else if (this.nLevel == 2) return 'particles/units/heroes/hero_dragon_knight/dragon_knight_elder_dragon_frost.vpcf';
        else return 'particles/units/heroes/hero_dragon_knight/dragon_knight_elder_dragon_corrosive.vpcf';
    }
    // 模型改变
    GetModifierModelChange(): string {
        if (this.nLevel >= 0) return 'models/heroes/dragon_knight/dragon_knight_dragon.vmdl';
        else return 'models/heroes/dragon_knight/dragon_knight.vmdl';
    }
    // 攻击声音改变
    GetAttackSound(): string {
        if (this.nLevel == 0) return 'Hero_DragonKnight.ElderDragonShoot1.Attack';
        else if (this.nLevel == 1) return 'Hero_DragonKnight.ElderDragonShoot2.Attack';
        else if (this.nLevel == 2) return 'Hero_DragonKnight.ElderDragonShoot3.Attack';
        else return 'Hero_DragonKnight.Attack';
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        if (this.nLevel >= 0) return this.armor_bonus;
        else return 0;
    }
    GetModifierMagicalResistanceBonus(event: ModifierAttackEvent): number {
        if (this.nLevel >= 0) return this.magic_resistance_bonus;
        else return 0;
    }
}

/**毒龙Buff 减甲 */
@registerModifier()
export class modifier_dragon_knight_elder_dragon_form_debuff_0 extends BaseModifier {
    debuff_armor_sub: number;
    debuff_move_speed_sub: number;
    debuff_fire_damage: number;
    IsDebuff(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return true;
    }
    GetTexture(): string {
        return 'dragon_knight_elder_dragon_form';
    }
    OnCreated(params: object): void {
        this.debuff_armor_sub = this.GetAbility().GetSpecialValueFor('debuff_armor_sub');
        this.debuff_move_speed_sub = this.GetAbility().GetSpecialValueFor('debuff_move_speed_sub');
        this.debuff_fire_damage = this.GetAbility().GetSpecialValueFor('debuff_fire_damage');
        this.SetStackCount(1);
    }
    OnRefresh(params: object): void {
        this.debuff_armor_sub = this.GetAbility().GetSpecialValueFor('debuff_armor_sub');
        this.debuff_move_speed_sub = this.GetAbility().GetSpecialValueFor('debuff_move_speed_sub');
        this.debuff_fire_damage = this.GetAbility().GetSpecialValueFor('debuff_fire_damage');
    }
    OnDestroy(): void {
        const owner = this.GetParent();
        if (owner.IsRealHero()) ParaAdjuster.ModifyMana(owner);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.GetStackCount() * this.debuff_armor_sub;
    }
}

/**火龙Buff */
@registerModifier()
export class modifier_dragon_knight_elder_dragon_form_debuff_1 extends modifier_dragon_knight_elder_dragon_form_debuff_0 {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.TOOLTIP];
    }
    OnTooltip(): number {
        return this.GetStackCount() * this.debuff_fire_damage;
    }
}

/**冰龙Buff 减速 */
@registerModifier()
export class modifier_dragon_knight_elder_dragon_form_debuff_2 extends modifier_dragon_knight_elder_dragon_form_debuff_0 {
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.GetStackCount() * this.debuff_move_speed_sub;
    }
}
