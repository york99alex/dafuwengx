import { AHMC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';
import { AbilityManager } from '../../ability/abilitymanager';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { Player } from '../../player/player';
import { Constant } from '../../mode/constant';

/**
 * 勇气勋章，1500，500甲+500面罩+500石头，5甲，英雄每3回合回复1点蓝，兵卒提升10%回蓝
 * bonus_armor 5	mana_regen_bz 10
 * mana_regen_hero 1	mana_regen_hero_cd 3
 * armor_reduction -6	duration 1
 * CD 3回合
 */
@registerAbility()
export class item_qtg_medallion_of_courage extends TSBaseItem {
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

        // 自身添加debuff
        AHMC.AddNewModifier(this.GetCaster(), this.GetCaster(), this, modifier_qtg_medallion_of_courage_debuff.name, {});
        EmitSoundOn('DOTA_Item.BlinkDagger.Activate', this.GetCaster());

        if (target == this.GetCaster() || target.GetUnitName().includes(Constant.HERO_TO_BZ[player.m_eHero.GetUnitName()])) {
            // 友军单位buff
            AHMC.AddNewModifier(target, this.GetCaster(), this, modifier_qtg_medallion_of_courage_buff.name, {});
        } else {
            // 敌方单位debuff
            AHMC.AddNewModifier(target, this.GetCaster(), this, modifier_qtg_medallion_of_courage_debuff.name, {});
            // 音效
            EmitSoundOn('DOTA_Item.BlinkDagger.Activate', target);
        }

        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_medallion_of_courage_modifier extends BaseModifier {
    bonus_armor: number;
    mana_regen_bz: number;
    mana_regen_hero_cd: number;
    countCD: number;
    tEventID: number[];
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_armor = this.GetAbility().GetSpecialValueFor('bonus_armor');
        this.mana_regen_bz = this.GetAbility().GetSpecialValueFor('mana_regen_bz');
        this.mana_regen_hero_cd = this.GetAbility().GetSpecialValueFor('mana_regen_hero_cd');
        this.countCD = this.mana_regen_hero_cd;
        this.tEventID = [];

        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) {
            // 英雄回蓝
            this.StartIntervalThink(0.9);
            const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (!player) return;
            this.tEventID.push(
                GameRules.EventManager.Register('Event_PlayerRoundBegin', (event: { oPlayer: Player }) => {
                    if (event.oPlayer != player) return;
                    if (!(this.GetAbility() as TSBaseItem).isCanCast()) return;
                    this.countCD--;
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
        print('===qtg_medallion_of_courage===state:', this.GetAbility().IsActivated());
        let buff = this.GetParent().FindModifierByName(modifier_qtg_medallion_of_courage_cd.name);
        if (!buff || !IsValid(buff)) {
            const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (!player) return;

            if (!(this.GetAbility() as TSBaseItem).isCanCast()) return;
            // 给蓝
            player.givePlayerMana(this.GetAbility().GetSpecialValueFor('mana_regen_hero'));
            if (player.m_eHero.GetMana() > player.m_eHero.GetMaxMana()) player.setPlayerMana(player.m_eHero.GetMaxMana());
            // 设置Buff
            buff = AHMC.AddNewModifier(this.GetCaster(), this.GetCaster(), this.GetAbility(), modifier_qtg_medallion_of_courage_cd.name, {
                duration: this.mana_regen_hero_cd,
            });
            this.countCD = this.mana_regen_hero_cd;
            buff.SetStackCount(this.countCD);
        } else if (buff && IsValid(buff)) {
            if (this.countCD == 0) AHMC.RemoveModifierByName(modifier_qtg_medallion_of_courage_cd.name, this.GetCaster());
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
        const buff = this.GetParent().FindModifierByName(modifier_qtg_medallion_of_courage_cd.name);
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player) return;
        if (this.GetAbility() && IsValid(this.GetAbility())) {
            const remainingTime = buff.GetRemainingTime();
            if (buff && IsValid(buff)) {
                Timers.CreateTimer(0, () => {
                    const item = player.m_eHero.FindItemInInventory('item_qtg_medallion_of_courage');
                    print('===qtg_medallion_of_courage===slot:', item.GetItemSlot());
                    print('===qtg_medallion_of_courage===GetItemState:', item.GetItemState());
                    if (item.GetItemSlot() < 6 && item.GetItemState() == 1) return;
                    buff.SetDuration(remainingTime, true);
                    return 0.9;
                });
            }
        } else {
            AHMC.RemoveModifierByName(modifier_qtg_medallion_of_courage_cd.name, this.GetParent());
        }
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierPhysicalArmorBonus(): number {
        return this.bonus_armor;
    }
}

@registerModifier()
export class modifier_qtg_medallion_of_courage_cd extends BaseModifier {
    IsDebuff(): boolean {
        return true;
    }
    GetTexture(): string {
        return 'item_medallion_of_courage';
    }
}

@registerModifier()
export class modifier_qtg_medallion_of_courage_buff extends BaseModifier {
    m_nRound: number;
    GetTexture(): string {
        return 'item_medallion_of_courage';
    }
    GetEffectName(): string {
        return 'particles/items2_fx/medallion_of_courage_friend.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }
    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');
        if (IsClient()) return;

        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierPhysicalArmorBonus(): number {
        return -this.GetAbility().GetSpecialValueFor('armor_reduction');
    }
}

@registerModifier()
export class modifier_qtg_medallion_of_courage_debuff extends BaseModifier {
    m_nRound: number;
    GetTexture(): string {
        return 'item_medallion_of_courage';
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
        if (IsClient()) return;

        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierPhysicalArmorBonus(): number {
        return this.GetAbility().GetSpecialValueFor('armor_reduction');
    }
}