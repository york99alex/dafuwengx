class Card {
    /**卡牌ID */
    m_nID: number
    /**拥有者ID */
    m_nOwnerID: number
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

    constructor(tInfo, nPlayerID: number) {
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
}