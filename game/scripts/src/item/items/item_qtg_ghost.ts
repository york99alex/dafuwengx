import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';
import { AbilityManager } from '../../ability/abilitymanager';
import { Player } from '../../player/player';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { ParaAdjuster } from '../../utils/paraadjuster';

/**
 * 幽魂权杖(item_lua)，1500，5点全属性
 * bonus_all_stats 5	extra_spell_damage_percent -30	duration 1
 */
@registerAbility()
export class item_qtg_ghost extends TSBaseItem {
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
        print('===item_qtg_ghost===OnSpellStart===0');
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());

        EmitSoundOn('DOTA_Item.GhostScepter.Activate', this.GetCaster());
        // 添加buff
        for (const BZ of oPlayer.m_tabBz) {
            AbilityManager.setCopyBuff(modifier_qtg_ghost_state.name, BZ, this.GetCaster(), this);
        }
        const buff = AbilityManager.setCopyBuff(modifier_qtg_ghost_state.name, this.GetCaster(), this.GetCaster(), this);
        // 兵卒创建更新buff
        if (buff) {
            buff['updateBZBuffByCreate'] = AbilityManager.updateBZBuffByCreate(oPlayer, null, (eBZ: CDOTA_BaseNPC_BZ) => {
                AbilityManager.setCopyBuff(modifier_qtg_ghost_state.name, eBZ, this.GetCaster(), this, null, false, buff);
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
export class item_qtg_ghost_modifier extends BaseModifier {
    bonus_all_stats: number;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_all_stats = this.GetAbility().GetSpecialValueFor('bonus_all_stats');
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.STATS_AGILITY_BONUS, ModifierFunction.STATS_INTELLECT_BONUS, ModifierFunction.STATS_STRENGTH_BONUS];
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
}

@registerModifier()
export class modifier_qtg_ghost_state extends BaseModifier {
    m_nRound: number;
    eventID: number;
    IsDebuff(): boolean {
        return false;
    }
    IsPurgable(): boolean {
        return true;
    }
    GetTexture(): string {
        return 'item_ghost';
    }
    GetStatusEffectName(): string {
        return 'particles/status_fx/status_effect_ghost.vpcf';
    }
    StatusEffectPriority(): ModifierPriority {
        return ModifierPriority.SUPER_ULTRA;
    }
    GetEffectName(): string {
        return 'particles/items_fx/ghost.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN;
    }

    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');

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
        return [ModifierFunction.ABSOLUTE_NO_DAMAGE_PHYSICAL, ModifierFunction.MAGICAL_RESISTANCE_BONUS];
    }
    GetAbsoluteNoDamagePhysical(event: ModifierAttackEvent): 0 | 1 {
        return 1;
    }
    GetModifierMagicalResistanceBonus(event: ModifierAttackEvent): number {
        return this.GetAbility().GetSpecialValueFor('extra_spell_damage_percent');
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.ATTACK_IMMUNE]: true,
            [ModifierState.DISARMED]: true,
        };
    }
}
