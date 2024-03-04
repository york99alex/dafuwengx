import { GAME_MODE, GAME_MODE_ALLPATH, SUPPLY_ALL_ROUND, SUPPLY_ROUND, TIME_SUPPLY_OPRT, TIME_SUPPLY_READY } from '../constants/constant';
import { GS_Supply, TypeOprt } from '../constants/gamemessage';
import { KeyValues } from '../kv';
import { Player } from '../player/player';
import { AMHC, AMHC_MSG, IsValid } from '../utils/amhc';
import { HudError } from './S2Cmode/huderror';

/**补给模块 */
export class Supply {
    /**按价格分段的物品 */
    m_tItems: Record<number, any[]> = {};
    /**上次轮抽首位玩家ID */
    m_nFirstID: number;
    /**记录轮抽后的首位操作玩家 */
    m_nGMOrder: PlayerID;

    init() {
        GameRules.EventManager.Register(
            'Event_UpdateRound',
            (event: { isBegin: boolean; nRound: number }) => this.onEvent_UpdateRound(event),
            this,
            10000
        );
        GameRules.EventManager.Register('Event_PlayerDie', (event: { player: Player }) => this.onEvent_PlayerDie(event), this, 10000);

        // 获取补给品
        for (const itemName in KeyValues.ItemsKV) {
            const itemInfo = KeyValues.ItemsKV[itemName];
            if (itemInfo.IsSupply && itemInfo.IsSupply > 0) {
                itemInfo.name = itemName;
                const nLevel = tonumber(itemInfo.IsSupply);
                if (!this.m_tItems[nLevel]) this.m_tItems[nLevel] = [];
                this.m_tItems[nLevel].push(itemInfo);
            }
        }
    }

    /**轮数更新 */
    onEvent_UpdateRound(event: { isBegin: boolean; nRound: number }) {
        if (this.checkRound(GameRules.GameConfig.m_nRound + 1)) {
            CustomGameEventManager.Send_ServerToAllClients('S2C_round_tip', { sTip: 'supply' });
        }
        if (!this.checkRound(GameRules.GameConfig.m_nRound)) return;
        CustomGameEventManager.Send_ServerToAllClients('S2C_round_tip', { sTip: 'false' });

        const tData: {
            tabSupplyInfo: any[];
            tabPlayerID: PlayerID[];
            nPlayerIDOprt: PlayerID;
        } = {
            tabSupplyInfo: [],
            tabPlayerID: this.getOrders(),
            nPlayerIDOprt: -1,
        };
        this.setSupplyList(tData);
        if (tData.tabSupplyInfo.length > 0) {
            event.isBegin = false;

            // 设置数据到网表
            print('supply data:====================');
            DeepPrintTable(tData);
            CustomNetTables.SetTableValue('GamingTable', 'supply', tData);

            // 设置游戏状态和操作时间
            GameRules.GameLoop.GameStateService.send('tosupply');
            GameRules.GameConfig.m_timeOprt = TIME_SUPPLY_READY;
            this.m_nGMOrder = GameRules.GameConfig.m_nOrderID;
            GameRules.GameConfig.setOrder(-1);
        }
    }

    /**玩家死亡，自动处理操作 */
    onEvent_PlayerDie(event: { player: Player }) {
        if (GameRules.GameConfig.m_typeState != GS_Supply) return;

        const tData = CustomNetTables.GetTableValue('GamingTable', 'supply');
        if (!tData) {
            this.setEnd();
            return;
        }

        // 轮抽后的起始回合玩家死亡，替换为
        if (this.m_nGMOrder == event.player.m_nPlayerID) {
            this.m_nGMOrder = GameRules.GameConfig.getNextValidOrder(this.m_nGMOrder);
        }

        // 玩家操作时死亡，自动处理
        if (tData.nPlayerIDOprt == event.player.m_nPlayerID) {
            GameRules.GameConfig.checkOprt({ nPlayerID: tData.nPlayerIDOprt, typeOprt: TypeOprt.TO_Supply }, true);
            // TODO:
        }
    }

