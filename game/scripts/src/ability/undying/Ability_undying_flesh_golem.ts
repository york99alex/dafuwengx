import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { AMHC } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';
import { modifier_Ability_undying_tombstone_buff, modifier_Ability_undying_tombstone_thinker } from './Ability_undying_tombstone';
import { Ability_undying_tombstone_zombie_deathstrike } from './Ability_undying_tombstone_zombie_deathstrike';

@registerAbility()
export class Ability_undying_flesh_golem extends TSBaseAbility {
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!this.isCanCast()) return UnitFilterResult.FAIL_CUSTOM;
        else return UnitFilterResult.SUCCESS;
    }
    isCanCastMove(): boolean {
        return true;
    }
    OnSpellStart(): void {
        if (!IsServer()) return;

        const caster = this.GetCaster();
        const player = GameRules.PlayerManager.getPlayer(caster.GetPlayerOwnerID());
        if (!player) return;

        for (const bz of player.m_tabBz) {
            if (bz.HasModifier(modifier_Ability_undying_tombstone_buff.name)) {
                bz.RemoveModifierByName(modifier_Ability_undying_tombstone_buff.name);
            }
            if (bz.HasModifier(modifier_Ability_undying_tombstone_thinker.name)) {
                bz.RemoveModifierByName(modifier_Ability_undying_tombstone_thinker.name);
            }

            bz.m_path.isTombstone = false;

            AbilityManager.setCopyBuff(modifier_ability_undying_flesh_golem.name, bz, caster, this);
        }

        AMHC.AddNewModifier(player.m_eHero, caster, this, modifier_ability_undying_flesh_golem.name, null);

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: player, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }
}

@registerModifier()
export class modifier_ability_undying_flesh_golem extends BaseModifier {
    m_nRound: number;
    IsHidden(): boolean {
        return false;
    }
    IsDebuff(): boolean {
        return false;
    }
    IsPurgable(): boolean {
        return false;
    }
    GetEffectName(): string {
        return 'particles/units/heroes/hero_undying/undying_fg_aura.vpcf';
    }
    OnCreated(params: object): void {
        if (IsServer()) {
            if (!this.GetParent().HasAbility(Ability_undying_tombstone_zombie_deathstrike.name)) {
                const ability = this.GetParent().AddAbility(Ability_undying_tombstone_zombie_deathstrike.name);
                ability.SetLevel(this.GetAbility().GetLevel());
            }
            this.m_nRound = this.GetAbility().GetSpecialValueFor('duration');
            AbilityManager.judgeBuffRound(this.GetCaster().GetPlayerOwnerID(), this);
        }
    }
    OnDestroy(): void {
        if (IsServer()) {
            if (this.GetParent().HasAbility(Ability_undying_tombstone_zombie_deathstrike.name))
                this.GetParent().RemoveAbility(Ability_undying_tombstone_zombie_deathstrike.name);
        }
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MODEL_CHANGE, ModifierFunction.HEALTH_BONUS];
    }
    GetModifierModelChange(): string {
        if (IsServer()) {
            const tModels = [
                'models/heroes/undying/undying_flesh_golem.vmdl',
                'models/items/undying/flesh_golem/davy_jones_set_davy_jones_set_kraken/davy_jones_set_davy_jones_set_kraken.vmdl',
                'models/items/undying/flesh_golem/ti9_cache_undying_carnivorous_parasitism_golem/ti9_cache_undying_carnivorous_parasitism_golem.vmdl',
            ];
            let index = 0;
            if (this.GetParent().IsRealHero()) {
                index = this.GetAbility().GetLevel() - 1;
            } else {
                const player = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
                if (player) index = player.getBzStarLevel(this.GetParent() as CDOTA_BaseNPC_BZ) - 1;
            }
            return tModels[index];
        }
    }
    GetModifierHealthBonus(): number {
        return this.GetAbility().GetSpecialValueFor('health_bonus');
    }
}
