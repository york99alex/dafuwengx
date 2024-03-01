import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';
import { AbilityManager } from '../../ability/abilitymanager';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { Player } from '../../player/player';

/**
 * 炎阳纹章，3000，勇气勋章1500+王冠500+短棍1000，6点甲，6点全属性，12攻速，12攻击力
 * bonus_armor 6	bonus_all_stats 6   bonus_attack_speed 12	bonus_damage 12 mana_regen_bz 12
 * mana_regen_hero 1	mana_regen_hero_cd 3
 *
 * 对己方单位施放可以提供7点护甲，50攻击速度，和10%移动速度。对敌人施放将降低其7点护甲，50攻击速度并减缓10%移动速度。
 * 可以对自己使用
 * target_armor 8	target_attack_speed 60	target_movement_speed 15	duration 1
 * CD 3回合
 */
@registerAbility()
export class item_qtg_solar_crest extends TSBaseItem {
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return 0;
    }

    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!IsServer()) return;
        if (!this.isCanCast(target)) {
            return UnitFilterResult.FAIL_CUSTOM;
        }
        return UnitFilterResult.SUCCESS;
    }

    /**技能释放 */
    OnSpellStart(): void {
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        const target = this.GetCursorTarget();
        if (!player) return;

        // 自身添加buff
        AMHC.AddNewModifier(this.GetCaster(), this.GetCaster(), this, modifier_qtg_solar_crest_debuff.name, {});
        EmitSoundOn('DOTA_Item.MedallionOfCourage.Activate', this.GetCaster());

        if (target.GetPlayerOwnerID() == this.GetCaster().GetPlayerOwnerID()) {
            // 友军单位buff
            AMHC.AddNewModifier(target, this.GetCaster(), this, modifier_qtg_solar_crest_buff.name, {});
        } else {
            // 敌方单位debuff
            AMHC.AddNewModifier(target, this.GetCaster(), this, modifier_qtg_solar_crest_debuff.name, {});
            // 音效
            const targetPlayer = GameRules.PlayerManager.getPlayer(target.GetPlayerOwnerID());
            EmitSoundOn('DOTA_Item.MedallionOfCourage.Activate', targetPlayer.m_eHero);
        }

        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
    isCanCastSelf(): boolean {
        return true;
    }
}

@registerModifier()
export class item_qtg_solar_crest_modifier extends BaseModifier {
    bonus_armor: number;
    bonus_all_stats: number;
    bonus_attack_speed: number;
    bonus_damage: number;
    mana_regen_bz: number;
    mana_regen_hero_cd: number;
    countCD: number;
    nRound: number;
    tEventID: number[];
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_armor = this.GetAbility().GetSpecialValueFor('bonus_armor');
        this.bonus_all_stats = this.GetAbility().GetSpecialValueFor('bonus_all_stats');
        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_damage');
        this.mana_regen_bz = this.GetAbility().GetSpecialValueFor('mana_regen_bz');
        this.mana_regen_hero_cd = this.GetAbility().GetSpecialValueFor('mana_regen_hero_cd');
        this.countCD = this.mana_regen_hero_cd;
        this.tEventID = [];

        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) {
            // 英雄回蓝
            this.StartIntervalThink(0.6);
            const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (!player) return;
            this.tEventID.push(
                GameRules.EventManager.Register('Event_PlayerRoundBegin', (event: { oPlayer: Player }) => {
                    if (event.oPlayer != player) return;
                    if (!(this.GetAbility() as TSBaseItem).isCanCast()) return;
                    if (this.nRound != GameRules.GameConfig.m_nRound) this.countCD--;
                })
            );
        } else {
            // 兵卒回蓝
            this.tEventID.push(
                GameRules.EventManager.Register('Event_BZHuiMo', (event: { eBz: CDOTA_BaseNPC_BZ; nHuiMoBase: number }) => {
                    if (event.eBz == this.GetCaster()) {
                        if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                        event.nHuiMoBase += this.mana_regen_bz / 100;
                    }
                })
            );
        }
    }
    /**
     * 监听回蓝
     * mana_regen_hero 1	mana_regen_hero_cd 3
     */
    OnIntervalThink(): void {
        let buff = this.GetParent().FindModifierByName(modifier_qtg_solar_crest_cd.name);
        if (!buff || !IsValid(buff)) {
            const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (!player) return;

            if (!(this.GetAbility() as TSBaseItem).isCanCast()) return;
            if (player.m_eHero.GetMana() == player.m_eHero.GetMaxMana()) return;

            // 物品给蓝
            player.givePlayerMana(this.GetAbility().GetSpecialValueFor('mana_regen_hero'));
            if (player.m_eHero.GetMana() >= player.m_eHero.GetMaxMana()) player.setPlayerMana(player.m_eHero.GetMaxMana());
            // 设置Buff
            buff = AMHC.AddNewModifier(this.GetCaster(), this.GetCaster(), this.GetAbility(), modifier_qtg_solar_crest_cd.name, {
                duration: this.mana_regen_hero_cd,
            });
            this.countCD = this.mana_regen_hero_cd;
            this.nRound = GameRules.GameConfig.m_nRound;
            buff.SetStackCount(this.countCD);
        } else if (buff && IsValid(buff)) {
            if (this.countCD == 0) AMHC.RemoveModifierByName(modifier_qtg_solar_crest_cd.name, this.GetCaster());
            else {
                buff.SetDuration(this.countCD, true);
                buff.SetStackCount(this.countCD);
            }
        }
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        if (!this.tEventID) return;
        GameRules.EventManager.UnRegisterByIDs(this.tEventID);
        this.tEventID = null;
        const buff = this.GetParent().FindModifierByName(modifier_qtg_solar_crest_cd.name);
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player || !buff) return;
        if (this.GetAbility() && IsValid(this.GetAbility())) {
            const remainingTime = buff.GetRemainingTime();
            if (buff && IsValid(buff)) {
                Timers.CreateTimer(0, () => {
                    const item = player.m_eHero.FindItemInInventory(item_qtg_solar_crest.name);
                    if (!item) return;
                    if (item.GetItemSlot() < 6 && item.GetItemState() == 1) return;
                    buff.SetDuration(remainingTime, true);
                    return 0.3;
                });
            }
        } else {
            AMHC.RemoveModifierByName(modifier_qtg_solar_crest_cd.name, this.GetParent());
        }
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
        ];
    }
    GetModifierPhysicalArmorBonus(): number {
        return this.bonus_armor;
    }
    GetModifierBonusStats_Agility(): number {
        return this.bonus_all_stats;
    }
    GetModifierBonusStats_Intellect(): number {
        return this.bonus_all_stats;
    }
    GetModifierBonusStats_Strength(): number {
        return this.bonus_all_stats;
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonus_attack_speed;
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.bonus_damage;
    }
}

