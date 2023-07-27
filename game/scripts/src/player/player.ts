import { GameMessage } from "../mode/gamemessage"
import { Constant } from "../mode/constant"
import { Path } from "../path/Path"
import { AHMC } from "../utils/amhc"
import { PathDomain } from "../path/pathdomain"
export class Player {

    m_bRoundFinished: boolean = null			//  此轮中已结束回合
    m_bDisconnect: boolean = null		   //  断线
    m_bDie: boolean = null				  //  死亡
    m_bAbandon: boolean = null			  //  放弃
    m_bDeathClearing: boolean = null		//  亡国清算中
    m_tMuteTradePlayers: PlayerID[] = []	  //  交易屏蔽玩家id

    m_nPlayerID: PlayerID = null				//  玩家ID
    m_nUserID: number = null				//  userID
    m_nSteamID: number = null				//  SteamID
    m_nWageGold: number = null			 //  每次工资
    m_nGold: number = 0				   //  拥有的金币
    m_nSumGold: number = 0				//  总资产
    m_nPassCount: number = null			//  剩余要跳过的回合数
    m_nCDSub: number = null				//  冷却减缩固值
    m_nManaSub: number = null			  //  耗魔减缩固值
    m_nLastAtkPlayerID: number = null	  //  最后攻击我的玩家ID
    m_nKill: number = null				 //  击杀数
    m_nGCLD: number = null				 //  攻城数
    m_nDamageHero: number = null		   //  英雄伤害
    m_nDamageBZ: number = null			 //  兵卒伤害
    m_nGoldMax: number = null			  //  巅峰资产数
    m_nBuyItem: number = null			  //  可购装备数
    m_nRank: number = null				 //  游戏排名
    m_nOprtOrder: number = null			//  操作顺序,根据m_PlayersSort中的index
    m_nRollMove: number = null			 //  roll点移动的次数（判断入狱给阎刃卡牌）
    m_nMoveDir: number = null			  //  方向	1=正向 -1=逆向

    m_typeState: number = GameMessage.PS_None			//  玩家状态
    m_typeBuyState: number = GameMessage.TBuyItem_None//  购物状态
    m_typeTeam: DotaTeam = null			  //  自定义队伍

    m_oCDataPlayer = null			//  官方CDOTAPlayer脚本
    m_eHero: CDOTA_BaseNPC_Hero = null					//  英雄单位

    m_pathCur: Path = null				//  当前英雄所在路径
    m_pathLast: Path = null				//  上次英雄停留路径
    m_pathPassLast: Path = null			//  上次英雄经过路径
    m_pathMoveStart: Path = null			//  上次移动起点路径


    m_tabMyPath: {
        [typePath: number]: PathDomain[]
    } = null				//  占领的路径<路径类型,路径{}>
    m_tabBz: any[] = null					//  兵卒
    m_tabHasCard: number[] = null			//  手上的卡牌
    m_tabUseCard = null			//  已使用的卡牌
    m_tabDelCard = null			//  已移除的卡牌
    m_tCourier = null			  //  信使
    __init: boolean = false            // 


    constructor(nPlayerID: PlayerID) {
        print("new Player(),nPlayerID:", nPlayerID)
        this.m_nPlayerID = nPlayerID
        this.m_nSteamID = PlayerResource.GetSteamAccountID(this.m_nPlayerID)
        this.m_nCDSub = 0
        this.m_nManaSub = 0
        this.m_nWageGold = 0
        this.m_nGold = 0
        this.m_nSumGold = 0
        this.m_nGoldMax = 0
        this.m_nPassCount = 0
        this.m_nLastAtkPlayerID = -1
        this.m_nKill = 0
        this.m_nGCLD = 0
        this.m_nDamageHero = 0
        this.m_nDamageBZ = 0
        this.m_tabMyPath = []
        this.m_tabBz = []
        this.m_tabHasCard = []
        this.m_tabUseCard = []
        this.m_tabDelCard = []
        this.m_typeState = GameMessage.PS_None
        this.m_nBuyItem = 0
        this.m_typeBuyState = GameMessage.TBuyItem_None
        this.m_bDie = false
        this.m_bAbandon = false
        this.m_typeTeam = Constant.CUSTOM_TEAM[nPlayerID]
        this.m_pathCur = null
        this.m_nRollMove = 0
        this.m_nMoveDir = 1
        this.m_tMuteTradePlayers = []
        this.m_eHero = null
        this.m_tCourier = []

        PlayerResource.SetCustomTeamAssignment(nPlayerID, DotaTeam.GOODGUYS)
        this.registerEvent()

        // 同步玩家网表信息
        this.setNetTableInfo()

        let tabData = CustomNetTables.GetTableValue("GamingTable", "all_playerids")
        if (tabData == null) tabData = []
        tabData[this.m_nPlayerID] = this.m_nPlayerID
        CustomNetTables.SetTableValue("GamingTable", "all_playerids", tabData)
        DeepPrintTable(tabData)
    }


