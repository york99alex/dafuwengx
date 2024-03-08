import { AMHC, IsValid } from '../../utils/amhc';
import { Card } from '../card';

/**窃取 20001 */
export class Card_MAGIC_Card_Steal extends Card {
    m_sName: string = '窃取';
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!IsValid(target)) return UnitFilterResult.FAIL_CUSTOM;
        if (!this.CanUseCard(target)) return UnitFilterResult.FAIL_CUSTOM;
        const playerTarget = GameRules.PlayerManager.getPlayer(target.GetPlayerOwnerID());
        if (!playerTarget) return UnitFilterResult.FAIL_CUSTOM;
        // 获取目标上次使用的卡牌
        if (playerTarget.m_tabUseCardType.length < 1) {
            this.m_strCastError = 'CardError_NoLastCard';
            return UnitFilterResult.FAIL_CUSTOM;
        }
        this.m_eTarget = target;
        return UnitFilterResult.SUCCESS;
    }
    isCanCastInPrisonTarget(): boolean {
        return true;
    }

    OnSpellStart(): void {
        const target = this.GetCursorTarget();
        if (!IsValid(target)) return;
        const owner = this.GetOwner();
        const playerTarget = GameRules.PlayerManager.getPlayer(target.GetPlayerOwnerID());
        const cardLastType = playerTarget.m_tabUseCardType[playerTarget.m_tabUseCardType.length - 1];
        if (!cardLastType) return;
        const card = GameRules.CardFactory.create(cardLastType, owner.m_nPlayerID);
        if (card) owner.setCardAdd(card);

        // 特效
        EmitGlobalSound('Hero_Rubick.SpellSteal.Cast');
        const nPtclID = AMHC.CreateParticle(
            'particles/units/heroes/hero_rubick/rubick_spell_steal.vpcf',
            ParticleAttachment.OVERHEAD_FOLLOW,
            false,
            playerTarget.m_eHero,
            3
        );
        ParticleManager.SetParticleControl(nPtclID, 1, owner.m_eHero.GetAbsOrigin());
    }
}
