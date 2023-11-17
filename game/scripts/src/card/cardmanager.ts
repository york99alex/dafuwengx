export class CardManager {
    static EvtID = {
        Event_CardUseRequest: "Event_CardUseRequest"   // 请求使用卡牌
    }
    m_tabCards = []
    m_tGetCardCount: {
        [playerid: number]: {
            [type: number]: number
        }
    }    // 记录给玩家发牌的数量{playerid,{type,count}}
    m_nIncludeID = 0

    /**初始化 */
    init() {
        this.registerEvent()
    }

    registerEvent() {

    }

    /**获取卡牌自增ID */
    getIncludeID() {
        return this.m_nIncludeID++
    }
}