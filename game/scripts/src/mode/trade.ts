import { GAME_MODE, GAME_MODE_ALLPATH, TypePathState } from './constant';
import { PS_Trading, TypeOprt } from './gamemessage';

/**交易模块 */
export class Trade {
    /**等待交易数据 */
    tabWaitTrade: {
        nPIDTrade: number;
        nPIDTradeBe: number;
        tabDataTrade: {
            PlayerID: number;
            nPlayerID: number;
            nPlayerIDTrade: number;
            nPlayerIDTradeBe: number;
            typeOprt: number;
            json: any;
        };
        tabDataTradeBe: { nPlayerID: number; nPlayerIDTrade: number; nPlayerIDTradeBe: number; typeOprt: number; json: any };
    }[];

    /**交易事件 */
    static EvtID = {
        Event_TO_TRADE: 'Event_TO_TRADE',
        Event_TO_TRADE_BE: 'Event_TO_TRADE_BE',
    };

    init() {
        this.tabWaitTrade = [];
        this.SetNetTableValue();
        GameRules.EventManager.Register(Trade.EvtID.Event_TO_TRADE, (data: any) => this.ProcessTrade(data));
        GameRules.EventManager.Register(Trade.EvtID.Event_TO_TRADE_BE, (data: any) => this.ProcessTradeBe(data));
    }

    SetNetTableValue() {
        PrintSendData('SetNetTableValue', this.tabWaitTrade);
        CustomNetTables.SetTableValue('GamingTable', 'trade', { tabWaitTrade: this.tabWaitTrade });
    }

    /**处理发起交易 */
    ProcessTrade(data: { PlayerID: number; nPlayerID: number; nPlayerIDTrade: number; nPlayerIDTradeBe: number; typeOprt: number; json: any }) {
        // if (GameRules.GameConfig.m_bNoSwap == 1) return;

        print('===ProcessTrade===Receive Data:');
        DeepPrintTable(data);

        const tradePlayer = GameRules.PlayerManager.getPlayer(data.nPlayerIDTrade);
        const tradeBePlayer = GameRules.PlayerManager.getPlayer(data.nPlayerIDTradeBe);
        if (!tradePlayer || !tradeBePlayer) return;

        let nRequest: number = 1;
        if (!GameRules.PlayerManager.isAlivePlayer(data.nPlayerID) || !GameRules.PlayerManager.isAlivePlayer(data.nPlayerIDTrade)) {
            // 有交易一方死亡
            nRequest = 11;
        } else if (tradeBePlayer.isPlayerMuteTrade(data.nPlayerID)) {
            // 对方屏蔽你的交易
            nRequest = 10;
        } else if (data.PlayerID != data.nPlayerID || !GameRules.PlayerManager.isAlivePlayer(data.PlayerID)) {
            // 操作玩家不是发起交易玩家
            nRequest = 9;
        } else if (0 < bit.band(tradePlayer.m_nPlayerState, PS_Trading) || 0 < bit.band(tradeBePlayer.m_nPlayerState, PS_Trading)) {
            // 玩家正在交易中
            nRequest = 8;
        } else {
            nRequest = this.CheckTradeData(data.nPlayerID, data.nPlayerIDTradeBe, data.json, nRequest, TypePathState.None);
        }

        data['nRequest'] = nRequest;
        if (nRequest == 1) {
            this.SetAuctionPathState(data.json, TypePathState.Trade);

            // 发送被交易操作给被交易玩家
            const tabOprt = {
                nPlayerID: data.nPlayerIDTradeBe,
                nPlayerIDTrade: data.nPlayerIDTrade,
                nPlayerIDTradeBe: data.nPlayerIDTradeBe,
                typeOprt: TypeOprt.TO_TRADE_BE,
                json: data.json,
            };
            PrintSendData('GM_Operator', data);
            GameRules.PlayerManager.sendMsg('GM_Operator', tabOprt, tabOprt.nPlayerID);

            // 保存数据并同步网表
            const tradeData = {
                nPIDTrade: data.nPlayerIDTrade,
                nPIDTradeBe: data.nPlayerIDTradeBe,
                tabDataTrade: data,
                tabDataTradeBe: tabOprt,
            };
            this.tabWaitTrade.push(tradeData);
            this.SetNetTableValue();

            // 设置双方为交易中
            tradePlayer.setPlayerState(PS_Trading);
            tradeBePlayer.setPlayerState(PS_Trading);
            tradePlayer.setNetTableInfo();
            tradeBePlayer.setNetTableInfo();
        }
        print('Trade request ===================' + data['nRequest']);
        // 回包
        PrintSendData('GM_OperatorFinished', data);
        GameRules.PlayerManager.sendMsg('GM_OperatorFinished', data, data.nPlayerID);
    }

