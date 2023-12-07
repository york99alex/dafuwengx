import { AHMC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';
import { AbilityManager } from '../../ability/abilitymanager';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { Player } from '../../player/player';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 紫怨，3000，1000魔力法杖，1000短棍，1000宝石回蓝
 * 20攻速，15攻击力，12智力
 * bonus_attack_speed 20	bonus_damage 15	bonus_intellect 12
 * 英雄2回合1回蓝，兵卒提升20%回蓝
 * mana_regen_hero 1	mana_regen_hero_cd 2	mana_regen_bz 20
 * 沉默，CD 5回合，2耗蓝
 */
@registerAbility()
export class item_qtg_orchid extends TSBaseItem {
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
        const targetPlayer = GameRules.PlayerManager.getPlayer(target.GetPlayerOwnerID());
        if (!player) return;

        // 音效
        EmitSoundOn('DOTA_Item.Orchid.Activate', this.GetCaster());
        // 添加buff
        const buff = AbilityManager.setCopyBuff(modifier_qtg_orchid_debuff.name, targetPlayer.m_eHero, this.GetCaster(), this);
        for (const BZ of targetPlayer.m_tabBz) {
            AbilityManager.setCopyBuff(modifier_qtg_orchid_debuff.name, BZ, this.GetCaster(), this, null, false, buff);
        }
        // 兵卒创建更新buff
        if (buff) {
            buff['updateBZBuffByCreate'] = AbilityManager.updateBZBuffByCreate(targetPlayer, null, (eBZ: CDOTA_BaseNPC_BZ) => {
                AbilityManager.setCopyBuff(modifier_qtg_orchid_debuff.name, eBZ, this.GetCaster(), this, null, false, buff);
            });
        }

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: player, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

/**
 * bonus_attack_speed 20	bonus_damage 15	bonus_intellect 12
 * mana_regen_hero 1	mana_regen_hero_cd 2	mana_regen_bz 20
 */
@registerModifier()
export class item_qtg_orchid_modifier extends BaseModifier {
    bonus_attack_speed: number;
    bonus_damage: number;
    bonus_intellect: number;
    mana_regen_hero_cd: number;
    mana_regen_bz: number;
    countCD: number;
    tEventID: number[];
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
        this.bonus_damage = this.GetAbility().GetSpecialValueFor('bonus_damage');
        this.bonus_intellect = this.GetAbility().GetSpecialValueFor('bonus_intellect');
        this.mana_regen_hero_cd = this.GetAbility().GetSpecialValueFor('mana_regen_hero_cd');
        this.mana_regen_bz = this.GetAbility().GetSpecialValueFor('mana_regen_bz');
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
        let buff = this.GetParent().FindModifierByName(modifier_qtg_orchid_cd.name);
        if (!buff || !IsValid(buff)) {
            const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (!player) return;

            if (!(this.GetAbility() as TSBaseItem).isCanCast()) return;
            if (player.m_eHero.GetMana() == player.m_eHero.GetMaxMana()) return;

            // 物品给蓝
            player.givePlayerMana(this.GetAbility().GetSpecialValueFor('mana_regen_hero'));
            if (player.m_eHero.GetMana() >= player.m_eHero.GetMaxMana()) player.setPlayerMana(player.m_eHero.GetMaxMana());
            // 设置Buff
            buff = AHMC.AddNewModifier(this.GetCaster(), this.GetCaster(), this.GetAbility(), modifier_qtg_orchid_cd.name, {
                duration: this.mana_regen_hero_cd,
            });
            this.countCD = this.mana_regen_hero_cd;
            buff.SetStackCount(this.countCD);
        } else if (buff && IsValid(buff)) {
            if (this.countCD == 0) AHMC.RemoveModifierByName(modifier_qtg_orchid_cd.name, this.GetCaster());
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
        const buff = this.GetParent().FindModifierByName(modifier_qtg_orchid_cd.name);
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player || !buff) return;
        if (this.GetAbility() && IsValid(this.GetAbility())) {
            const remainingTime = buff.GetRemainingTime();
            if (buff && IsValid(buff)) {
                Timers.CreateTimer(0, () => {
                    const item = player.m_eHero.FindItemInInventory(item_qtg_orchid.name);
                    if (!item) return;
                    if (item.GetItemSlot() < 6 && item.GetItemState() == 1) return;
                    buff.SetDuration(remainingTime, true);
                    return 0.3;
                });
            }
        } else {
            AHMC.RemoveModifierByName(modifier_qtg_orchid_cd.name, this.GetParent());
        }
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.STATS_INTELLECT_BONUS];
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonus_attack_speed;
    }
    GetModifierPreAttack_BonusDamage(): number {
        return this.bonus_damage;
    }
    GetModifierBonusStats_Intellect(): number {
        return this.bonus_intellect;
    }
}

@registerModifier()
export class modifier_qtg_orchid_cd extends BaseModifier {
    IsDebuff(): boolean {
        return true;
    }
    GetTexture(): string {
        return 'item_orchid';
    }
    OnDestroy(): void {
        const parent = this.GetParent();
        if (parent.IsRealHero()) ParaAdjuster.ModifyMana(parent);
    }
}

@registerModifier()
export class modifier_qtg_orchid_debuff extends BaseModifier {
    m_nRound: number;
    GetTexture(): string {
        return 'item_orchid';
    }
    IsDebuff(): boolean {
        return true;
    }
    GetEffectName(): string {
        return 'particles/items2_fx/orchid.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }
    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('silence_duration');
        if (IsClient()) return;

        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);
    }
    OnDestroy(): void {
        if (this['updateBZBuffByCreate']) {
            GameRules.EventManager.UnRegisterByID(this['updateBZBuffByCreate'], 'Event_BZCreate');
        }
        const hero = this.GetParent();
        if (hero.IsRealHero()) ParaAdjuster.ModifyMana(hero);
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.SILENCED]: true,
        };
    }
}