@registerModifier()
export class modifier_qtg_solar_crest_cd extends BaseModifier {
    IsDebuff(): boolean {
        return true;
    }
    GetTexture(): string {
        return 'item_solar_crest';
    }
}

/**
 * 友军增益buff
 * 对己方单位施放可以提供7点护甲，50攻击速度，和10%移动速度。对敌人施放将降低其7点护甲，50攻击速度并减缓10%移动速度。
 * 可以对自己使用（不加甲）
 * target_armor 8	target_attack_speed 60	target_movement_speed 15	duration 1
 */
@registerModifier()
export class modifier_qtg_solar_crest_buff extends BaseModifier {
    m_nRound: number;
    target_armor: number;
    target_attack_speed: number;
    target_movement_speed: number;
    GetTexture(): string {
        return 'item_solar_crest';
    }
    GetEffectName(): string {
        return 'particles/items2_fx/medallion_of_courage_friend.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }
    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');
        this.target_armor = this.GetAbility().GetSpecialValueFor('target_armor');
        this.target_attack_speed = this.GetAbility().GetSpecialValueFor('target_attack_speed');
        this.target_movement_speed = this.GetAbility().GetSpecialValueFor('target_movement_speed');
        if (IsClient()) return;

        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS, ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }
    GetModifierPhysicalArmorBonus(): number {
        return this.GetAbility().GetSpecialValueFor('armor_reduction');
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.target_attack_speed;
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.target_movement_speed;
    }
}

/**
 * 敌人debuff
 * 对敌人施放将降低其7点护甲，50攻击速度并减缓10%移动速度。
 * target_armor 8	target_attack_speed 60	target_movement_speed 15	duration 1
 */
@registerModifier()
export class modifier_qtg_solar_crest_debuff extends BaseModifier {
    m_nRound: number;
    target_armor: number;
    target_attack_speed: number;
    target_movement_speed: number;
    GetTexture(): string {
        return 'item_solar_crest';
    }
    IsDebuff(): boolean {
        return true;
    }
    GetEffectName(): string {
        return 'particles/items2_fx/medallion_of_courage.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }
    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');
        this.target_armor = this.GetAbility().GetSpecialValueFor('target_armor');
        this.target_attack_speed = this.GetAbility().GetSpecialValueFor('target_attack_speed');
        this.target_movement_speed = this.GetAbility().GetSpecialValueFor('target_movement_speed');
        if (IsClient()) return;

        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS, ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }
    GetModifierPhysicalArmorBonus(): number {
        return -this.target_armor;
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        if (this.GetCaster() == this.GetParent()) return 0;
        return -this.target_attack_speed;
    }
    GetModifierMoveSpeedBonus_Percentage(): number {
        if (this.GetCaster() == this.GetParent()) return 0;
        return -this.target_movement_speed;
    }
}