    /**是否补给回合 */
    checkRound(nRound: number) {
        if (nRound >= SUPPLY_ALL_ROUND) {
            if (nRound % 5 == 0) return true;
        } else {
            if (SUPPLY_ROUND.indexOf(nRound) > -1) return true;
        }
        return false;
    }

    /**获取轮抽顺序 */
    getOrders(): PlayerID[] {
        if (GameRules.GameConfig.m_nRound == 1) {
            return [...GameRules.HeroSelection.m_PlayersSort].reverse();
        } else {
            const orders: PlayerID[] = [];
            for (const player of GameRules.PlayerManager.m_tabPlayers) {
                if (GameRules.PlayerManager.isAlivePlayer(player.m_nPlayerID)) {
                    orders.push(player.m_nPlayerID);
                }
            }
            return orders.sort((a, b) => {
                const aPlayer = GameRules.PlayerManager.getPlayer(a);
                const bPlayer = GameRules.PlayerManager.getPlayer(b);
                return aPlayer.m_nSumGold - bPlayer.m_nSumGold;
            });
        }
    }

    /**设置参与补给品 */
    setSupplyList(tData: { tabSupplyInfo: any[]; tabPlayerID: PlayerID[]; nPlayerIDOprt: number }) {
        const nSupplyCount = GameRules.PlayerManager.getAlivePlayerCount() + 1;
        if (nSupplyCount <= 0) return;

        const tResult: {
            type: string;
            itemName?: string;
            pathID?: number;
        }[] = [];

        // 补给无主领地
        const tNoOwnerPaths = GameRules.PathManager.getNoOwnerPaths();
        print('===setSupplyList getPathCountAvg:', GameRules.PathManager.getPathCountAvg());

        if (tNoOwnerPaths && tNoOwnerPaths.length > 0) {
            if (GameRules.GameConfig.m_nRound >= SUPPLY_ALL_ROUND) {
                const supplyPathCount = RandomInt(1, math.min(nSupplyCount, tNoOwnerPaths.length));
                for (let i = 1; i <= supplyPathCount; i++) {
                    const index = RandomInt(0, tNoOwnerPaths.length - 1);
                    tResult.push({ type: 'path', pathID: tNoOwnerPaths[index].m_nID });
                    tNoOwnerPaths.splice(index, 1);
                }
            } else {
                // getOrders返回的第一名玩家（最后出发或者经济最低）
                const player = GameRules.PlayerManager.getPlayer(tData.tabPlayerID[0]);
                if (
                    player &&
                    GameRules.GameConfig.m_nRound > 1 && // 非开局
                    !player.m_bDisconnect && // 未断线
                    (GAME_MODE != GAME_MODE_ALLPATH || player.m_tabBz.length == 0) // 没兵
                ) {
                    const nHasPath = player.getMyPathCount();
                    if (nHasPath < math.ceil(GameRules.PathManager.getPathCountAvg())) {
                        tResult.push({ type: 'path', pathID: tNoOwnerPaths[RandomInt(0, tNoOwnerPaths.length - 1)].m_nID });
                    }
                }
            }
        }

        // 补给物品
        /**
         * nLuck: 每次补给随机两个装备统一价的一个
         * 开局和第5回合	1级 随机统一价500或1000	24件随
         * 10回合	2级 随机统一价1000或1500	24件随
         * 15回合	3级 随机统一价1500或2000	18件随
         * 20回合	4级 随机统一价2000或2500	13件随
         * 25回合	5级 随机统一价2500或3000	18件随
         * 30回合及以上 6级 统一价3000
         *
         * 例如5回合，对应500或1000，随机1则为1000对应kv.IsSupply = 1000/500 = 2
         */
        const nLuck = RandomInt(0, 1);
        let nLevel: number;
        if (GameRules.GameConfig.m_nRound == 1) {
            nLevel = 1 + nLuck;
        } else if (GameRules.GameConfig.m_nRound >= SUPPLY_ALL_ROUND) {
            nLevel = 6;
        } else {
            nLevel = SUPPLY_ROUND.indexOf(GameRules.GameConfig.m_nRound) + nLuck;
        }
        const itemCount = nSupplyCount - tResult.length;
        print('===setSupplyList nLevel:', nLevel, ' itemCount:', itemCount);
        if (itemCount > 0) {
            const tItems = this.m_tItems[nLevel];
            if (tItems) {
                for (let i = 0; i < itemCount; i++) {
                    const index = RandomInt(0, tItems.length - 1);
                    tResult.push({ type: 'item', itemName: tItems[index].name });
                }
            }
        }
        tData.tabSupplyInfo = tResult;
    }

