import { PS_AbilityImmune, PS_Die, PS_InPrison } from '../../constants/gamemessage';
import { Path } from '../../path/Path';
import { DamageEvent, Player } from '../../player/player';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';

@registerAbility()
export class Ability_techies_land_mines extends TSBaseAbility {
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (IsValid(target)) return this.CastFilterResultLocation(target.GetAbsOrigin());
        return UnitFilterResult.SUCCESS;
    }

    CastFilterResultLocation(location: Vector): UnitFilterResult {
        if (!this.isCanCast()) return UnitFilterResult.FAIL_CUSTOM;
        if (IsServer()) {
            const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (player) {
                const path = GameRules.PathManager.getClosePath(location);
                // 范围
                const nRange = math.floor(this.GetSpecialValueFor('range') / 2);
                const nDis = math.min(
                    GameRules.PathManager.getPathDistance(path, player.m_pathCur, true),
                    GameRules.PathManager.getPathDistance(path, player.m_pathCur, false)
                );
                if (nDis > nRange) {
                    this.m_strCastError = 'AbilityError_Range';
                    return UnitFilterResult.FAIL_CUSTOM;
                }
                this.m_vPosTarget = location;
                this.m_pathTarget = path;
            }
        }
        return UnitFilterResult.SUCCESS;
    }

    OnSpellStart(): void {
        if (!this.m_vPosTarget || !this.m_pathTarget) return;
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player) return;

        // 音效
        EmitGlobalSound('Hero_Techies.RemoteMine.Plant');
        // 创建地雷
        const eBomb = AMHC.CreateUnit('bomb', this.m_vPosTarget, 0, this.GetCaster(), DotaTeam.GOODGUYS);
        eBomb['m_nDamage'] = this.GetSpecialValueFor('damage');
        eBomb['m_path'] = this.m_pathTarget;

        if (!player.tBombs) player.tBombs = {};
        if (!player.tBombs[eBomb['m_path'].m_nID]) player.tBombs[eBomb['m_path'].m_nID] = [];
        player.tBombs[eBomb['m_path'].m_nID].push(eBomb);

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: player, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(player, this);

        // 该地区有人直接引爆
        Timers.CreateTimer(1, () => {
            if (IsValid(eBomb)) {
                const tEnt: CDOTA_BaseNPC[] = eBomb['m_path'].getJoinEnt();
                for (const entity of tEnt) {
                    if (this.checkTarget(entity)) GameRules.EventManager.FireEvent('Event_BombDetonate', { path: eBomb['m_path'], player: player });
                }
            }
        });
    }

    checkTarget(eTarget: CDOTA_BaseNPC): boolean {
        if (!IsValid(eTarget)) return false;
        if (eTarget.GetPlayerOwnerID() == this.GetCaster().GetPlayerOwnerID()) return false;
        const playerTarget = GameRules.PlayerManager.getPlayer(eTarget.GetPlayerOwnerID());
        if (!playerTarget) return false;
        if (0 < bit.band(playerTarget.m_nPlayerState, PS_Die + PS_AbilityImmune + PS_InPrison)) return false;
        return true;
    }

    GetIntrinsicModifierName(): string {
        return 'modifier_techies_land_mines';
    }
}

/**地雷检测buff */
@registerModifier()
export class modifier_techies_land_mines extends BaseModifier {
    tEventID: number[];
    oPlayer: Player;
    IsHidden(): boolean {
        return true;
    }
    IsPurgable(): boolean {
        return false;
    }
    OnDestroy(): void {
        if (IsServer()) GameRules.EventManager.UnRegisterByIDs(this.tEventID);
    }
    OnCreated(params: object): void {
        if (IsClient() || !this.GetParent().IsRealHero()) return;
        this.oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
        if (!this.oPlayer) return;

        this.tEventID = [];
        // 监听玩家踩入
        this.tEventID.push(
            GameRules.EventManager.Register(
                'Event_JoinPath',
                (event: { player: Player }) => {
                    if (event.player != this.oPlayer) {
                        Timers.CreateTimer(() => {
                            GameRules.EventManager.FireEvent('Event_BombDetonate', {
                                path: event.player.m_pathCur,
                                player: this.oPlayer,
                            });
                        });
                    }
                },
                this
            )
        );
        // 监听引爆
        this.tEventID.push(
            GameRules.EventManager.Register(
                'Event_BombDetonate',
                (event: { path: Path; player: Player; target?: CDOTA_BaseNPC_Hero }) => {
                    if (event.player != this.oPlayer) return;
                    const tBombs = this.oPlayer.tBombs[event.path.m_nID];
                    if (!tBombs || tBombs.length == 0) return;

                    // 获取被炸单位
                    let tETarget: CDOTA_BaseNPC[] = event.path.getJoinEnt().concat(event.target);
                    // 加入兵卒
                    if (event.path['m_tabENPC']) tETarget = tETarget.concat(event.path['m_tabENPC']);

                    tETarget = tETarget.filter(entity => {
                        return this.GetAbility()['checkTarget'](entity);
                    });

                    // 伤害
                    for (const eBomb of tBombs) {
                        if (IsValid(eBomb)) {
                            // 伤害全部目标
                            for (const target of tETarget) {
                                // 造成伤害
                                AMHC.Damage(
                                    this.GetParent(),
                                    target,
                                    eBomb['m_nDamage'],
                                    this.GetAbility().GetAbilityDamageType(),
                                    this.GetAbility(),
                                    1,
                                    { bIgnoreBZHuiMo: true }
                                );
                                // 爆炸特效
                                AMHC.CreateParticle(
                                    'particles/units/heroes/hero_techies/techies_suicide.vpcf',
                                    ParticleAttachment.ABSORIGIN,
                                    true,
                                    eBomb,
                                    5
                                );
                                // 销毁炸弹
                                eBomb.Destroy();
                            }
                        }
                    }
                    this.oPlayer.tBombs[event.path.m_nID] = null;
                    EmitGlobalSound('Hero_Techies.RemoteMine.Detonate');
                },
                this
            )
        );
        // 监听死亡
        this.tEventID.push(
            GameRules.EventManager.Register(
                'Event_PlayerDie',
                (event: { player: Player }) => {
                    if (event.player == this.oPlayer) {
                        for (const pathID in this.oPlayer.tBombs) {
                            for (const eBomb of this.oPlayer.tBombs[pathID]) {
                                if (IsValid(eBomb)) eBomb.Destroy();
                            }
                        }
                        this.oPlayer.tBombs = {};
                    }
                },
                this
            )
        );
        // 监听伤害
        this.tEventID.push(
            GameRules.EventManager.Register(
                'Event_OnDamage',
                (event: DamageEvent) => {
                    if (event.bBladeMail) {
                        if (IsValid(event.ability) && event.ability.GetAbilityName) {
                            if (event.ability.GetAbilityName() == 'Ability_techies_land_mines') {
                                // 刃甲反炸弹的伤害，不回蓝
                                event.bIgnoreBZHuiMo = true;
                            }
                        }
                    }
                },
                this
            )
        );
    }
}
