import { AHMC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { TSBaseItem } from '../tsBaseItem';
import { AbilityManager } from '../../ability/abilitymanager';
import { PS_Rooted } from '../../mode/gamemessage';

/**
 * 阿托斯之棍，2500，1000魔力法杖，1000活力球，500法师长袍，20点智力，300血
 * bonus_intellect 20	bonus_health 300	duration 1
 * CD 5回合，2点耗蓝
 */
@registerAbility()
export class item_qtg_rod_of_atos extends TSBaseItem {
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
        if (!player || !targetPlayer) return;

        // 添加debuff
        AHMC.AddNewModifier(targetPlayer.m_eHero, this.GetCaster(), this, modifier_qtg_rod_of_atos_debuff.name, {});
        // 音效
        EmitSoundOn('DOTA_Item.RodOfAtos.Cast', this.GetCaster());
        EmitSoundOn('DOTA_Item.RodOfAtos.Target', target);

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: player, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_rod_of_atos_modifier extends BaseModifier {
    IsHidden(): boolean {
        return true;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.STATS_INTELLECT_BONUS, ModifierFunction.HEALTH_BONUS];
    }
    GetModifierBonusStats_Intellect(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_intellect');
    }
    GetModifierHealthBonus(): number {
        return this.GetAbility().GetSpecialValueFor('bonus_health');
    }
}

@registerModifier()
export class modifier_qtg_rod_of_atos_debuff extends BaseModifier {
    m_nRound: number;
    nPtclID: ParticleID;
    GetTexture(): string {
        return 'item_rod_of_atos';
    }
    IsDebuff(): boolean {
        return true;
    }
    GetEffectName(): string {
        return 'particles/items2_fx/rod_of_atos.vpcf';
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
    }
    OnCreated(params: object): void {
        this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');
        if (IsClient()) return;

        const victPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
        victPlayer.setPlayerState(PS_Rooted);

        this.nPtclID = AHMC.CreateParticle(
            'particles/econ/items/oracle/oracle_fortune_ti7/oracle_fortune_ti7_purge_root_pnt.vpcf',
            ParticleAttachment.CENTER_FOLLOW,
            true,
            this.GetParent()
        );

        AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);
    }
    OnDestroy(): void {
        if (IsClient()) return;
        const victPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
        victPlayer.setPlayerState(-PS_Rooted);
        if (this.nPtclID) ParticleManager.DestroyParticle(this.nPtclID, false);
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierPhysicalArmorBonus(): number {
        return this.GetAbility().GetSpecialValueFor('armor_reduction');
    }
}