    /**操作时间结束 */
    onTimeOver() {
        const tData = CustomNetTables.GetTableValue('GamingTable', 'supply');
        if (!tData) {
            this.setEnd();
        }
        if (tData.nPlayerIDOprt == -1) {
            // 开始操作
            tData.nPlayerIDOprt = tData.tabPlayerID['1'];
            print('===Supply onTimeOver nPlayerIDOprt 1:', tData.tabPlayerID['1']);
            DeepPrintTable(tData);
            if (GameRules.PlayerManager.isAlivePlayer(tData.nPlayerIDOprt)) {
                GameRules.GameConfig.m_timeOprt = TIME_SUPPLY_OPRT;
            } else {
                GameRules.GameConfig.m_timeOprt = 2;
            }
            GameRules.GameConfig.setOrder(tData.nPlayerIDOprt);
            GameRules.GameConfig.sendOprt({
                typeOprt: TypeOprt.TO_Supply,
                nPlayerID: tData.nPlayerIDOprt,
            });
            // 设置网表
            CustomNetTables.SetTableValue('GamingTable', 'supply', {
                nPlayerIDOprt: tData.nPlayerIDOprt,
                tabPlayerID: tData.tabPlayerID,
                tabSupplyInfo: tData.tabSupplyInfo,
            });
        } else {
            // 玩家操作超时，随机选择
            GameRules.GameConfig.checkOprt({ nPlayerID: tData.nPlayerIDOprt, typeOprt: TypeOprt.TO_Supply }, true);
            let tHasSupplyID = [];
            for (const index in tData.tabSupplyInfo) {
                if (!tData.tabSupplyInfo[index].nOwnerID) tHasSupplyID.push(index);
            }
            this.getSupply(tData, tHasSupplyID[RandomInt(1, tHasSupplyID.length)]);
        }
    }

    /**获取补给
     * @param tData tabSupplyInfo
     * @param nDataIndex 补给的索引
     */
    getSupply(tData: any, nDataIndex: number) {
        const supplyInfo = tData.tabSupplyInfo[tostring(nDataIndex)];
        if (!supplyInfo) {
            return;
        }
        // 设置补给主人
        supplyInfo.nOwnerID = tData.nPlayerIDOprt;
        const player = GameRules.PlayerManager.getPlayer(tData.nPlayerIDOprt);

        if (player && !player.m_bDie) {
            // print('===getSupply===tData:', tData, 'index:', nDataIndex, 'index type:', typeof nDataIndex);
            // DeepPrintTable(tData);
            if (supplyInfo.type == 'item') {
                // 添加物品
                if (player.m_eHero.GetNumItemsInInventory() < 9) {
                    // print('===Supply AddItem:', supplyInfo.itemName, 'to hero:', player.m_eHero.GetUnitName());
                    const item = player.m_eHero.AddItemByName(supplyInfo.itemName);
                    if (item) item.SetPurchaseTime(0);
                    player.setSumGold();
                } else {
                    // 满了自动卖掉
                    const nGold = math.floor(GetItemCost(supplyInfo.itemName) * 0.5);
                    GameRules.GameConfig.showGold(player, nGold);
                    player.setGold(nGold);
                    EmitSoundOnClient('Custom.Gold.Sell', PlayerResource.GetPlayer(player.m_nPlayerID));
                    AMHC.CreateNumberEffect(player.m_eHero, nGold, 3, AMHC_MSG.MSG_MISS, [255, 215, 0], 0);
                }
            } else if (supplyInfo.type == 'path') {
                // 添加领地
                const path = GameRules.PathManager.getPathByID(tonumber(supplyInfo.pathID));
                if (path) player.setMyPathAdd(path);
            }
        }

        // 设置下一个玩家操作，或者结束
        const tPlayerID: number[] = [];
        let oPrtIndex: number;
        for (const index in tData.tabPlayerID) {
            tPlayerID[tonumber(index) - 1] = tData.tabPlayerID[index];
            if (tData.tabPlayerID[index] == tData.nPlayerIDOprt) oPrtIndex = tonumber(index) - 1;
        }
        print('===Supply tPlayerID:', tPlayerID);
        if (tPlayerID.length - 1 == oPrtIndex) {
            // 结束
            this.setEnd(tData);
        } else {
            tData.nPlayerIDOprt = tPlayerID[oPrtIndex + 1];
            if (GameRules.PlayerManager.isAlivePlayer(tData.nPlayerIDOprt)) {
                GameRules.GameConfig.m_timeOprt = TIME_SUPPLY_OPRT;
            } else {
                GameRules.GameConfig.m_timeOprt = 2;
            }
            GameRules.GameConfig.setOrder(tData.nPlayerIDOprt);
            GameRules.GameConfig.sendOprt({
                typeOprt: TypeOprt.TO_Supply,
                nPlayerID: tData.nPlayerIDOprt,
            });
            CustomNetTables.SetTableValue('GamingTable', 'supply', tData);
        }
    }