    registerEvent(): void {
        CustomGameEventManager.RegisterListener("Event_OnDamage", (data, event) => this.onEvent_OnDamage(event))
        CustomGameEventManager.RegisterListener("Event_Atk", (data, event) => this.onEvent_Atk_bzHuiMo())
        CustomGameEventManager.RegisterListener("Event_PlayerRoundBegin", (data, event) => this.onEvent_PlayerRoundBegin)
        CustomGameEventManager.RegisterListener("Event_UpdateRound", (data, event) => this.onEvent_UpdateRound)
        CustomGameEventManager.RegisterListener("Event_Move", (data, event) => this.onEvent_Move)
        CustomGameEventManager.RegisterListener("Event_PlayerDie", (data, event) => this.onEvent_PlayerDie)
        CustomGameEventManager.RegisterListener("Event_HeroManaChange", (data, event) => this.onEvent_HeroManaChange)
        CustomGameEventManager.RegisterListener("Event_UseSkinChange", (data, event) => this.onEvent_UseSkinChange)

    }

    onEvent_OnDamage(event) {

    }

    onEvent_Atk_bzHuiMo() {

    }

    onEvent_PlayerRoundBegin() {

    }

    onEvent_UpdateRound() {

    }

    onEvent_Move() {

    }

    onEvent_PlayerDie() {

    }

    onEvent_HeroManaChange() {

    }

    onEvent_UseSkinChange() {

    }

    setDisconnect(bVal: boolean) {
        const keyname = "player_info_" + this.m_nPlayerID as
            "player_info_0" | "player_info_1" | "player_info_2" | "player_info_3" | "player_info_4" | "player_info_5";
        // 设置网标
        const info = CustomNetTables.GetTableValue("GamingTable", keyname)
        info["bDisconnect"] = (bVal ? 1 : 0)
        CustomNetTables.SetTableValue("GamingTable", keyname, info)

        this.m_bDisconnect = bVal
        this.updateCtrl()
    }

    updateCtrl() {
        let nCtrlID: PlayerID
        if (this.m_bDisconnect) nCtrlID = -1
        else nCtrlID = this.m_nPlayerID
        if (this.m_eHero != null)
            this.m_eHero.SetControllableByPlayer(nCtrlID, true)
        for (const v of Object.values(this.m_tabBz)) {
            if (v != null)
                v.SetControllableByPlayer(nCtrlID, true)
        }
    }

    // 发送手牌数据给客户端
    sendHandCardData() {
        // let jsonData = []
        // for (const value of this.m_tabHasCard) {

        // }
    }