    /**处理被交易
     * event:{
            nPlayerID: 被交易方,
            nPlayerIDTrade: 发起交易方,
            nPlayerIDTradeBe: 被交易方,
            typeOprt: TypeOprt.TO_TRADE_BE,
            nRequest: 1
            json: data.json,
        };
     */
    ProcessTradeBe(data: any) {
        const tabData = this.tabWaitTrade.find(v => {
            const oprt = v.tabDataTradeBe;
            return (
                data.typeOprt == oprt.typeOprt && (data.PlayerID == oprt.nPlayerID || (data.PlayerID == oprt.nPlayerIDTrade && 0 == data.nRequest))
            );
        });
        if (!tabData) {
            print('ProcessTradeBe data oprt is null !!!!');
            return;
        }

        const tabOprt = tabData.tabDataTradeBe;
        tabOprt['nRequest'] = data.nRequest;

        const tradeBePlayer = GameRules.PlayerManager.getPlayer(tabOprt.nPlayerID);
        const tradePlayer = GameRules.PlayerManager.getPlayer(tabOprt.nPlayerIDTrade);
        const tradeData = tabOprt.json;
        if (!tradeBePlayer || !tradePlayer || !tradeData) return;
        if (
            data.PlayerID != data.nPlayerID ||
            !GameRules.PlayerManager.isAlivePlayer(tabOprt.nPlayerID) ||
            !GameRules.PlayerManager.isAlivePlayer(tabOprt.nPlayerIDTrade)
        ) {
            // 操作玩家不是发起交易玩家，交易方有死亡
            tabOprt['nRequest'] = 9;
        } else {
            tabOprt['nRequest'] = this.CheckTradeData(tabOprt.nPlayerIDTrade, tabOprt.nPlayerID, tradeData, data.nRequest, TypePathState.Trade);
        }
        print('tabOprt.nRequest=' + tabOprt['nRequest']);
        // 交换交易品
        if (tabOprt['nRequest'] == 1) {
            const tabPath = [];
            print('===ProcessTradeBe===');
            DeepPrintTable(tradeData);
            /**
             * {
                    nPlayerID                       	= 1 (number)
                    PlayerID                        	= 1 (number)
                    nPlayerIDTrade                  	= 0 (number)
                    nPlayerIDTradeBe                	= 1 (number)
                    typeOprt                        	= 1006 (number) TO_TRADE_BE
                    nRequest                        	= 1 (number)
                    json                            	= table: 0x004e9f58 (table)
                    {
                        trade                           	= table: 0x004e9fa0 (table)
                        {
                            arrPath                         	= table: 0x004e9fe8 (table)
                            {
                            }
                            nGold                           	= 1622 (number)
                        }
                    }
                }
            */
            if (tradeData.trade) {
                const nGold = tradeData.trade.nGold;
                if (nGold) {
                    // 交换金钱
                    tradePlayer.setGold(-nGold);
                    GameRules.GameConfig.showGold(tradePlayer, -nGold);
                    tradeBePlayer.setGold(nGold);
                    GameRules.GameConfig.showGold(tradeBePlayer, nGold);
                }
                const arrPath = tradeData.trade.arrPath;
                if (arrPath && arrPath.length > 0) {
                    const tabPath = [];
                    for (const pathID of arrPath) {
                        // 按路径类型重新索引
                        const path = GameRules.PathManager.getPathByID(pathID);
                        if (!tabPath[path.m_typePath]) {
                            tabPath[path.m_typePath] = [];
                        }
                        tabPath[path.m_typePath].push(path);
                    }
                    for (const tab of tabPath) {
                        tradePlayer.setMyPathsGive(tab, tradeBePlayer);
                    }
                }

                // 广播全部玩家
                PrintSendData('SendAll_GM_OperatorFinished', tabOprt);
                GameRules.PlayerManager.broadcastMsg('GM_OperatorFinished', tabOprt);
                // TODO: 设置游戏记录
            }
        } else if (tabOprt['nRequest'] == 0) {
            // 拒绝交易,通知交易双方
            tradePlayer.sendMsg('GM_OperatorFinished', tabOprt);
            tradeBePlayer.sendMsg('GM_OperatorFinished', tabOprt);
        } else if (tabOprt['nRequest'] == 7) {
            // 操作错误
            tradePlayer.sendMsg('GM_OperatorFinished', tabOprt);
            return;
        } else {
            // 其他情况
            tradePlayer.sendMsg('GM_OperatorFinished', tabOprt);
            tradeBePlayer.sendMsg('GM_OperatorFinished', tabOprt);
        }

        // 玩家交易状态解除
        tradePlayer.setPlayerState(-PS_Trading);
        tradeBePlayer.setPlayerState(-PS_Trading);

        this.SetAuctionPathState(tradeData, TypePathState.None);
        // 移除操作
        this.tabWaitTrade.splice(this.tabWaitTrade.indexOf(tabData), 1);
        this.SetNetTableValue();
    }

