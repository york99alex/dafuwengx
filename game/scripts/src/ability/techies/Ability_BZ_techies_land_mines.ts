import { PS_AbilityImmune, PS_Die, PS_InPrison } from '../../constants/gamemessage';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { AMHC, IsValid } from '../../utils/amhc';
import { registerAbility } from '../../utils/dota_ts_adapter';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';

@registerAbility()
export class Ability_BZ_techies_land_mines extends TSBaseAbility {
    constructor() {
        super();
        this.ai();
    }

    CastFilterResult(): UnitFilterResult {
        return UnitFilterResult.SUCCESS;
    }

    OnSpellStart(): void {
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player) return;

        this.m_pathTarget = (this.GetCaster() as CDOTA_BaseNPC_BZ).m_path;
        if (!this.m_pathTarget) return;
        this.m_vPosTarget = this.m_pathTarget.m_entity.GetAbsOrigin();
        print('===BZ-landmines-OnSpellStart===pos:', this.m_vPosTarget);
        this.m_vPosTarget.__add(Vector(RandomInt(-50, 50), RandomInt(-50, 50), 0));
        print('===BZ-landmines-OnSpellStart===add pos:', this.m_vPosTarget);

        // 音效
        EmitGlobalSound('Hero_Techies.RemoteMine.Plant');
        // 创建地雷
        const eBomb = AMHC.CreateUnit('bomb', this.m_vPosTarget, 0, this.GetCaster(), DotaTeam.GOODGUYS);
        eBomb['m_nDamage'] = this.GetSpecialValueFor('damage');
        eBomb['m_path'] = this.m_pathTarget;

        if (!player.tBombs) player.tBombs = {};
        if (!player.tBombs[eBomb['m_path'].m_nID]) player.tBombs[eBomb['m_path'].m_nID] = [];
        player.tBombs[eBomb['m_path'].m_nID].push(eBomb);

        GameRules.EventManager.FireEvent('dota_player_used_ability', {
            caster_entindex: this.GetCaster().GetEntityIndex(),
            abilityname: this.GetAbilityName(),
        });

        // 该地区有人直接引爆
        Timers.CreateTimer(1, () => {
            if (IsValid(eBomb)) {
                const tEnt: CDOTA_BaseNPC[] = eBomb['m_path'].getJoinEnt();
                for (const entity of tEnt) {
                    if (this.checkTarget(entity, player.m_nPlayerID)) {
                        // 标记攻城炸弹
                        if (eBomb['m_path'].m_nPlayerIDGCLD) {
                            const playerGCLD = GameRules.PlayerManager.getPlayer(eBomb['m_path'].m_nPlayerIDGCLD);
                            if (playerGCLD) {
                                // 指定炸攻城英雄
                                eBomb['targets'] = [playerGCLD.m_eHero];
                            }
                        }
                        GameRules.EventManager.FireEvent('Event_BombDetonate', { path: eBomb['m_path'], player: player });
                        return;
                    }
                }
            }
        });
    }

    checkTarget(eTarget: CDOTA_BaseNPC, nPlayerID?: number): boolean {
        if (!IsValid(eTarget)) return false;
        if (eTarget.GetPlayerOwnerID() == nPlayerID) return false;
        const playerTarget = GameRules.PlayerManager.getPlayer(eTarget.GetPlayerOwnerID());
        if (!playerTarget) return false;
        if (0 < bit.band(playerTarget.m_nPlayerState, PS_Die + PS_AbilityImmune + PS_InPrison)) return false;
        return true;
    }

    isCanCDSub(): boolean {
        return false;
    }

    isCanManaSub(): boolean {
        return false;
    }

    GetIntrinsicModifierName(): string {
        return 'modifier_techies_land_mines';
    }

    ai(): void {
        if (IsClient()) return;

        Timers.CreateTimer(() => {
            if (!IsValid(this)) return;

            if (
                this.IsCooldownReady() &&
                AbilityManager.isCanOnAblt(this.GetCaster()) &&
                !this.GetCaster().IsSilenced() &&
                this.GetCaster().GetMana() >= this.GetManaCost(0)
            ) {
                // 蓝满了施法技能
                ExecuteOrderFromTable({
                    UnitIndex: this.GetCaster().entindex(),
                    OrderType: UnitOrder.CAST_NO_TARGET,
                    TargetIndex: null, // Optional.  Only used when targeting units
                    AbilityIndex: this.GetEntityIndex(), // Optional.  Only used when casting abilities
                    Position: null, // Optional.  Only used when targeting the ground
                    Queue: false, // Optional.  Used for queueing up abilities
                });
            }
            return 1;
        });
    }
}
