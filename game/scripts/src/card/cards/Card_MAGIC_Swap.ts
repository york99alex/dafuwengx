import { AMHC, IsValid } from '../../utils/amhc';
import { Card } from '../card';

/**移形换位 20002 */
export class Card_MAGIC_Swap extends Card {
    isCanCastBZ(): boolean {
        return false;
    }
    isCanCastBattleTarget(): boolean {
        return false;
    }

    OnSpellStart(): void {
        const target = this.GetCursorTarget();
        if (!IsValid(target)) return;
        const owner = this.GetOwner();
        const playerTarget = GameRules.PlayerManager.getPlayer(target.GetPlayerOwnerID());
        const path = owner.m_pathCur;
        owner.blinkToPath(playerTarget.m_pathCur);
        playerTarget.blinkToPath(path);

        // 特效
        EmitGlobalSound('Hero_VengefulSpirit.NetherSwap');
        const nPtclID = AMHC.CreateParticle(
            'particles/units/heroes/hero_vengeful/vengeful_nether_swap.vpcf',
            ParticleAttachment.POINT,
            false,
            playerTarget.m_eHero,
            5
        );
        ParticleManager.SetParticleControl(nPtclID, 0, owner.m_eHero.GetAbsOrigin());
        ParticleManager.SetParticleControl(nPtclID, 1, target.GetAbsOrigin());
    }
}
