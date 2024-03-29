import { PS_AtkMonster } from '../../constants/gamemessage';
import { Player } from '../../player/player';
import { AMHC, IsValid, stringToVector } from '../../utils/amhc';
import { BaseModifierMotionBoth, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';
import { AbilityManager } from '../abilitymanager';
import { TSBaseAbility } from '../tsBaseAbilty';

/**
 * ursa_earthshock 震撼大地
 *
 */
@registerAbility()
export class Ability_ursa_earthshock extends TSBaseAbility {
    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM;
        }
        return UnitFilterResult.SUCCESS;
    }

    /**开始技能效果 */
    OnSpellStart() {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());

        // 伤害作用格数内的玩家
        let pathTarger = oPlayer.m_pathCur;
        pathTarger = GameRules.PathManager.getNextPath(pathTarger, this.GetSpecialValueFor('hop_distance'));
        oPlayer.m_eHero.StartGestureWithPlaybackRate(GameActivity.DOTA_CAST_ABILITY_1, 0.5);
        AMHC.AddNewModifier(oPlayer.m_eHero, oPlayer.m_eHero, this, modifier_ursa_earthshock_movement.name, {
            end_pose: pathTarger.m_entity.GetAbsOrigin(),
            height: 83,
            duration: 0.25,
        });
        Timers.CreateTimer(0.25, () => {
            oPlayer.blinkToPath(pathTarger);
            // 特效
            const nPtclID = AMHC.CreateParticle(
                'particles/units/heroes/hero_ursa/ursa_earthshock.vpcf',
                ParticleAttachment.POINT,
                false,
                oPlayer.m_eHero
            );
            ParticleManager.SetParticleControl(nPtclID, 0, oPlayer.m_pathCur.m_entity.GetAbsOrigin());
            ParticleManager.SetParticleControl(nPtclID, 1, Vector(150, 150, 225));
            ParticleManager.SetParticleControl(nPtclID, 2, Vector(150, 150, 225));
            EmitGlobalSound('Hero_Ursa.Earthshock');

            let tabPlayer: Player[] = [];
            GameRules.PlayerManager.findRangePlayer(tabPlayer, pathTarger, this.GetSpecialValueFor('range'), null, (player: Player) => {
                if (player == oPlayer || !this.checkTarget(player.m_eHero) || 0 < bit.band(PS_AtkMonster, player.m_nPlayerState)) {
                    return false;
                }
                return true;
            });
            // 对玩家造成伤害
            if (tabPlayer.length > 0) {
                for (const v of tabPlayer) {
                    AMHC.Damage(this.GetCaster(), v.m_eHero, this.GetSpecialValueFor('damage'), this.GetAbilityDamageType(), this);
                }
            }
            // 判断路径触发功能
            oPlayer.m_pathCur.onPath(oPlayer);
        });

        // 触发耗蓝
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: oPlayer, oAblt: this });
        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this);
    }
}

@registerModifier()
export class modifier_ursa_earthshock_movement extends BaseModifierMotionBoth {
    distance: number;
    direction: Vector;
    endPos: Vector;
    height: number;
    duration: number;
    speed: number;
    IsHidden() {
        return true;
    }

    OnCreated(params: object): void {
        const parent = this.GetParent();
        if (IsServer() && IsValid(parent)) {
            this.endPos = stringToVector(params['end_pose']);
            this.height = tonumber(params['height']);
            this.duration = tonumber(params['duration']);
            this.distance = ((this.endPos - parent.GetAbsOrigin()) as Vector).Length2D();
            this.direction = ((this.endPos - parent.GetAbsOrigin()) as Vector).Normalized();
            this.speed = this.distance / this.duration;

            this.ApplyHorizontalMotionController();
            this.ApplyVerticalMotionController();
        }
    }

    /**更新横向位置 */
    UpdateHorizontalMotion(me: CDOTA_BaseNPC, dt: number): void {
        if (this.GetElapsedTime() >= this.duration) return;
        const pos = me.GetOrigin().__add(this.direction.__mul(this.speed).__mul(dt));
        me.SetOrigin(pos);
    }

    /**更新纵向位置 */
    UpdateVerticalMotion(me: CDOTA_BaseNPC, dt: number): void {
        if (this.GetElapsedTime() >= this.duration) return;
        let pos = me.GetOrigin();
        let height = pos.z;
        pos.z = height + (this.speed * dt) / 2;
        me.SetOrigin(pos);
    }

    OnDestroy(): void {
        if (!IsServer()) return;
        const hero = this.GetParent();
        if (hero.IsRealHero()) ParaAdjuster.ModifyMana(hero);
        hero.RemoveHorizontalMotionController(this);
        hero.RemoveVerticalMotionController(this);
    }
}
