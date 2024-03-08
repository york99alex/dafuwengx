import { PS_AbilityImmune, PS_AtkHero, PS_Die, PS_InPrison } from '../../constants/gamemessage';
import { CameraManage } from '../../mode/S2Cmode/CameraManage';
import { AMHC } from '../../utils/amhc';
import { Card } from '../card';

/**两级反转 20003 */
export class Card_MAGIC_ReversePolarity extends Card {
    m_sName: string = '两级反转';
    OnSpellStart(): void {
        const owner = this.GetOwner();
        const path = GameRules.PathManager.getNextPath(owner.m_pathCur, 1 * owner.m_nMoveDir);
        if (!path) return;

        // 其他玩家设置到该区域
        for (const player of GameRules.PlayerManager.m_tabPlayers) {
            if (player != owner && 0 == bit.band(PS_AbilityImmune + PS_InPrison + PS_Die + PS_AtkHero, player.m_nPlayerState))
                player.blinkToPath(path);
        }

        // 特效
        EmitGlobalSound('Hero_Magnataur.ReversePolarity.Cast');
        const nPtclID = AMHC.CreateParticle(
            'particles/units/heroes/hero_magnataur/magnataur_reverse_polarity.vpcf',
            ParticleAttachment.ABSORIGIN,
            false,
            owner.m_eHero,
            3
        );
        ParticleManager.SetParticleControlEnt(nPtclID, 0, owner.m_eHero, ParticleAttachment.POINT_FOLLOW, null, owner.m_eHero.GetAbsOrigin(), true);
        ParticleManager.SetParticleControl(nPtclID, 1, Vector(500, 0, 0));
        ParticleManager.SetParticleControl(nPtclID, 2, Vector(0.3, 0, 0));
        ParticleManager.SetParticleControl(nPtclID, 3, path.m_entity.GetAbsOrigin());

        // 视角
        CameraManage.LookAt(-1, path.m_entity.GetAbsOrigin(), 0.1);
    }
}
