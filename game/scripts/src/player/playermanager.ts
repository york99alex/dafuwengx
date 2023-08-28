import { GameMessage } from "../mode/gamemessage"
import { Player } from "./player"

export class PlayerManager {

    m_bAllPlayerInit: boolean
    m_tabPlayers: Player[]
    nInit: number // 初始化人数
    m_tabChangeGold: number[]
    m_nTimeChangeGold: number

    constructor() {
        this.m_bAllPlayerInit = false, // 全部玩家初始化完成
            this.m_tabPlayers = [] // 全部玩家数据
    }

    init() {
        if (IsServer()) {
            // 玩家断线
            // ListenToGameEvent("player_disconnect", (event) => this.onEvent_playerDisconnect(event), this)
        }
        // 玩家连接
        ListenToGameEvent("player_connect_full", (event) => this.onEvent_playerConnectFull(event), this)
        // 选择英雄
        ListenToGameEvent("dota_player_pick_hero", (event) => this.onEvent_playerPickHero(event), this)
        // 玩家英雄的生成
        ListenToGameEvent("npc_spawned", (event) => this.onEvent_NPCSpawned(event), this)
        // 单位受伤
        ListenToGameEvent("entity_hurt", (event) => this.onEvent_entityHurt(event), this)
        // 玩家使用技能
        ListenToGameEvent("dota_player_used_ability", (event) => this.onEvent_dota_player_used_ability(event), this)
        // 玩家聊天
        ListenToGameEvent("player_chat", (event) => this.onEvent_player_chat(event), this)
    }
    
    // 玩家断线
    onEvent_playerDisconnect(event: GameEventProvidedProperties & PlayerDisconnectEvent) {
        print("onEvent_playerDisconnect")
        DeepPrintTable(event)
        if (event.PlayerID < 0) {
            return
        }
        let player = GameRules.PlayerManager.getPlayer(event.PlayerID)
        if (player == null) {
            player = new Player(event.PlayerID)
            player.m_oCDataPlayer = PlayerResource.GetPlayer(event.PlayerID)
        }
        // 掉线随机英雄
        if (PlayerResource.GetSelectedHeroID(event.PlayerID) == -1 &&
            player.m_oCDataPlayer != null &&
            GameRules.State_Get() == GameState.HERO_SELECTION) {
            print("PlayerID:", event.PlayerID, "MakeRandomHeroSelection")
            GameRules.HeroSelection.SelectHero(event.PlayerID)
        }

        player.setDisconnect(true)
    }

    // 玩家连接
    onEvent_playerConnectFull(event: GameEventProvidedProperties & PlayerConnectFullEvent) {
        print("onEvent_playerConnectFull")
        DeepPrintTable(event)
        if (event.userid < 0) return
        let oPlayer = GameRules.PlayerManager.getPlayer(event.PlayerID)
        if (oPlayer == null) {
            oPlayer = new Player(event.PlayerID)
            this.m_tabPlayers[event.PlayerID] = oPlayer
            oPlayer.m_oCDataPlayer = PlayerResource.GetPlayer(oPlayer.m_nPlayerID)
        } else {
            oPlayer.m_oCDataPlayer = PlayerResource.GetPlayer(oPlayer.m_nPlayerID)
            // 断线重连
            oPlayer.setDisconnect(false)
            // 重新发送手牌
            oPlayer.sendHandCardData()
            // 重新发操作
            for (let i = 0; i < GameRules.GameConfig.m_tabOprtCan.length; i++) {
                const tabOprt = GameRules.GameConfig.m_tabOprtCan[i]
                if (tabOprt.nPlayerID == event.PlayerID) {
                    print("9[LUA]:ReconnectSend===========>>>>>>>>>>>>>>>")
                    DeepPrintTable(tabOprt)
                    this.sendMsg("GM_Operator", tabOprt, event.PlayerID)
                }
            }
        }
        oPlayer.m_nUserID = event.userid
    }

    // 选择英雄
    onEvent_playerPickHero(event: GameEventProvidedProperties & DotaPlayerPickHeroEvent): void {
        if (GameRules.GameConfig.m_typeState == GameMessage.PS_None) {
            print("onEvent_playerPickHero")
            DeepPrintTable(event)
            const eHero = EntIndexToHScript(event.heroindex as EntityIndex) as CDOTA_BaseNPC_Hero
            if (event.player > 1) {
                this.m_tabPlayers[eHero.GetPlayerID()] = new Player(eHero.GetPlayerID())
            }
            const oPlayer = this.m_tabPlayers[eHero.GetPlayerOwnerID()]
            GameRules.HeroSelection.m_SelectHeroPlayerID.push(eHero.GetPlayerOwnerID())
            if (GameRules.State_Get() != GameState.HERO_SELECTION) {
                GameRules.HeroSelection.GiveAllPlayersSort()
            }
            print("oPlayer:", oPlayer)
            print("oPlayer.__init:", oPlayer.__init)
            if (oPlayer != null && !oPlayer.__init) {
                oPlayer.m_eHero = eHero
                oPlayer.initPlayer()
                if (this.nInit == null) this.nInit = 0
                this.nInit++
                if (this.nInit == this.getPlayerCount()) {
                    this.nInit == null
                    this.m_bAllPlayerInit = true
                }
            }
        }
    }