    initPlayer() {
        this.__init = true

        // 控制权
        Timers.CreateTimer(0.1, () => {
            this.m_eHero.SetControllableByPlayer(this.m_bDisconnect ? -1 : this.m_nPlayerID, true)
        })
        // 碰撞半径
        this.m_eHero.SetHullRadius(1)
        // 视野
        this.m_eHero.SetDayTimeVisionRange(300)
        this.m_eHero.SetNightTimeVisionRange(300)
        // 禁止攻击
        this.setHeroCanAttack(false)
        this.m_eHero.SetAttackCapability(UnitAttackCapability.NO_ATTACK)
        // 禁止自动寻找最短路径
        // this.m_eHero.SetMustReachEachGoalEntity(true)
        // 0升级点
        this.m_eHero.SetAbilityPoints(0)
        // 0回蓝
        Timers.CreateTimer(0.1, () => {
            this.m_eHero.SetMaxMana(1)
            this.m_eHero.SetBaseManaRegen(0)
            this.m_eHero.SetBaseManaRegen(-(this.m_eHero.GetManaRegen()))
        })
        // 0回血
        Timers.CreateTimer(0.1, () => {
            this.m_eHero.SetBaseHealthRegen(0)
            this.m_eHero.SetBaseHealthRegen(-(this.m_eHero.GetHealthRegen()))
        })
        // 初始化金币
        this.setGold(Constant.INITIAL_GOLD)
        this.setGoldUpdate()
        // 清空英雄物品
        for (let slot = 0; slot < 9; slot++) {
            const item = this.m_eHero.GetItemInSlot(slot)
            if (item != null)
                this.m_eHero.RemoveItem(item)
        }
        // 初始化技能
        for (let index = 0; index < 24; index++) {
            const oAblt = this.m_eHero.GetAbilityByIndex(index)
            if (oAblt != null)
                oAblt.SetLevel(1)
        }
        // 设置起点路径
        this.setPath(GameRules.PathManager.getPathByType(GameMessage.TP_START)[0])


    }

    initTeam() {
        this.m_typeTeam = PlayerResource.GetTeam(this.m_nPlayerID)
    }

    setHeroCanAttack(bCan: boolean) {
        print("this.m_eHero:", this.m_eHero)
        print("=========DeepPrintTable:this.m_eHero")
        DeepPrintTable(this.m_eHero)
        const isValidEntity = IsValidEntity(this.m_eHero)
        const IsAlive = this.m_eHero.IsAlive()
        print("IsValidEntity:", isValidEntity)
        print("IsAlive:", IsAlive)
        if (bCan)
            AHMC.RemoveAbilityAndModifier(this.m_eHero, "jiaoxie")
        else
            AHMC.AddAbilityAndSetLevel(this.m_eHero, "jiaoxie")
    }

    /** 设置玩家网表信息 */
    setNetTableInfo() {
        const keyname = "player_info_" + this.m_nPlayerID as
            "player_info_0" | "player_info_1" | "player_info_2" | "player_info_3" | "player_info_4" | "player_info_5";
        const tabData = CustomNetTables.GetTableValue("GamingTable", keyname)
        // 拥有的路径信息
        let tabOwnPath: number[] = []
        for (const key in this.m_tabMyPath) {
            const paths = this.m_tabMyPath[key];
            for (const path of paths) {
                tabOwnPath.push(path.m_nID)
            }
        }
        // 有兵卒的路径信息
        let tabBzPath: number[] = []
        for (const typePath in this.m_tabMyPath) {
            const paths = this.m_tabMyPath[typePath];
            if (Number(typePath) >= GameMessage.TP_DOMAIN_1 && paths[1].m_tabENPC.length > 0) {
                tabBzPath.push(Number(typePath))
            }
        }
        // 设置网表
        CustomNetTables.SetTableValue("GamingTable", keyname, {
            bDisconnect: tabData == null ? 0 : tabData.bDisconnect,
            nGold: this.m_nGold,
            nSumGold: this.m_nSumGold,
            bRoundFinished: this.m_bRoundFinished ? 1 : 0,
            nPathCurID: tabData == null ? 1 : this.m_pathCur.m_nID,
            nSteamID64: tabData == null ? PlayerResource.GetSteamAccountID(this.m_nPlayerID) : tabData.nSteamID64,
            nSteamID32: tabData == null ? PlayerResource.GetSteamID(this.m_nPlayerID) : tabData.nSteamID32,
            tabPathHasBZ: tabBzPath,
            tabPath: tabOwnPath,
            nCard: this.m_tabHasCard.length,
            nCDSub: this.m_nCDSub,
            nManaSub: this.m_nManaSub,
            nKill: this.m_nKill,
            nGCLD: this.m_nGCLD,
            nBuyItem: this.m_nBuyItem,
            typeBuyState: this.m_typeBuyState,
            bDeathClearing: this.m_bDeathClearing ? 1 : 0,
            nOprtOrder: this.m_nOprtOrder,
            tMuteTradePlayers: this.m_tMuteTradePlayers,
            typeTeam: this.m_typeTeam
        })
        // DeepPrintTable(CustomNetTables.GetTableValue("GamingTable", keyname))
    }