    /**检查数据 */
    CheckTradeData(tradeID: number, tradeBeID: number, tradeData: any, nRequest: number, pathState: TypePathState): number {
        if (nRequest == 1) {
            // 交易，验证
            if (!tradeData) return -1;
            if (tradeData.trade) {
                const tab = tradeData.trade;
                const tradePlayer = GameRules.PlayerManager.getPlayer(tradeID);
                if (!tradePlayer) return 2;
                if ((tab.nGold > 0 && tradePlayer.GetGold() < tab.nGold) || tab.nGold < 0) return 3;

                const arrPath = tab.arrPath;
                if (arrPath && arrPath.length > 0) {
                    const hasBZPaths = [];
                    for (const pathID of arrPath) {
                        if (!tradePlayer.isHasPath(pathID)) return 5; // 包含未拥有路径
                        const path = GameRules.PathManager.getPathByID(pathID);
                        if (path.m_typeState != pathState) return 101; // 领地暂不可交易
                        if (path['m_tabENPC'] && path['m_tabENPC'].length > 0) {
                            if (path['m_nPlayerIDGCLD']) return 7; // 包含攻城中的地
                            if (!hasBZPaths[path.m_typePath]) hasBZPaths[path.m_typePath] = [];
                            hasBZPaths[path.m_typePath].push(path);
                        }
                    }
                    if (GAME_MODE == GAME_MODE_ALLPATH) {
                        // TODO: 检查连地
                    }
                }
            }
        }
        return nRequest;
    }

    /**设置路径交易类型 */
    SetAuctionPathState(data: any, pathState: TypePathState) {
        for (const player in data) {
            let tradeData = data[player];
            let arrPath = tradeData['arrPath'];
            for (const pathID of arrPath) {
                let path = GameRules.PathManager.getPathByID(pathID);
                path.setPathState(pathState);
            }
        }
    }
}

export function PrintSendData(title, data) {
    print('===============================================');
    print('8Trade->', title);
    DeepPrintTable(data);
    print('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
}
