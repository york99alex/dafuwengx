import { IsValid } from '../../utils/amhc';
import { Card } from '../card';

/**上帝之手 30004 */
export class Card_EVENT_Hand_Of_God extends Card {
    m_sName: string = '上帝之手';
    isCanCastMove(): boolean {
        return true;
    }
    OnSpellStart(): void {
        const hand_particle = 'particles/units/heroes/hero_chen/chen_hand_of_god.vpcf';
        GameRules.PlayerManager.m_tabPlayers.forEach(player => {
            if (IsValid(player.m_eHero) && !player.m_bDie) {
                ParticleManager.CreateParticle(hand_particle, ParticleAttachment.POINT_FOLLOW, player.m_eHero);
                player.m_eHero.Heal(player.m_eHero.GetMaxHealth() * 0.5, null);
            }
            player.m_tabBz.forEach(bz => {
                if (IsValid(bz)) {
                    ParticleManager.CreateParticle(hand_particle, ParticleAttachment.POINT_FOLLOW, bz);
                    bz.Heal(player.m_eHero.GetMaxHealth() * 0.5, null);
                }
            });
        });
        EmitGlobalSound('CNY_Beast.HandOfGodHealHero');
    }
}