    /**
     * 设置金钱
     * @param nGold 
     */
    setGold(nGold: number) {
        const lastnGold = this.m_nGold
        nGold += this.m_nGold

        this.m_nGold = nGold
        const keyname = "player_info_" + this.m_nPlayerID as
            "player_info_0" | "player_info_1" | "player_info_2" | "player_info_3" | "player_info_4" | "player_info_5";
        // 设置网表
        const info = CustomNetTables.GetTableValue("GamingTable", keyname)
        if (info != null) info.nGold = this.m_nGold
        CustomNetTables.SetTableValue("GamingTable", keyname, info)
        print("keyname", keyname)
        print("=========DeepPrintTable:GamingTable", CustomNetTables.GetTableValue("GamingTable", keyname))
        DeepPrintTable(CustomNetTables.GetTableValue("GamingTable", keyname))

        if ((lastnGold >= 0) != (nGold >= 0)) {
            CustomGameEventManager.Send_ServerToPlayer(this.m_oCDataPlayer, "Event_TO_SendDeathClearing", { nPlayerId: this.m_nPlayerID })
        }

        Timers.CreateTimer(0.1, () => {
            this.setSumGold()
        })
    }

    /** 设置总资产 */
    setSumGold() {
        this.m_nSumGold = this.m_nGold
        // 统计领地
        for (const index in this.m_tabMyPath) {
            this.m_nSumGold += (this.m_tabMyPath[index].length * (Constant.PATH_TO_PRICE[index]))
        }
        // 统计装备
        for (let slot = 0; slot < 9; slot++) {
            const item = this.m_eHero.GetItemInSlot(slot)
            if (item != null) {
                let nGoldCost = GetItemCost(item.GetAbilityName())
                this.m_nSumGold += nGoldCost
            }
        }
        // 统计兵卒
        if (this.m_tabBz.length > 0) {
            for (const value of this.m_tabBz) {
                if (!value.IsNull()) {
                    const ablt = value.FindAbilityByName("xj_" + value.m_path.m_typePath) as CDOTA_Ability_Lua
                    if (ablt != null) {
                        for (let index = ablt.GetLevel() - 1; index > -1; index--) {
                            const nGoldCost = ablt.GetGoldCost(index)
                            this.m_nSumGold += nGoldCost * -2
                        }
                    }
                }
            }
        }

        if (this.m_nGoldMax < this.m_nSumGold) this.m_nGoldMax = this.m_nSumGold

        // 设置网表
        const keyname = "player_info_" + this.m_nPlayerID as
            "player_info_0" | "player_info_1" | "player_info_2" | "player_info_3" | "player_info_4" | "player_info_5";
        const info = CustomNetTables.GetTableValue("GamingTable", keyname)
        info.nSumGold = this.m_nSumGold
        CustomNetTables.SetTableValue("GamingTable", keyname, info)
    }

    setGoldUpdate() {
        Timers.CreateTimer(() => {
            if (!AHMC.IsValid(this.m_eHero)) return
            if (this.m_nGold > 0)
                this.m_eHero.SetGold(this.m_nGold, false)
            else
                this.m_eHero.SetGold(0, false)
            this.m_eHero.SetGold(0, true)
            return 0.1
        })
    }

    /**
     * 设置当前路径
     * @param path 
     * @param bPass 经过某地
     */
    setPath(path: Path, bPass?: boolean) {
        if (bPass)
            // 经过某地
            this.m_pathPassLast = this.m_pathCur
        else {
            // 抵达目的地
            this.m_pathLast = this.m_pathMoveStart
            if (this.m_pathLast != null)
                this.m_pathLast.setEntityDel(this.m_eHero)
            if (path != null)
                // 加入
                path.setEntityAdd(this.m_eHero)
        }

        if (this.m_pathCur != path) {
            // 触发当前路径变更
            this.m_pathCur = path
            CustomGameEventManager.Send_ServerToPlayer(this.m_oCDataPlayer, "Event_CurPathChange", {
                playerID: this.m_nPlayerID
            })
        }
        this.m_pathCur = path

        if (!bPass || bPass == null) {
            CustomGameEventManager.Send_ServerToPlayer(this.m_oCDataPlayer, "Event_JoinPath", {
                playerID: this.m_nPlayerID
            })
        }

        // 同步玩家网表信息
        this.setNetTableInfo()
    }