    // 玩家英雄的生成
    onEvent_NPCSpawned(event: GameEventProvidedProperties & NpcSpawnedEvent): void {
    }

    // 单位受伤
    onEvent_entityHurt(event: GameEventProvidedProperties & EntityHurtEvent): void {
    }

    // 玩家使用技能
    onEvent_dota_player_used_ability(event: GameEventProvidedProperties & DotaPlayerUsedAbilityEvent): void {
        print("onEvent_dota_player_used_ability")
        DeepPrintTable(event)
        CustomGameEventManager.Send_ServerToPlayer(PlayerResource.GetPlayer(event.PlayerID), "dota_player_used_ability", event)
    }

    // 玩家聊天
    onEvent_player_chat(event: GameEventProvidedProperties & PlayerChatEvent): void {
    }

    /**
     * getPlayer
    nPlayerID:numbber     */
    getPlayer(nPlayerID: number): Player {
        return this.m_tabPlayers[nPlayerID]
    }

    getPlayerCount() {
        return this.m_tabPlayers.length
    }

    /**发送事件消息给某玩家 */
    sendMsg(strMgsID: string, tabData, nPlayerID: number) {
        const oPlayer = this.getPlayer(nPlayerID)
        if (oPlayer) {
            oPlayer.sendMsg(strMgsID, tabData)
        }
    }

    /**广播事件消息 */
    broadcastMsg(strMgsID: string, tabData) {
        switch (strMgsID) {
            case "GM_Operator":
                CustomGameEventManager.Send_ServerToAllClients("GM_Operator", tabData)
                break;
            case "GM_OperatorFinished":
                CustomGameEventManager.Send_ServerToAllClients("GM_OperatorFinished", tabData)
                break
            case "S2C_GM_HUDErrorMessage":
                CustomGameEventManager.Send_ServerToAllClients("S2C_GM_HUDErrorMessage", tabData)
                break;
            default:
                print("=========!!!未匹配消息:", strMgsID,"!!!=========")
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
        let nCount = 0
        for (const player of this.m_tabPlayers) {
            if (this.isAlivePlayer(player.m_nPlayerID)) {
                nCount++
            }
        }
        return nCount
    }

    /**玩家是否存活 */
    isAlivePlayer(nPlayerID: number) {
        const player = this.getPlayer(nPlayerID)
        return player && !player.m_bDie
    }

    /**是否是领地最少的玩家 */
    isLeastPathPlayer(playerid: number): boolean {
        const leastPlayers = this.getLeastPathPlayer()
        return leastPlayers.some(player => player.m_nPlayerID === playerid)
    }

    /**是否领地最多的玩家 */
    isMostPathPlayer(playerid: number): boolean {
        const mostPlayers = this.getMostPathPlayer()
        return mostPlayers.some(player => player.m_nPlayerID === playerid)
    }

    /**获取领地最多的玩家的领地数量 */
    getMostPathCount(): number {
        let max = 0
        for (const player of this.m_tabPlayers) {
            if (this.isAlivePlayer(player.m_nPlayerID)) {
                const sum = player.getPathCount()
                if (sum > max) {
                    max = sum
                }
            }
        }
        return max
    }


    /**获取领地最多的玩家 */
    getMostPathPlayer(): Player[] {
        const max = this.getMostPathCount()
        const resPlayers: Player[] = []
        for (const player of this.m_tabPlayers) {
            if (this.isAlivePlayer(player.m_nPlayerID)) {
                const sum = player.getPathCount()
                if (sum == max) {
                    resPlayers.push(player)
                }
            }
        }
        return resPlayers
    }

    /**获取领地最少的玩家的领地数量 */
    getLeastPathCount(): number {
        let min = 0
        for (const player of this.m_tabPlayers) {
            if (this.isAlivePlayer(player.m_nPlayerID)) {
                const sum = player.getPathCount()
                if (sum < min) {
                    min = sum
                }
            }
        }
        return min
    }


    /**获取领地最少的玩家 */
    getLeastPathPlayer(): Player[] {
        const min = this.getLeastPathCount()
        const resPlayers: Player[] = []
        for (const player of this.m_tabPlayers) {
            if (this.isAlivePlayer(player.m_nPlayerID)) {
                const sum = player.getPathCount()
                if (sum == min) {
                    resPlayers.push(player)
                }
            }
        }
        return resPlayers
    }
}

