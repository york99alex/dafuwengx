import { PS_None } from '../constants/gamemessage';
import { Path } from '../path/Path';
import { ParaAdjuster } from '../utils/paraadjuster';
import { Player } from './player';

export class PlayerManager {
    m_bAllPlayerInit: boolean = false; // 全部玩家初始化完成
    m_tabPlayers: Player[] = [null, null, null, null, null, null]; // 全部玩家数据
    nInit: number; // 初始化人数

    init() {
        if (IsServer()) {
            // 玩家断线
            ListenToGameEvent('player_disconnect', event => this.onEvent_playerDisconnect(event), this);
        }
        // 玩家连接
        ListenToGameEvent('player_connect_full', event => this.onEvent_playerConnectFull(event), this);
        // 选择英雄
        ListenToGameEvent('dota_player_pick_hero', event => this.onEvent_playerPickHero(event), this);
        // 玩家英雄的生成
        ListenToGameEvent('npc_spawned', event => this.onEvent_NPCSpawned(event), this);
        // 单位受伤
        ListenToGameEvent('entity_hurt', event => this.onEvent_entityHurt(event), this);
        // 玩家使用技能
        ListenToGameEvent('dota_player_used_ability', event => this.onEvent_dota_player_used_ability(event), this);
        // 玩家聊天
        ListenToGameEvent('player_chat', event => this.onEvent_player_chat(event), this);
        // 玩家英雄升级
        // ListenToGameEvent('dota_player_gained_level', event => this.onEvent_dota_player_gained_level(event), this);
    }

    // 玩家断线
    onEvent_playerDisconnect(event: GameEventProvidedProperties & PlayerDisconnectEvent) {
        print('onEvent_playerDisconnect');
        DeepPrintTable(event);
        if (event.PlayerID < 0) {
            return;
        }
        let player = GameRules.PlayerManager.getPlayer(event.PlayerID);
        if (player == null) {
            player = new Player(event.PlayerID);
            this.m_tabPlayers[event.PlayerID] = player;
        }
        // 掉线随机英雄
        if (
            PlayerResource.GetSelectedHeroID(event.PlayerID) == -1 &&
            PlayerResource.GetPlayer(player.m_nPlayerID) != null &&
            GameRules.State_Get() == GameState.HERO_SELECTION
        ) {
            print('PlayerID:', event.PlayerID, 'MakeRandomHeroSelection');
            PlayerResource.GetPlayer(player.m_nPlayerID).MakeRandomHeroSelection();
            GameRules.HeroSelection.m_SelectHeroPlayerID.push(player.m_nPlayerID);
        }

        player.setDisconnect(true);

        // 轮询是否放弃比赛 和 掉线超时检测
        // TODO:
    }

    // 玩家连接
    onEvent_playerConnectFull(event: GameEventProvidedProperties & PlayerConnectFullEvent) {
        print('===onEvent_playerConnectFull:');
        DeepPrintTable(event);
        if (event.userid < 0) return;
        let oPlayer = GameRules.PlayerManager.getPlayer(event.PlayerID);
        if (oPlayer == null) {
            oPlayer = new Player(event.PlayerID);
            this.m_tabPlayers[event.PlayerID] = oPlayer;
        } else {
            // 断线重连
            oPlayer.setDisconnect(false);
            // 重新发送手牌
            oPlayer.sendHandCardData();
            // 重新发操作
            for (let i = 0; i < GameRules.GameConfig.m_tabOprtCan.length; i++) {
                const tabOprt = GameRules.GameConfig.m_tabOprtCan[i];
                if (tabOprt.nPlayerID == event.PlayerID) {
                    print('9[LUA]:ReconnectSend===========>>>>>>>>>>>>>>>');
                    DeepPrintTable(tabOprt);
                    this.sendMsg('GM_Operator', tabOprt, event.PlayerID);
                }
            }
        }
        oPlayer.m_nUserID = event.userid;
    }

    // 选择英雄
    onEvent_playerPickHero(event: GameEventProvidedProperties & DotaPlayerPickHeroEvent): void {
        if (GameRules.GameConfig.m_typeState == PS_None) {
            print('onEvent_playerPickHero');
            DeepPrintTable(event);
            const eHero = EntIndexToHScript(event.heroindex as EntityIndex) as CDOTA_BaseNPC_Hero;
            if (event.player > 1) {
                this.m_tabPlayers[eHero.GetPlayerID()] = new Player(eHero.GetPlayerID());
            }
            const oPlayer = this.m_tabPlayers[eHero.GetPlayerOwnerID()];
            GameRules.HeroSelection.m_SelectHeroPlayerID.push(eHero.GetPlayerOwnerID());
            if (GameRules.State_Get() != GameState.HERO_SELECTION) {
                GameRules.HeroSelection.GiveAllPlayersSort();
            }
            print('oPlayer:', oPlayer);
            print('oPlayer.__init:', oPlayer.__init);
            if (oPlayer != null && !oPlayer.__init) {
                oPlayer.m_eHero = eHero;
                oPlayer.initPlayer();
                if (this.nInit == null) this.nInit = 0;
                this.nInit++;
                if (this.nInit == this.getPlayerCount()) {
                    this.nInit == null;
                    this.m_bAllPlayerInit = true;
                }
            }
            GameRules.EventManager.FireEvent('dota_player_pick_hero', { eHero: eHero });
        }
    }

