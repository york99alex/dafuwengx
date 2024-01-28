import { PS_InPrison } from '../../constants/gamemessage';
import { Path } from '../../path/Path';
import { PathDomain } from '../../path/pathtype/pathsdomain/pathdomain';
import { Player } from '../../player/player';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';
import { Ability_undying_tombstone_zombie_deathstrike } from './Ability_undying_tombstone_zombie_deathstrike';

@registerAbility()
export class Ability_undying_tombstone extends TSBaseAbility {
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return this.GetSpecialValueFor('radius');
    }
    GetIntrinsicModifierName(): string {
        return modifier_Ability_undying_tombstone.name;
    }
}

@registerModifier()
export class modifier_Ability_undying_tombstone extends BaseModifier {
    player: Player;
    evtid: number;
    IsDebuff(): boolean {
        return false;
    }
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        if (!IsServer()) return;

        Timers.CreateTimer(0, () => {
            if (!IsValid(this) || !IsValid(this.GetParent())) return;
            this.player = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
            const mPath: PathDomain = this.GetParent().m_path;
            if (mPath && IsValid(this.GetParent()) && mPath.isTombstone) {
                AbilityManager.setCopyBuff(modifier_Ability_undying_tombstone_buff.name, this.GetParent(), this.player.m_eHero, this.GetAbility());
                AbilityManager.setCopyBuff(modifier_Ability_undying_tombstone_thinker.name, this.GetParent(), this.player.m_eHero, this.GetAbility());
            }
            this.evtid = GameRules.EventManager.Register(
                'Event_GCLDEnd',
                (event: { entity: CDOTA_BaseNPC_Hero; path: PathDomain; bWin: boolean; bSwap: boolean }) => {
                    if (!IsValid(this) || !IsValid(this.GetParent())) return;
                    this.player = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
                    const parent = this.GetParent();

                    if (event.path.m_tabENPC[0] == parent) {
                        const isTomstone = parent.HasModifier(modifier_Ability_undying_tombstone_buff.name);

                        if (event.bWin && !isTomstone) {
                            event.bSwap = false;
                            event.path.isTombstone = true;
                            parent.ModifyHealth(parent.GetMaxHealth(), null, false, 0);

                            AbilityManager.setCopyBuff(modifier_Ability_undying_tombstone_buff.name, parent, this.player.m_eHero, this.GetAbility());
                            AbilityManager.setCopyBuff(
                                modifier_Ability_undying_tombstone_thinker.name,
                                parent,
                                this.player.m_eHero,
                                this.GetAbility()
                            );
                        } else {
                            event.path.isTombstone = false;
                        }
                    }
                }
            );
        });
    }
    OnDestroy(): void {
        if (IsServer() && this.evtid != null) GameRules.EventManager.UnRegisterByID(this.evtid, 'Event_GCLDEnd');
    }
}

@registerModifier()
export class modifier_Ability_undying_tombstone_buff extends BaseModifier {
    IsDebuff(): boolean {
        return false;
    }
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.MAGIC_IMMUNE]: true,
            [ModifierState.DISARMED]: true,
        };
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MODEL_CHANGE, ModifierFunction.DISABLE_TURNING];
    }
    GetModifierModelChange(): string {
        return 'models/heroes/undying/undying_tower.vmdl';
    }
    GetModifierDisableTurning(): 0 | 1 {
        return 1;
    }
}

