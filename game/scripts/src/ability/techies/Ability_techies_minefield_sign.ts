import { PS_AbilityImmune } from '../../constants/gamemessage';
import { Path } from '../../path/path';
import { Player } from '../../player/player';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';

@registerAbility()
export class Ability_techies_minefield_sign extends TSBaseAbility {
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
                // 距离
                const dis = ((location - path.m_entity.GetAbsOrigin()) as Vector).Length2D();
                if (dis > 150) {
                    this.m_strCastError = 'AbilityError_TargetPath';
                    return UnitFilterResult.FAIL_CUSTOM;
                }
                // 验证是否有雷
                if (!player.tBombs || !player.tBombs[path.m_nID] || player.tBombs[path.m_nID].length <= 0) {
                    this.m_strCastError = 'AbilityError_NoBomb';
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
        EmitGlobalSound('Hero_Techies.Sign');

        // 创建标识
        const eSign = AMHC.CreateUnit('bomb', this.m_vPosTarget, RandomInt(270 - 45, 270 + 45), this.GetCaster(), DotaTeam.GOODGUYS);
        eSign.SetModel('models/heroes/techies/techies_sign.vmdl');
        eSign['m_nChance'] = this.GetSpecialValueFor('chance');
        if (!player.tBombSigns) player.tBombSigns = {};
        if (!player.tBombSigns[this.m_pathTarget.m_nID]) player.tBombSigns[this.m_pathTarget.m_nID] = [];
        player.tBombSigns[this.m_pathTarget.m_nID].push(eSign);

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: player, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }

    GetIntrinsicModifierName(): string {
        return 'modifier_techies_minefield_sign';
    }
}

/**标识检测buff */
@registerModifier()
export class modifier_techies_minefield_sign extends BaseModifier {
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
        if (!this.oPlayer.tBombSigns) this.oPlayer.tBombSigns = {};

        this.tEventID = [];
        // 监听玩家踩入
        this.tEventID.push(
            GameRules.EventManager.Register(
                'Event_CurPathChange',
                (event: { player: Player }) => {
                    if (event.player != this.oPlayer && 0 == bit.band(PS_AbilityImmune, event.player.m_nPlayerState)) {
                        // 计算触发引爆概率
                        const path = event.player.m_pathCur;
                        const tBombSigns = this.oPlayer.tBombSigns[path.m_nID];
                        if (!tBombSigns) return;

                        for (const eSign of tBombSigns) {
                            const chance = eSign['m_nChance'] || 0;
                            if (RandomInt(1, 100) <= chance) {
                                GameRules.EventManager.FireEvent('Event_BombDetonate', {
                                    path: path,
                                    player: this.oPlayer,
                                    target: event.player.m_eHero,
                                });
                            }
                        }
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
                    const tBombSigns = this.oPlayer.tBombSigns[event.path.m_nID];
                    if (!tBombSigns) return;
                    for (const eSign of tBombSigns) {
                        if (IsValid(eSign)) eSign.Destroy();
                    }
                    this.oPlayer.tBombSigns[event.path.m_nID] = null;
                },
                this
            )
        );
    }
}
