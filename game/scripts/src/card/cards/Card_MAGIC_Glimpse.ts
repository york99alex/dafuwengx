import { CameraManage } from '../../mode/S2Cmode/CameraManage';
import { AMHC, IsValid } from '../../utils/amhc';
import { Card } from '../card';

/**恶念瞥视 */
export class Card_MAGIC_Glimpse extends Card {
    isCanCastSelf(): boolean {
        return true;
    }
    isCanCastBZ(): boolean {
        return false;
    }

    OnSpellStart(): void {
        const target = this.GetCursorTarget();
        if (!IsValid(target)) return;
        const owner = this.GetOwner();
        const playerTarget = GameRules.PlayerManager.getPlayer(target.GetPlayerOwnerID());

        let path = playerTarget.m_pathLast;
        if (!path) path = playerTarget.m_pathCur;

        owner.blinkToPath(playerTarget.m_pathCur);
        playerTarget.blinkToPath(path);

        // 起始特效
        let nPtclID = AMHC.CreateParticle(
            'particles/units/heroes/hero_disruptor/disruptor_glimpse_targetstart.vpcf',
            ParticleAttachment.POINT,
            false,
            owner.m_eHero,
            3
        );
        ParticleManager.SetParticleControl(nPtclID, 0, playerTarget.m_eHero.GetAbsOrigin());
        nPtclID = AMHC.CreateParticle(
            'particles/units/heroes/hero_disruptor/disruptor_glimpse_travel.vpcf',
            ParticleAttachment.POINT,
            false,
            owner.m_eHero,
            3
        );
        ParticleManager.SetParticleControlEnt(
            nPtclID,
            0,
            playerTarget.m_eHero,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            null,
            playerTarget.m_eHero.GetAbsOrigin(),
            true
        );
        ParticleManager.SetParticleControl(nPtclID, 1, path.m_entity.GetAbsOrigin());
        ParticleManager.SetParticleControl(nPtclID, 2, Vector(1, 1, 1));
        nPtclID = AMHC.CreateParticle(
            'particles/units/heroes/hero_disruptor/disruptor_glimpse_targetend.vpcf',
            ParticleAttachment.POINT,
            false,
            owner.m_eHero,
            3
        );
        ParticleManager.SetParticleControlEnt(
            nPtclID,
            0,
            playerTarget.m_eHero,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            null,
            playerTarget.m_eHero.GetAbsOrigin(),
            true
        );
        ParticleManager.SetParticleControl(nPtclID, 1, path.m_entity.GetAbsOrigin());
        ParticleManager.SetParticleControl(nPtclID, 2, Vector(1, 1, 1));
        EmitGlobalSound('Hero_Disruptor.Glimpse.Target');

        Timers.CreateTimer(1, () => {
            EmitGlobalSound('Hero_Disruptor.Glimpse.End');
            // 中断其他行为
            playerTarget.moveStop();
            GameRules.EventManager.FireEvent('Event_ActionStop', { entity: playerTarget.m_eHero });
            playerTarget.blinkToPath(path);
            path.onPath(playerTarget);

            // 视角
            CameraManage.LookAt(playerTarget.m_nPlayerID, playerTarget.m_eHero.GetAbsOrigin(), 0.1);
            CameraManage.LookAt(owner.m_nPlayerID, playerTarget.m_eHero.GetAbsOrigin(), 0.1);
        });
    }
}