@registerModifier()
export class modifier_Ability_undying_tombstone_thinker extends BaseModifier {
    tEvtIDs: number[];
    tZombies: CDOTA_BaseNPC[];
    path: PathDomain;
    player: Player;
    radius: number;
    target: CDOTA_BaseNPC;
    bIsGCLD?: boolean;
    IsDebuff(): boolean {
        return false;
    }
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnCreated(params: object): void {
        if (!IsServer()) return;

        Timers.CreateTimer(0, () => {
            if (!IsValid(this)) return;

            const ability = this.GetParent().FindAbilityByName(Ability_undying_tombstone.name);
            if (!ability) return;
            this.tEvtIDs = [];
            this.tZombies = [];
            this.path = this.GetParent().m_path;
            if (!this.path) {
                print('===modifier_Ability_undying_tombstone_thinker ERROR: path is null===');
                return;
            }
            this.player = GameRules.PlayerManager.getPlayer(this.path.m_nOwnerID);
            this.radius = ability.GetSpecialValueFor('radius');
            const interval = ability.GetSpecialValueFor('zombie_interval');

            this.tEvtIDs.push(
                GameRules.EventManager.Register('Event_Move', (event: { entity: CDOTA_BaseNPC_Hero }) => {
                    if (this.bIsGCLD) return;
                    if (event.entity != this.player.m_eHero) {
                        this.target = event.entity;
                        this.StartIntervalThink(interval);
                    }
                })
            );

            this.tEvtIDs.push(
                GameRules.EventManager.Register('Event_GCLD', (event: { entity: CDOTA_BaseNPC_Hero; path: PathDomain }) => {
                    if (event.path.m_tabENPC.includes(this.GetParent() as any)) {
                        this.bIsGCLD = true;
                        this.target = event.entity;
                        this.StartIntervalThink(interval);
                    }
                })
            );

            this.tEvtIDs.push(
                GameRules.EventManager.Register('Event_MoveEnd', (event: { entity: CDOTA_BaseNPC_Hero }) => {
                    if (event.entity == this.target) {
                        this.target = null;
                        this.StartIntervalThink(-1);

                        for (const zombie of this.tZombies) {
                            zombie.ForceKill(false);
                        }
                        this.tZombies = [];
                    }
                })
            );

            this.tEvtIDs.push(
                GameRules.EventManager.Register(
                    'Event_GCLDEnd',
                    (event: { entity: CDOTA_BaseNPC_Hero; path: PathDomain; bWin: boolean; bSwap: boolean }) => {
                        if (event.path.m_tabENPC.includes(this.GetParent() as any)) {
                            this.bIsGCLD = null;
                            this.target = null;
                            this.StartIntervalThink(-1);

                            for (const zombie of this.tZombies) {
                                zombie.ForceKill(false);
                            }
                            this.tZombies = [];
                        }
                    }
                )
            );
        });
    }

    OnDestroy(): void {
        if (IsServer()) {
            if (this.tZombies && this.tZombies.length > 0) {
                for (const zombie of this.tZombies) {
                    zombie.ForceKill(false);
                }
            }
            this.target = null;
            this.bIsGCLD = null;
            this.tZombies = null;
            GameRules.EventManager.UnRegisterByIDs(this.tEvtIDs);
            this.tEvtIDs = null;
        }
    }

    OnIntervalThink(): void {
        if (!IsServer()) return;
        if (0 < bit.band(PS_InPrison, this.player.m_nPlayerState)) {
            for (const zombie of this.tZombies) {
                zombie.ForceKill(false);
            }
            this.tZombies = [];
            return;
        }
        if (this.target == null) return;
        if (!this.GetParent().IsPositionInRange(this.target.GetOrigin(), this.radius)) return;

        const ability = this.GetParent().FindAbilityByName(Ability_undying_tombstone.name);
        if (!ability) return;

        const zombie = CreateUnitByName(
            'npc_dota_unit_undying_zombie',
            (this.target.GetOrigin() + RandomVector(50)) as Vector,
            true,
            this.player.m_eHero,
            this.player.m_eHero,
            this.GetParent().GetTeamNumber()
        );
        if (zombie) {
            zombie.SetOwner(this.player.m_eHero);
            // zombie.m_bBZ = true

            if (this.bIsGCLD) zombie['m_bGCLD'] = true;
            zombie.AddNewModifier(this.GetCaster(), ability, modifier_Ability_undying_tombstone_zombie.name, {});

            if (zombie.HasAbility('undying_tombstone_zombie_deathstrike')) zombie.RemoveAbility('undying_tombstone_zombie_deathstrike');
            if (!zombie.HasAbility(Ability_undying_tombstone_zombie_deathstrike.name)) {
                const abilityDeathstrike = zombie.AddAbility(Ability_undying_tombstone_zombie_deathstrike.name);
                abilityDeathstrike.SetLevel(ability.GetLevel());
            }

            zombie.SetForceAttackTarget(this.target);
            this.tZombies.push(zombie);
        }
    }
}

@registerModifier()
export class modifier_Ability_undying_tombstone_zombie extends BaseModifier {
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.INVULNERABLE]: true,
            [ModifierState.NO_HEALTH_BAR]: true,
        };
    }
}
