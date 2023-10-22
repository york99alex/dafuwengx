import { GS_None } from "./gamemessage"

/**死亡清算 */
export class DeathClearing {
    beforeGameState = {
        m_typeState: GS_None,
        m_nOrderID: -1,
        m_timeOprt: -1
    }
    mHooks = null
    //  正在清算的玩家
    mDCPlayers = []

    resumeGameTimer = null
    static EvtID = {
        //  触发死亡清算
        Event_TO_SendDeathClearing: "Event_TO_SendDeathClearing",
        //  死亡清算操作结束
        Event_TO_DeathClearing: "Event_TO_DeathClearing"
    }
}