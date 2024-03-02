import { PathRune } from '../../path/pathtype/pathrune';
import { IsValid } from '../../utils/amhc';
import { Card } from '../card';

/**魔瓶 20006 */
export class Card_MAGIC_Bottle extends Card {
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!IsValid(target)) return UnitFilterResult.FAIL_CUSTOM;
        if (!this.CanUseCard(target)) return UnitFilterResult.FAIL_CUSTOM;
        if (!target.GetUnitName().includes('rune_')) {
            this.m_strCastError = 'CardError_TargetNotRune';
            return UnitFilterResult.FAIL_CUSTOM;
        }
        this.m_eTarget = target;
        return UnitFilterResult.SUCCESS;
    }
    isCanCastMove(): boolean {
        return true;
    }
    isCanCastInPrison(): boolean {
        return true;
    }
    isCanCastHeroAtk(): boolean {
        return true;
    }
    isCanCastBZ(): boolean {
        return false;
    }
    isCanCastHero(): boolean {
        return false;
    }
    isCanCastRune(): boolean {
        return true;
    }

    OnSpellStart(): void {
        const target = this.GetCursorTarget();
        if (!IsValid(target)) return;

        const player = this.GetOwner();
        const path: PathRune = target.m_path;
        if (!path || !target.m_bRune) return;

        // 获得一张对应神符卡牌
        let cardType: number;
        if (path.m_typeRune == RuneType.DOUBLEDAMAGE) {
            cardType = CardType.Card_MAGIC_BottleDouble;
        } else if (path.m_typeRune == RuneType.HASTE) {
            cardType = CardType.Card_MAGIC_BottleHaste;
        } else if (path.m_typeRune == RuneType.INVISIBILITY) {
            cardType = CardType.Card_MAGIC_BottleInvisibility;
        } else if (path.m_typeRune == RuneType.REGENERATION) {
            cardType = CardType.Card_MAGIC_BottleRegeneration;
        } else if (path.m_typeRune == RuneType.BOUNTY) {
            cardType = CardType.Card_MAGIC_BottleBounty;
        } else if (path.m_typeRune == RuneType.ARCANE) {
            cardType = CardType.Card_MAGIC_BottleArcane;
        } else if (path.m_typeRune == RuneType.XP) {
            cardType = CardType.Card_MAGIC_BottleXP;
        } else if (path.m_typeRune == RuneType.SHIELD) {
            cardType = CardType.Card_MAGIC_BottleShield;
        } else {
            return;
        }
        const card = GameRules.CardFactory.create(cardType, player.m_nPlayerID);
        if (card) {
            player.setCardAdd(card);
            // 移除神符
            path.destoryRune();
            // 音效
            EmitGlobalSound('Bottle.Cork');
        }
    }
}