    /**设置兵卒攻击状态 */
    setBzAttack(eBz, bCan?: boolean) {
        if (eBz == null) return
        if (bCan == null) {
            bCan = (this.m_typeState & GameMessage.PS_AtkBZ) !== 0 && (this.m_typeState & GameMessage.PS_InPrison) === 0
        }

        for (const value of this.m_tabBz) {
            if (value == eBz) {
                if (bCan) {
                    // 攻击时不能控制
                    value.SetControllableByPlayer(-1, true)
                    // 攻击时需要为敌方
                    value.SetTeam(DotaTeam.BADGUYS)
                    CustomGameEventManager.Send_ServerToPlayer(this.m_oCDataPlayer, "Event_BZCanAtk", { entity: value })
                } else {
                    AHMC.AddAbilityAndSetLevel(value, "jiaoxie")
                    if (!this.m_bDisconnect) value.SetControllableByPlayer(this.m_nPlayerID, true)
                    value.SetTeam(DotaTeam.GOODGUYS)
                    value.m_eAtkTarget = null
                    CustomGameEventManager.Send_ServerToPlayer(this.m_oCDataPlayer, "Event_BZCantAtk", { entity: value })
                }
                return
            }
        }
    }

    /**设置攻击目标给兵卒 */
    setBzAtker(eBz, eAtaker?: CDOTA_BaseNPC_Hero, bDel?: boolean) {
        if (eBz == null || this.m_tabBz.indexOf(eBz) == -1) return
        if (eBz.m_tabAtker == null) eBz.m_tabAtker = []

        if (bDel) {
            AHMC.removeAll(eBz.m_tabAtker, eAtaker)
        } else {
            if (eBz.m_tabAtker.indexOf(eAtaker) == -1) eBz.m_tabAtker.push(eAtaker)
            this.ctrlBzAtk(eBz)
        }
    }

    /**设置兵卒可否被攻击*/
    setBzBeAttack(eBz, bCan?: boolean) {
        if (eBz == null) return
        for (const value of this.m_tabBz) {
            if (value == eBz) {
                if (bCan)
                    AHMC.RemoveAbilityAndModifier(value, "physical_immune")
                else
                    AHMC.AddAbilityAndSetLevel(value, "physical_immune")
            }
            return
        }
    }

    /**兵卒攻击控制器 */
    ctrlBzAtk(eBz) {
        if (eBz == null) return
        if (eBz.IsInvisible()) return    //兵卒隐身不能攻击
        if (eBz._ctrlBzAtk_thinkID) return
        eBz._ctrlBzAtk_thinkID = Timers.CreateTimer(() => {
            if (eBz && !eBz.IsNull()) {
                // 获取在攻击范围的玩家
                for (const value of eBz.m_tabAtker) {
                    const nDis = (value.GetAbsOrigin() - eBz.GetAbsOrigin().Length())
                    const nRange = eBz.Script_GetAttackRange()
                    if (nDis <= nRange) {
                        // 达到攻击距离
                        if (AHMC.RemoveAbilityAndModifier(eBz, "jiaoxie")) {
                            eBz.SetDayTimeVisionRange(nRange)
                            eBz.SetNightTimeVisionRange(nRange)
                            eBz.MoveToTargetToAttack(value)
                            eBz.m_eAtkTarget = value
                            return 0.1
                        }
                    } else {
                        AHMC.AddAbilityAndSetLevel(eBz, "jiaoxie")
                        eBz.m_eAtkTarget = null
                    }
                    return 0.1
                }
            }
            eBz._ctrlBzAtk_thinkID = null
        })
    }

    /**以前 */
    moveToPath(path: Path, funCallBack?: Function) {
        // 开始移动
        this.setState()
        this.m_pathMoveStart = this.m_pathCur
        GameRules.PathManager.moveToPath(this.m_eHero,path,true,(bSuccess:boolean)=>{
            if(bSuccess && !this.m_bDie){
                this.setPath(path)
            }
            if(funCallBack != null) funCallBack(bSuccess)
        })
    }

    /**设置玩家状态 */
    setState() {
    }
}