    /**处理操作 */
    processOprt(tOprt: { nRequest: number; typeOprt: number; nPlayerID: number }) {
        print('===Supply processOprt');
        DeepPrintTable(tOprt);
        /**
         * {
                nRequest                        	= 1 (number)
                typeOprt                        	= 8 (number)
                PlayerID                        	= 1 (number)
                nPlayerID                       	= 1 (number)
            }
         */
        if (!tOprt.nRequest) return;

        const tData = CustomNetTables.GetTableValue('GamingTable', 'supply');

        // 验证操作
        tOprt.nRequest = (() => {
            if (!tData || tData.nPlayerIDOprt != tOprt.nPlayerID) return -1; // 数据错误
            if (!tData.tabSupplyInfo[tostring(tOprt.nRequest)]) return -2;
            if (tData.tabSupplyInfo[tostring(tOprt.nRequest)].nOwnerID) return -3; // 被其他玩家选择
            if (tData.tabSupplyInfo[tostring(tOprt.nRequest)].type == 'item') {
                const player = GameRules.PlayerManager.getPlayer(tData.nPlayerIDOprt);
                print('===Supply items:', player.m_eHero.GetNumItemsInInventory());
                if (player.m_eHero.GetNumItemsInInventory() >= 9) {
                    // 背包已满
                    HudError.FireLocalizeError(tOprt.nPlayerID, 'Error_ItemMax');
                    return -4;
                }
            }
            return tOprt.nRequest;
        })();

        // 回包
        GameRules.PlayerManager.sendMsg('GM_OperatorFinished', tOprt, tOprt.nPlayerID);

        if (tOprt.nRequest > 0) {
            // 成功
            GameRules.GameConfig.checkOprt(tOprt, true);
            this.getSupply(tData, tOprt.nRequest);
        }
    }

    /**结束补给阶段 */
    setEnd(tData?: any) {
        print('===Supply setEnd===');
        tData = tData || CustomNetTables.GetTableValue('GamingTable', 'supply');
        if (tData) {
            // 结束，2秒后清空补给阶段数据
            tData.nPlayerIDOprt = -2;
            CustomNetTables.SetTableValue('GamingTable', 'supply', tData);
            Timers.CreateTimer(2, () => {
                CustomNetTables.SetTableValue('GamingTable', 'supply', null);
            });
        }

        // 重新进入begin
        GameRules.GameConfig.setOrder(this.m_nGMOrder);
        this.m_nGMOrder = null;

        if (GameRules.GameConfig.m_timeTemp >= 0) {
            GameRules.GameLoop.GameStateService.send('towaitoprt');
            GameRules.GameConfig.m_timeOprt = GameRules.GameConfig.m_timeTemp;
            GameRules.GameConfig.m_timeTemp = -1;
        } else {
            GameRules.GameLoop.m_bRoundBefore = false;
            GameRules.GameLoop.GameStateService.send('toRoundBefore');
        }
    }
}
