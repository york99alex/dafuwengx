export class Supply {
    m_tItems: []
    m_nFirstID: number
    m_nGMOrder: number

    init() {
        GameRules.EventManager.Register("Event_UpdateRound", () => this.onEvent_UpdateRound(), this)
        GameRules.EventManager.Register("Event_PlayerDie", () => this.onEvent_PlayerDie(), this, 10000)

        // TODO: 获取补给品
    }

    onEvent_UpdateRound() {

    }

    onEvent_PlayerDie() {

    }
}