    // 玩家英雄的生成
    onEvent_NPCSpawned(event: GameEventProvidedProperties & NpcSpawnedEvent): void {}

    // 单位受伤
    onEvent_entityHurt(event: GameEventProvidedProperties & EntityHurtEvent): void {}

    // 玩家使用技能
    onEvent_dota_player_used_ability(event: GameEventProvidedProperties & DotaPlayerUsedAbilityEvent): void {
        print('onEvent_dota_player_used_ability');
        DeepPrintTable(event);
        if (event.abilityname == 'item_power_treads') {
            const player = GameRules.PlayerManager.getPlayer(event.PlayerID);
            const mana = player.m_eHero.GetMana();
            Timers.CreateTimer(0.01, () => {
                ParaAdjuster.ModifyMana(player.m_eHero);
                player.m_eHero.SetMana(mana);
            });
        }
        GameRules.EventManager.FireEvent('dota_player_used_ability', event);
    }

    // 玩家聊天
    onEvent_player_chat(event: GameEventProvidedProperties & PlayerChatEvent): void {}

    // 玩家英雄升级
    // onEvent_dota_player_gained_level(event: GameEventProvidedProperties & DotaPlayerGainedLevelEvent): void {
    // }

    /**
     * getPlayer
    nPlayerID:numbber     */
    getPlayer(nPlayerID: number): Player {
        return this.m_tabPlayers[nPlayerID];
    }

    /**
     * 获取玩家对象
     * @param steamid64 string
     * @returns Player
     */
    getPlayerBySteamID64(steamid64: string): Player {
        for (const player of this.m_tabPlayers) {
            if (steamid64 == tostring(PlayerResource.GetSteamID(player.m_nPlayerID))) return player;
        }
    }

    /**
     * 通过英雄名获取玩家对象
     * @param heroName
     */
    getPlayerByHeroName(heroName: string): Player {
        for (const player of this.m_tabPlayers) {
            if (heroName == player.m_eHero.GetUnitName()) return player;
        }
    }

    getPlayerCount() {
        return this.m_tabPlayers.length;
    }

    /**发送事件消息给某玩家 */
    sendMsg(strMgsID: string, tabData, nPlayerID: number) {
        const oPlayer = GameRules.PlayerManager.getPlayer(nPlayerID);
        if (oPlayer) {
            oPlayer.sendMsg(strMgsID, tabData);
        } else {
            print('===error: sendMsg===未找到玩家:', nPlayerID);
        }
    }

    /**广播事件消息 */
    broadcastMsg(strMgsID: string, tabData) {
        print('=====broadcastMsg=====tabData:');
        DeepPrintTable(tabData);
        print('==============================');
        switch (strMgsID) {
            case 'GM_Operator':
                CustomGameEventManager.Send_ServerToAllClients('GM_Operator', tabData);
                break;
            case 'GM_OperatorFinished':
                CustomGameEventManager.Send_ServerToAllClients('GM_OperatorFinished', tabData);
                break;
            case 'S2C_GM_HUDErrorMessage':
                CustomGameEventManager.Send_ServerToAllClients('S2C_GM_HUDErrorMessage', tabData);
                break;
            case 'GM_CameraCtrl':
                CustomGameEventManager.Send_ServerToAllClients('GM_CameraCtrl', tabData);
                break;
            default:
                print('====playermanager.broadcastMsg=====!!!未匹配消息:', strMgsID, '!!!=========');
                break;
        }
    }

    // /**广播请求操作事件消息 */
    // broadcastOperatorMsg(strMgsID: "S2C_GM_Operator", tabData: { nPlayerID: number; typeOprt: number; }) {
    //     // CustomGameEventManager.Send_ServerToAllClients(strMgsID, tabData)
    // }

    // /**广播请求操作结果事件消息 */
    // broadcastOperatorFinishedMsg(strMgsID: "S2C_GM_OperatorFinished", tabData: { nNum1: number; nNum2: number; }) {
    //     CustomGameEventManager.Send_ServerToAllClients(strMgsID, tabData)
    // }

    // /**广播通知错误信息 */
    // broadcastErrorMessage(data: {
    //     type: number,
    //     message: string
    // }) {
    //     CustomGameEventManager.Send_ServerToAllClients("S2C_GM_HUDErrorMessage", data)
    // }

    /**获取存活玩家数量 */
    getAlivePlayerCount() {
        let nCount = 0;
        for (const player of this.m_tabPlayers) {
            if (GameRules.PlayerManager.isAlivePlayer(player.m_nPlayerID)) {
                nCount++;
            }
        }
        return nCount;
    }

