/**交易模块 */
export class Trade {
    /**等待交易数据 */
    tabWaitTrade: {};

    /**交易事件 */
    static EvtID = {
        Event_TO_TRADE: 'Event_TO_TRADE',
        Event_TO_TRADE_BE: 'Event_TO_TRADE_BE',
    };

    init() {
        this.tabWaitTrade = {};
        this.SetNetTableValue();
        GameRules.EventManager.Register(Trade.EvtID.Event_TO_TRADE, (data:any) => this.ProcessTrade(data));
        GameRules.EventManager.Register(Trade.EvtID.Event_TO_TRADE_BE, (data:any) => this.ProcessTradeBe(data));
    }

    SetNetTableValue() {
        this.PrintSendData('SetNetTableValue', this.tabWaitTrade);
        CustomNetTables.SetTableValue('GamingTable', 'trade', { tabWaitTrade: this.tabWaitTrade });
    }

    /**处理发起交易 */
    ProcessTrade(data:any) {
        if(GameRules.GameConfig.m_bNoSwap == 1) return

        data['nPlayerID'] = data.PlayerID
    }

    /**处理被交易 */
    ProcessTradeBe(data:any) {}

    PrintSendData(title, data) {
        print('===============================================');
        print('8Trade->', title);
        print(data);
        print('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
    }
}
