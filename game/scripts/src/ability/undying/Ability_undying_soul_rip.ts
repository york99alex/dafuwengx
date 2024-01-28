import { AMHC } from '../../utils/amhc';
import { registerAbility } from '../../utils/dota_ts_adapter';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';

@registerAbility()
export class Ability_undying_soul_rip extends TSBaseAbility {
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!this.isCanCast()) return UnitFilterResult.FAIL_CUSTOM;
        else return UnitFilterResult.SUCCESS;
    }
    isCanCastSelf(): boolean {
        return true;
    }
    isCanCastBZ(): boolean {
        return true;
    }
    isCanCastMonster(): boolean {
        return false;
    }
    OnSpellStart(): void {
        if (!IsServer()) return;
        const target = this.GetCursorTarget();
        const caster = this.GetCaster();

        let isFriend = target == caster;
        const player = GameRules.PlayerManager.getPlayer(caster.GetPlayerOwnerID());
        if (!player) return;
        for (const bz of player.m_tabBz) {
            if (bz == target) {
                isFriend = true;
                break;
            }
        }

        print('===OnSpellStart===bIsFriend:', isFriend, 'targetName:', target.GetUnitName());
        const isTombstone = target.IsOther() && string.find(target.GetUnitName(), 'npc_dota_unit_tombstone') != null;
        const nDamage = this.GetSpecialValueFor('damage_per_unit');
        let nCount = 0;
        const particleName = isFriend
            ? 'particles/units/heroes/hero_undying/undying_soul_rip_heal.vpcf'
            : 'particles/units/heroes/hero_undying/undying_soul_rip_damage.vpcf';

        const enemies = FindUnitsInRadius(
            caster.GetTeamNumber(),
            caster.GetOrigin(),
            null,
            9999,
            UnitTargetTeam.BOTH,
            UnitTargetType.HERO + UnitTargetType.BASIC,
            UnitTargetFlags.FOW_VISIBLE,
            FindOrder.ANY,
            false
        );

        for (const unit of enemies) {
            if (unit != target) {
                nCount++;
                const nPtclID = ParticleManager.CreateParticle(particleName, ParticleAttachment.POINT_FOLLOW, target);
                ParticleManager.SetParticleControlEnt(
                    nPtclID,
                    0,
                    target,
                    ParticleAttachment.POINT_FOLLOW,
                    'attach_hitloc',
                    target.GetAbsOrigin(),
                    true
                );
                ParticleManager.SetParticleControlEnt(nPtclID, 1, unit, ParticleAttachment.POINT_FOLLOW, 'attach_hitloc', unit.GetAbsOrigin(), true);
                ParticleManager.ReleaseParticleIndex(nPtclID);

                AMHC.Damage(caster, unit, nDamage, this.GetAbilityDamageType(), this, 1, {
                    bIgnoreDamageSelf: true,
                });
            }
        }

        const amount = nDamage * nCount;
        if (isFriend) {
            target.Heal(amount, this);
            SendOverheadEventMessage(target.GetPlayerOwner(), OverheadAlert.HEAL, target, amount, caster.GetPlayerOwner());
        } else {
            if (!isTombstone) AMHC.Damage(caster, target, amount, this.GetAbilityDamageType(), this);
        }

        EmitSoundOn('Hero_Undying.SoulRip.Cast', caster);

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: player, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }
}