    /**获取存活玩家数量 */
    getAlivePlayers() {
        const players = [];
        for (const player of this.m_tabPlayers) {
            if (GameRules.PlayerManager.isAlivePlayer(player.m_nPlayerID)) {
                print('===alive playerID:', player.m_nPlayerID);
                players.push(player);
            }
        }
        if (players.length == 0) return null;
        return players;
    }

    /**找到距离我最近路径的玩家 */
    findClosePlayer(oPlayer: Player, funFilter: Function, nOffset: number): Player {
        let pathCur = oPlayer.m_pathCur;
        if (nOffset) {
            pathCur = GameRules.PathManager.getNextPath(pathCur, nOffset);
        }

        let oReturn: Player = null;
        let nMin = -1;
        for (const player of this.m_tabPlayers) {
            const nDis = GameRules.PathManager.getPathDistance(pathCur, player.m_pathCur);
            if (nDis < nMin || nMin == -1) {
                if (funFilter(player)) {
                    nMin = nDis;
                    oReturn = player;
                }
            }
        }
        return oReturn;
    }

    /**找到目标领地范围格数内的玩家 */
    findRangePlayer(tabPlayer: Player[], pathTarger: Path, nRange?: number, nOffset?: number, funFilter?: Function): void {
        if (!funFilter) {
            funFilter = () => {
                return true;
            };
        }

        nOffset = nOffset || 0;
        nRange = nRange || 1;
        if (nRange > GameRules.PathManager.m_tabPaths.length) {
            nRange = GameRules.PathManager.m_tabPaths.length;
        }

        const nBeginID = pathTarger.m_nID - math.floor((nRange - 1) * 0.5) + nOffset;
        for (let i = nBeginID + nRange - 1; i >= nBeginID; i--) {
            let nID = i;
            if (nID > GameRules.PathManager.m_tabPaths.length) {
                nID %= GameRules.PathManager.m_tabPaths.length;
            } else if (nID <= 0) {
                nID += GameRules.PathManager.m_tabPaths.length;
            }

            for (const v of this.m_tabPlayers) {
                if (nID == v.m_pathCur.m_nID && funFilter(v)) {
                    tabPlayer.push(v);
                }
            }
        }
    }

    /**找到随机N个玩家 */
    findRandomPlayer(nCount: number, funFilter: Function): Player[] {
        nCount ?? 1;
        if (!funFilter) {
            funFilter = () => {
                return true;
            };
        }

        const tabPlayer: Player[] = [];
        for (const player of this.m_tabPlayers) {
            tabPlayer.push(player);
        }
        for (let i = tabPlayer.length; i > 0; i--) {
            if (!funFilter(tabPlayer[i])) {
                tabPlayer.splice(i, 1);
            }
        }
        while (tabPlayer.length > nCount) {
            tabPlayer.splice(RandomInt(1, tabPlayer.length), 1);
        }
        return tabPlayer;
    }

    /**玩家是否存活 */
    isAlivePlayer(nPlayerID: number): boolean {
        const player = this.getPlayer(nPlayerID);
        return player && !player.m_bDie;
    }

    /**是否是领地最少的玩家 */
    isLeastPathPlayer(playerid: number): boolean {
        const leastPlayers = this.getLeastPathPlayer();
        return leastPlayers.some(player => player.m_nPlayerID === playerid);
    }

    /**是否领地最多的玩家 */
    isMostPathPlayer(playerid: number): boolean {
        const mostPlayers = this.getMostPathPlayer();
        return mostPlayers.some(player => player.m_nPlayerID === playerid);
    }

    /**获取领地最多的玩家的领地数量 */
    getMostPathCount(): number {
        let max = 0;
        for (const player of this.m_tabPlayers) {
            if (this.isAlivePlayer(player.m_nPlayerID)) {
                const sum = player.getPathCount();
                if (sum > max) {
                    max = sum;
                }
            }
        }
        return max;
    }

    /**获取领地最多的玩家 */
    getMostPathPlayer(): Player[] {
        const max = this.getMostPathCount();
        const resPlayers: Player[] = [];
        for (const player of this.m_tabPlayers) {
            if (this.isAlivePlayer(player.m_nPlayerID)) {
                const sum = player.getPathCount();
                if (sum == max) {
                    resPlayers.push(player);
                }
            }
        }
        return resPlayers;
    }

    /**获取领地最少的玩家的领地数量 */
    getLeastPathCount(): number {
        let min = 0;
        for (const player of this.m_tabPlayers) {
            if (this.isAlivePlayer(player.m_nPlayerID)) {
                const sum = player.getPathCount();
                if (sum < min) {
                    min = sum;
                }
            }
        }
        return min;
    }

    /**获取领地最少的玩家 */
    getLeastPathPlayer(): Player[] {
        const min = this.getLeastPathCount();
        const resPlayers: Player[] = [];
        for (const player of this.m_tabPlayers) {
            if (this.isAlivePlayer(player.m_nPlayerID)) {
                const sum = player.getPathCount();
                if (sum == min) {
                    resPlayers.push(player);
                }
            }
        }
        return resPlayers;
    }
}
