import { Player } from "../player/player"

export class Card {
    /**卡牌ID */
    m_nID: number
    /**拥有者ID */
    m_nOwnerID: PlayerID
    /**魔法消耗 */
    m_nManaCost: number
    /**基础魔法消耗 */
    m_nManaCostBase: number

    /**释放错误信息 */
    m_strCastError: string
    /**释放错误音效 */
    m_strCastErrorSound: string

    /**卡牌类型 */
    m_typeCard: number
    /**施法类型 */
    m_typeCast: number
    /**卡牌种类 */
    m_typeKind: number

    /**目标单位 */
    m_eTarget
    /**目标点 */
    m_vTargetPos

    /**技能信息 */
    m_tabAbltInfo

    constructor(tInfo, nPlayerID: PlayerID) {
        this.m_typeCard = tonumber(tInfo.cardType)
        this.m_nID = GameRules.CardManager.getIncludeID()
        if (nPlayerID) {
            this.m_nOwnerID = nPlayerID
            if (!GameRules.CardManager.m_tGetCardCount[nPlayerID])
                GameRules.CardManager.m_tGetCardCount[nPlayerID] = []
            GameRules.CardManager.m_tGetCardCount[nPlayerID][this.m_typeCard]++
        }

        this.m_typeCast = tonumber(tInfo.CastType)
        this.m_typeKind = tonumber(tInfo.CardKind)
        this.m_nManaCost = tonumber(tInfo.ManaCost)
        this.m_nManaCostBase = this.m_nManaCost
    }

    setOwner(playerID: PlayerID) {
        this.m_nOwnerID = playerID
    }

    GetManaCost() {
        let nManaCost = this.m_nManaCost
        // 计算魔法减缩
        const player = GameRules.PlayerManager.getPlayer(this.m_nOwnerID)
        if (player) {
            nManaCost -= player.m_nManaSub
            if (nManaCost < 0) nManaCost = 0
        }
        return nManaCost
    }

    encodeJsonData() {
        return {
            nCardID: this.m_nID,
            CardType: this.m_typeCard,
            CardKind: this.m_typeKind,
            CastType: this.m_typeCast,
            ManaCost: this.GetManaCost()
        }
    }

}