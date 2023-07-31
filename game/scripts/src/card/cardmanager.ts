export class CardManager{
    static EvtID = {
        Event_CardUseRequest : "Event_CardUseRequest"   // 请求使用卡牌
    }
    m_tabCards = []
    m_tGetCardCount = []     // 记录给玩家发牌的数量{playerid,{type,count}}

}