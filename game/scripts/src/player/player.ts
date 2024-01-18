import {
    PS_AtkBZ,
    PS_AtkHero,
    PS_AtkMonster,
    PS_Die,
    PS_InPrison,
    PS_Invis,
    PS_MagicImmune,
    PS_Moving,
    PS_None,
    PS_Pass,
    PS_PhysicalImmune,
    PS_Rooted,
    BuyState_None,
    TP_DOMAIN_1,
    TP_START,
} from '../constants/gamemessage';
import {
    BZ_HUIMO_BEATK_RATE,
    BZ_HUIMO_RATE_J,
    BZ_HUIMO_RATE_Y,
    BZ_LEVELMAX,
    BZ_MAX_LEVEL,
    CUSTOM_TEAM,
    HERO_TO_BZ,
    INITIAL_GOLD,
    LEVEL_EXP,
    PATH_TO_PRICE,
    ROUND_BZ_HUIXUE_ROTA,
    ROUND_HERO_HUIXUE_ROTA,
    TIME_MOVE_MAX,
} from '../constants/constant';
import { Path } from '../path/path';
import { AMHC, IsValid } from '../utils/amhc';
import { PathDomain } from '../path/pathtype/pathsdomain/pathdomain';
import { CDOTA_BaseNPC_BZ } from './CDOTA_BaseNPC_BZ';
import { TSBaseAbility } from '../ability/tsBaseAbilty';
import { ParaAdjuster } from '../utils/paraadjuster';
import { Card } from '../card/card';

export type player_info = 'player_info_0' | 'player_info_1' | 'player_info_2' | 'player_info_3' | 'player_info_4' | 'player_info_5';
export type DamageEvent = {
    entindex_attacker_const: EntityIndex;
    entindex_victim_const: EntityIndex;
    entindex_inflictor_const?: EntityIndex;
    damagetype_const: DamageTypes;
    damage: number;
    bIgnore?: boolean;
    bIgnoreGold?: boolean;
    bIgnoreDamageSelf?: boolean;
    bIgnoreBZHuiMo?: boolean;
    bBladeMail?: boolean; // 来源是否为刃甲
};

export class Player {
    m_bRoundFinished: boolean; //  此轮中已结束回合
    m_bDisconnect: boolean; //  断线
    m_bDie: boolean = false; //  死亡
    m_bAbandon: boolean = false; //  放弃
    m_bDeathClearing: boolean; //  死亡清算中
    m_tMuteTradePlayers: number[] = []; //  交易屏蔽玩家id

    m_nPlayerID: PlayerID; //  玩家ID
    m_nUserID: number; //  userID
    m_nSteamID: number; //  SteamID
    m_nWageGold: number = 0; //  每次工资
    m_nGold: number = 0; //  拥有的金币
    m_nSumGold: number = 0; //  总资产
    m_nPassCount: number = 0; //  剩余要跳过的回合数
    m_nManaMaxBase: number = 0; //  蓝量最大基础值
    m_nCDSub: number = 0; //  冷却减缩固值
    m_nManaSub: number = 0; //  耗魔减缩固值
    m_nLastAtkPlayerID: number = -1; //  最后攻击我的玩家ID
    m_nRoundDamage: number = 0; //  上回合承受伤害
    m_nKill: number = 0; //  击杀数
    m_nGCLD: number = 0; //  攻城数
    m_nDamageHero: number = 0; //  英雄伤害
    m_nDamageBZ: number = 0; //  兵卒伤害
    m_nGoldMax: number = 0; //  巅峰资产数
    m_nBuyItem: number = 0; //  可购装备数
    m_nRank: number; //  游戏排名
    m_nOprtOrder: number; //  操作顺序,根据m_PlayersSort中的index
    m_nRollMove: number = 0; //  roll点移动的次数（判断入狱给阎刃卡牌）
    m_nMoveDir: number = 1; //  方向	1=正向 -1=逆向

    m_nPlayerState: number = PS_None; //  玩家状态
    m_typeBuyState: number = BuyState_None; //  购物状态
    m_typeTeam: DotaTeam; //  自定义队伍

    m_oCDataPlayer: CDOTAPlayerController; //  官方CDOTAPlayer脚本
    m_eHero: CDOTA_BaseNPC_Hero; //  英雄单位

    m_pathCur: Path = null; //  当前英雄所在路径
    m_pathLast: Path; //  上次英雄停留路径
    m_pathPassLast: Path; //  上次英雄经过路径
    m_pathMoveStart: Path; //  上次移动起点路径

    m_tabMyPath: {
        [typePath: number]: PathDomain[];
    } = {}; //  占领的路径<路径类型,路径{}>
    m_tabBz: CDOTA_BaseNPC_BZ[] = []; //  兵卒
    /**手上的卡牌 */
    m_tabHasCard: Card[] = [];
    m_tabUseCardType: number[] = []; //  已使用的卡牌
    m_tabDelCardType: number[] = []; //  已移除的卡牌
    m_tCourier; //  TODO: 信使
    __init: boolean = false; //
    m_bGCLD: boolean; // 玩家英雄是否在攻城
    private _setState_Invis_onUsedAbltID: number;
    tBombs: { [key: number]: CDOTA_BaseNPC[] } = {};
    tBombSigns: { [key: number]: CDOTA_BaseNPC[] } = {};

    constructor(nPlayerID: PlayerID) {
        print('new Player(),nPlayerID:', nPlayerID);
        this.m_nPlayerID = nPlayerID;
        this.m_nSteamID = PlayerResource.GetSteamAccountID(this.m_nPlayerID);
        this.m_typeTeam = CUSTOM_TEAM[nPlayerID];

        PlayerResource.SetCustomTeamAssignment(nPlayerID, DotaTeam.GOODGUYS);
        this.registerEvent();

        // 同步玩家网表信息
        this.setNetTableInfo();

        let tabData = CustomNetTables.GetTableValue('GamingTable', 'all_playerids');
        if (tabData == null) tabData = [];
        tabData[this.m_nPlayerID] = this.m_nPlayerID;
        CustomNetTables.SetTableValue('GamingTable', 'all_playerids', tabData);
        DeepPrintTable(tabData);
    }

    initPlayer() {
        this.__init = true;

        // 控制权
        Timers.CreateTimer(0.1, () => {
            this.m_eHero.SetControllableByPlayer(this.m_bDisconnect ? -1 : this.m_nPlayerID, true);
        });
        // 碰撞半径
        this.m_eHero.SetHullRadius(1);
        // 视野
        this.m_eHero.SetDayTimeVisionRange(300);
        this.m_eHero.SetNightTimeVisionRange(300);
        // 禁止攻击
        this.setHeroCanAttack(false);
        this.m_eHero.SetAttackCapability(UnitAttackCapability.NO_ATTACK);
        // 禁止自动寻找最短路径
        // this.m_eHero.SetMustReachEachGoalEntity(true)
        // 0升级点
        this.m_eHero.SetAbilityPoints(0);
        // 0回蓝
        Timers.CreateTimer(0.1, () => {
            this.m_eHero.SetMana(1);
            this.m_eHero.SetBaseManaRegen(0);
            this.m_eHero.SetBaseManaRegen(-this.m_eHero.GetManaRegen());
        });
        // 0回血
        Timers.CreateTimer(0.1, () => {
            this.m_eHero.SetBaseHealthRegen(0);
            this.m_eHero.SetBaseHealthRegen(-this.m_eHero.GetHealthRegen());
        });
        // 初始化金币
        this.setGold(INITIAL_GOLD);
        this.setGoldUpdate();
        // 清空英雄物品
        for (let slot = 0; slot < 9; slot++) {
            const item = this.m_eHero.GetItemInSlot(slot);
            if (item != null) this.m_eHero.RemoveItem(item);
        }
        // 初始化技能
        for (let index = 0; index < 24; index++) {
            const oAblt = this.m_eHero.GetAbilityByIndex(index);
            if (oAblt != null) oAblt.SetLevel(1);
        }
        // 设置起点路径
        this.setPath(GameRules.PathManager.getPathByType(TP_START)[0]);

        // 玩家死亡杀死英雄
        if (this.m_bDie) {
            this.m_eHero.SetRespawnsDisabled(true);
            this.m_eHero.ForceKill(true);
        }

        // 设置共享主单位
        GameRules.ItemShare.setShareOwner(this.m_eHero);
    }

    // ================魔法修改触发事件====================

    /**耗蓝 */
    spendPlayerMana(nMana: number, ability?: CDOTABaseAbility) {
        this.m_eHero.SpendMana(nMana, ability);
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: this, oAblt: ability });
    }

    /**回蓝 */
    givePlayerMana(nMana: number) {
        this.m_eHero.GiveMana(nMana);
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: this });
    }

    /**设置蓝量 */
    setPlayerMana(nMana: number) {
        this.m_eHero.SetMana(nMana);
        GameRules.EventManager.FireEvent('Event_HeroManaChange', { player: this });
    }

    /**队伍 */
    initTeam() {
        this.m_typeTeam = PlayerResource.GetTeam(this.m_nPlayerID);
        PlayerResource.SetCustomTeamAssignment(this.m_nPlayerID, DotaTeam.GOODGUYS);
        PlayerResource.UpdateTeamSlot(this.m_nPlayerID, DotaTeam.GOODGUYS, this.m_nPlayerID);
    }

    /**发送消息给玩家 */
    sendMsg(strMgsID: string, tabData) {
        //@ts-ignore
        CustomGameEventManager.Send_ServerToPlayer(this.m_oCDataPlayer, strMgsID, tabData);
    }

    /** 设置玩家网表信息 */
    setNetTableInfo() {
        print('===setNetTableInfo===');
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        let tabData = CustomNetTables.GetTableValue('GamingTable', keyname);
        if (!tabData) {
            tabData = {
                bRoundFinished: this.m_bRoundFinished ? 1 : 0,
                nPathCurID: 1,
                nSteamID64: PlayerResource.GetSteamAccountID(this.m_nPlayerID),
                nSteamID32: PlayerResource.GetSteamID(this.m_nPlayerID),
            };
        }
        if (this.m_pathCur) {
            tabData.nPathCurID = this.m_pathCur.m_nID;
        }
        // 拥有的路径信息
        let tabOwnPath: number[] = [];
        // 有兵卒的路径信息
        let tabBzPath: number[] = [];
        for (const typePath in this.m_tabMyPath) {
            const paths = this.m_tabMyPath[typePath];
            for (const path of paths) {
                tabOwnPath.push(path.m_nID);
            }
            if (tonumber(typePath) >= TP_DOMAIN_1 && paths[0].m_tabENPC.length > 0) {
                tabBzPath.push(tonumber(typePath));
            }
        }
        tabData.tabPath = tabOwnPath;
        tabData.tabPathHasBZ = tabBzPath;

        tabData.nGold = this.m_nGold;
        tabData.nSumGold = this.m_nSumGold;
        tabData.nCard = this.m_tabHasCard.length;
        tabData.nCDSub = this.m_nCDSub;
        tabData.nManaSub = this.m_nManaSub;
        tabData.nKill = this.m_nKill;
        tabData.nGCLD = this.m_nGCLD;
        tabData.nBuyItem = this.m_nBuyItem;
        tabData.typeBuyState = this.m_typeBuyState;
        tabData.bDeathClearing = this.m_bDeathClearing ? 1 : 0;
        tabData.nOprtOrder = this.m_nOprtOrder;
        tabData.tMuteTradePlayers = this.m_tMuteTradePlayers;
        tabData.typeTeam = this.m_typeTeam;

        // 设置网表
        CustomNetTables.SetTableValue('GamingTable', keyname, tabData);
        // DeepPrintTable(CustomNetTables.GetTableValue("GamingTable", keyname))
    }

    /**查询当前金钱 */
    GetGold() {
        return this.m_nGold;
    }

    /**
     * 设置金钱
     * @param nGold
     */
    setGold(nGold: number) {
        const lastnGold = this.m_nGold;
        nGold += this.m_nGold;
        this.m_nGold = nGold;
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        // 设置网表
        const info = CustomNetTables.GetTableValue('GamingTable', keyname);
        if (info != null) info.nGold = this.m_nGold;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);

        if (lastnGold >= 0 != nGold >= 0) {
            GameRules.EventManager.FireEvent('Event_TO_SendDeathClearing', { nPlayerID: this.m_nPlayerID });
        }

        Timers.CreateTimer(0.1, () => {
            this.setSumGold();
        });
    }

    /**给其他玩家金钱 */
    giveGold(nGold: number, player: Player) {
        this.m_nLastAtkPlayerID = player.m_nPlayerID;
        this.m_nRoundDamage += nGold;
        this.setGold(-nGold);
        player.setGold(nGold);
    }

    setGoldUpdate() {
        Timers.CreateTimer(() => {
            if (!IsValid(this.m_eHero)) return;
            if (this.m_nGold > 0) this.m_eHero.SetGold(this.m_nGold, false);
            else this.m_eHero.SetGold(0, false);
            this.m_eHero.SetGold(0, true);
            return 0.1;
        });
    }

    SetWageGold(nGold: number) {
        this.m_nWageGold = nGold;
    }

    getWageGold() {
        return this.m_nWageGold;
    }

    /** 设置总资产 */
    setSumGold() {
        this.m_nSumGold = this.m_nGold;
        // 统计领地
        for (const index in this.m_tabMyPath) {
            this.m_nSumGold += this.m_tabMyPath[index].length * PATH_TO_PRICE[tonumber(index)];
        }
        // 统计装备
        for (let slot = 0; slot < 9; slot++) {
            const item = this.m_eHero.GetItemInSlot(slot);
            if (item != null) {
                let nGoldCost = GetItemCost(item.GetAbilityName());
                this.m_nSumGold += nGoldCost;
            }
        }
        // 统计兵卒
        if (this.m_tabBz.length > 0) {
            for (const value of this.m_tabBz) {
                if (!value.IsNull()) {
                    const ablt = value.FindAbilityByName('xj_' + value.m_path.m_typePath) as CDOTA_Ability_Lua;
                    if (ablt != null) {
                        for (let index = ablt.GetLevel() - 1; index > -1; index--) {
                            const nGoldCost = ablt.GetGoldCost(index);
                            this.m_nSumGold += nGoldCost * -2;
                        }
                    }
                }
            }
        }

        if (this.m_nGoldMax < this.m_nSumGold) this.m_nGoldMax = this.m_nSumGold;

        // 设置网表
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        const info = CustomNetTables.GetTableValue('GamingTable', keyname);
        info.nSumGold = this.m_nSumGold;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);
    }

    /**屏蔽某位玩家的交易 */
    setPlayerMuteTrade(nPlayerID: number, bMute: number) {
        if (bMute == 1) {
            if (!this.m_tMuteTradePlayers.includes(nPlayerID)) {
                this.m_tMuteTradePlayers.push(nPlayerID);
            }
        } else {
            this.m_tMuteTradePlayers = this.m_tMuteTradePlayers.filter(value => value != nPlayerID);
        }
        print('debug setPlayerMuteTrade: ', nPlayerID, bMute);
        DeepPrintTable(this.m_tMuteTradePlayers);
        this.setNetTableInfo();
    }

    /**是否已屏蔽交易玩家 */
    isPlayerMuteTrade(nPlayerID: number) {
        return this.m_tMuteTradePlayers.includes(nPlayerID);
    }

    /**设置玩家状态 */
    setPlayerState(playerState: number) {
        if (playerState > 0) {
            const newState = bit.bor(playerState, this.m_nPlayerState);
            playerState = newState - this.m_nPlayerState;
            this.m_nPlayerState = newState;
        } else {
            playerState = bit.band(-playerState, this.m_nPlayerState);
            this.m_nPlayerState -= playerState;
        }

        // 判断是否有修改过以下状态
        if (bit.band(playerState, PS_AtkBZ) > 0) {
            // 设置兵卒可否攻击
            this.setAllBZAttack();
        }
        if (bit.band(playerState, PS_AtkHero) > 0) {
            // 设置英雄可否攻击
            let bCan: boolean = bit.band(this.m_nPlayerState, PS_AtkHero) > 0;
            this.setHeroCanAttack(bCan);
            this.m_bGCLD = bCan;
            if (bCan) {
                // 攻击移除隐身状态
                this.setPlayerState(-PS_Invis);
            }

            // 计算卡牌可用状态
            this.setCardCanCast();
        }
        if (bit.band(playerState, PS_MagicImmune) > 0) {
            // 设置英雄魔免
            if (bit.band(this.m_nPlayerState, PS_MagicImmune) > 0) {
                AMHC.AddAbilityAndSetLevel(this.m_eHero, 'magic_immune');
            } else {
                AMHC.RemoveAbilityAndModifier(this.m_eHero, 'magic_immune');
            }
        }
        if (bit.band(playerState, PS_PhysicalImmune) > 0) {
            // 设置英雄物免
            if (bit.band(this.m_nPlayerState, PS_PhysicalImmune) > 0) {
                AMHC.AddAbilityAndSetLevel(this.m_eHero, 'physical_immune');
            } else {
                AMHC.RemoveAbilityAndModifier(this.m_eHero, 'physical_immune');
            }
        }
        if (bit.band(playerState, PS_Rooted) > 0) {
            // 设置英雄禁止移动
            if (bit.band(this.m_nPlayerState, PS_Rooted) > 0) {
                AMHC.AddAbilityAndSetLevel(this.m_eHero, 'rooted');
            } else {
                AMHC.RemoveAbilityAndModifier(this.m_eHero, 'rooted');

                // 触发事件:禁止移动取消
                GameRules.EventManager.FireEvent('Event_RootedDisable', { player: this });
            }
        }
        if (bit.band(playerState, PS_InPrison) > 0) {
            // 设置兵卒攻击状态
            this.setAllBZAttack();
            // 计算卡牌可用状态
            this.setCardCanCast();
        }
        if (bit.band(playerState, PS_Moving) > 0) {
            if (bit.band(this.m_nPlayerState, PS_Moving) > 0) {
                // 玩家开始移动
                GameRules.EventManager.FireEvent('Event_PlayerMove', { player: this });
            } else {
                // 玩家结束移动
                GameRules.EventManager.FireEvent('Event_PlayerMoveEnd', { player: this });
            }

            // 计算卡牌可用状态
            Timers.CreateTimer(() => {
                this.setCardCanCast();
            });
        }
        if (bit.band(playerState, PS_Pass) > 0) {
            if (bit.band(this.m_nPlayerState, PS_Pass) > 0) {
                GameRules.EventManager.FireEvent('Event_PlayerPass', { player: this });
            } else {
                GameRules.EventManager.FireEvent('Event_PlayerPassEnd', { player: this });
            }
        }
        if (bit.band(playerState, PS_Invis) > 0) {
            if (bit.band(this.m_nPlayerState, PS_Invis) > 0) {
                GameRules.EventManager.FireEvent('Event_PlayerInvis', { player: this });

                // 监听施法解除隐身
                this._setState_Invis_onUsedAbltID = GameRules.EventManager.Register('dota_player_used_ability', event => {
                    if (this.m_eHero != null && event.caster_entindex == this.m_eHero.GetEntityIndex()) {
                        this.setPlayerState(-PS_Invis);
                        return true;
                    }
                });
            } else {
                GameRules.EventManager.FireEvent('Event_PlayerInvisEnd', { player: this });
                GameRules.EventManager.UnRegisterByID(this._setState_Invis_onUsedAbltID, 'dota_player_used_ability');
                this._setState_Invis_onUsedAbltID = null;
            }
        }
    }

    /**设置跳过回合 */
    setPass(nCount: number) {
        if (this.m_nPassCount <= 0) {
            this.setPlayerState(PS_Pass);
            this.m_nPassCount = nCount;
            const player = this;
            // 监听玩家回合开始, 跳过回合
            function onEventPlayerRoundBegin(event: { oPlayer: Player; bRoll: boolean }) {
                print('===setPass_onEventPlayerRoundBegin===1');
                print('===setPass_onEventPlayerRoundBegin===event.mehero:', event.oPlayer.m_eHero.GetUnitName());
                if (event.oPlayer == player) {
                    print('===setPass_onEventPlayerRoundBegin===2');
                    // 跳过一回合
                    event['bIgnore'] = true;
                    event.bRoll = false;
                    player.m_nPassCount -= 1;
                    GameRules.EventManager.FireEvent('Event_PlayerPassOne', { player: player });
                    print('===setPass_player:', event.oPlayer.m_eHero.GetUnitName(), '===setPass===GameState:', GameRules.GameConfig.m_typeState);
                    GameRules.GameLoop.GameStateService.send('tofinished');

                    // 次数达到不再跳过
                    if (event.oPlayer.m_nPassCount <= 0) {
                        event.oPlayer.setPlayerState(-PS_Pass);
                        return true;
                    }
                }
            }

            const eventID = GameRules.EventManager.Register('Event_PlayerRoundBegin', (event: { oPlayer: Player; bRoll: boolean }) =>
                onEventPlayerRoundBegin(event)
            );
            // 监听状态解除
            GameRules.EventManager.Register('Event_PlayerPassEnd', (event: { player: Player }) => {
                if (event.player == this) {
                    GameRules.EventManager.UnRegisterByID(eventID, 'Event_PlayerRoundBegin');
                    event.player.m_nPassCount = 0;
                    return true;
                }
            });
        } else if (this.m_nPassCount < nCount) {
            // 解除上一次
            this.setPlayerState(-PS_Pass);
            // 再次设置
            this.setPass(nCount);
        }
    }

    /**设置玩家自己回合结束 */
    setRoundFinished(bVal: boolean) {
        this.m_bRoundFinished = bVal;
        if (this.m_bRoundFinished) {
            // 触发玩家回合结束事件
            GameRules.EventManager.FireEvent('Event_PlayerRoundFinished', this);
        }
        // 同步玩家网表信息
        this.setNetTableInfo();
    }

    /**移动到坐标 */
    moveToPos(location: Vector, funCallBack: Function) {
        // 验证能否到达
        if (!this.m_eHero.HasFlyMovementCapability() && !GridNav.CanFindPath(this.m_eHero.GetAbsOrigin(), location)) {
            if (funCallBack) {
                funCallBack(false);
            }
            return;
        }

        // 开始移动
        this.setPlayerState(PS_Moving);
        //TODO: 游戏状态是否要改变

        GameRules.PathManager.moveToPos(this.m_eHero, location, (bSuccess: boolean) => {
            this.setPlayerState(-PS_Moving);
            if (funCallBack) {
                funCallBack(bSuccess);
            }
        });
    }

    /**移动到路径 */
    moveToPath(path: Path, funCallBack?: Function) {
        print('===player===moveToPath===0');
        // 检查是否缠绕状态
        if (this.m_eHero.IsRooted()) {
            print('===player===moveToPath===1');
            // 如果是被缠绕，等待TIME_MOVE_MAX*0.1秒
            let time_root = TIME_MOVE_MAX;
            Timers.CreateTimer(0, () => {
                print('===player===moveToPath===time_root', time_root--);
                if (time_root <= 0) {
                    if (!this.m_bDie && funCallBack != null) {
                        funCallBack(false);
                    }
                    return;
                }
                return 0.1;
            });
            return;
        }
        // 开始移动
        this.setPlayerState(PS_Moving);
        this.m_pathMoveStart = this.m_pathCur;
        if (this.m_pathCur != path) {
            // 触发离开路径
            GameRules.EventManager.FireEvent('Event_LeavePath', { player: this, path: this.m_pathMoveStart });
        }
        // 监听移动经过路径
        const funPassingPath = (event: { path: Path; entity: CDOTA_BaseNPC }) => {
            if (event.entity == this.m_eHero) this.setPath(event.path, true);
        };
        GameRules.EventManager.Register('Event_PassingPath', funPassingPath);
        // 设置移动
        GameRules.PathManager.moveToPath(this.m_eHero, path, true, (bSuccess: boolean) => {
            GameRules.EventManager.UnRegister('Event_PassingPath', funPassingPath);
            this.setPlayerState(-PS_Moving);
            if (bSuccess && !this.m_bDie) {
                this.setPath(path);
            }
            if (funCallBack != null) funCallBack(bSuccess);
        });
    }

    moveStop() {
        GameRules.PathManager.moveStop(this.m_eHero, false);
    }

    /**闪现到路径 */
    blinkToPath(path: Path) {
        this.m_eHero.SetOrigin(path.m_entity.GetOrigin());
        FindClearSpaceForUnit(this.m_eHero, path.getNilPos(this.m_eHero), true);

        // 设置当前路径
        this.m_pathMoveStart = this.m_pathCur;

        if (this.m_pathCur != path) {
            // 触发离开路径
            GameRules.EventManager.FireEvent('Event_LeavePath', { player: this, path: this.m_pathMoveStart });
        }

        this.setPath(path);
    }

    /**复位在当前路径 */
    resetToPath() {
        // 复位
        this.m_eHero.SetOrigin(this.m_pathCur.m_entity.GetOrigin());
        FindClearSpaceForUnit(this.m_eHero, this.m_pathCur.getNilPos(this.m_eHero), true);

        // 朝向下一个路径
        const pathNext = GameRules.PathManager.getNextPath(this.m_pathCur, 1);
        let vLoc = (pathNext.m_entity.GetAbsOrigin() - this.m_pathCur.m_entity.GetAbsOrigin()) as Vector;
        vLoc = vLoc.Normalized();
        this.m_eHero.MoveToPosition((this.m_eHero.GetAbsOrigin() + vLoc) as Vector);
    }

    /**获取领地数量 */
    getPathCount() {
        let sum = 0;
        for (const key in this.m_tabMyPath) {
            sum += this.m_tabMyPath[key].length;
        }
        return sum;
    }

    /**
     * 设置当前路径
     * @param path
     * @param bPass 是否经过某地
     */
    setPath(path: Path, bPass?: boolean) {
        if (bPass)
            // 经过某地
            this.m_pathPassLast = this.m_pathCur;
        else {
            // 抵达目的地
            this.m_pathLast = this.m_pathMoveStart;
            if (this.m_pathLast != null) this.m_pathLast.setEntityDel(this.m_eHero);
            if (path != null)
                // 加入
                path.setEntityAdd(this.m_eHero);
        }

        if (this.m_pathCur != path) {
            // 触发当前路径变更
            this.m_pathCur = path;
            GameRules.EventManager.FireEvent('Event_CurPathChange', { player: this });
        }
        this.m_pathCur = path;

        if (!bPass || bPass == null) {
            GameRules.EventManager.FireEvent('Event_JoinPath', { player: this });
        }
        // 同步玩家网表信息
        this.setNetTableInfo();
    }

    /**是否拥有路径 */
    isHasPath(nPathID: number): boolean {
        for (const key in this.m_tabMyPath) {
            const paths = this.m_tabMyPath[key];
            for (const path of paths) {
                if (path.m_nID == nPathID) return true;
            }
        }
        return false;
    }

    /**添加占领路径 */
    setMyPathAdd(path) {
        if (this.m_bDie || this.isHasPath(path.m_nID)) {
            return;
        }

        this.m_tabMyPath[path.m_typePath] = this.m_tabMyPath[path.m_typePath] || [];
        this.m_tabMyPath[path.m_typePath].push(path);

        // 领地添加领主
        path.setOwner(this);
        // 计算总资产
        this.setSumGold();
        // 同步玩家网表信息
        this.setNetTableInfo();
    }

    /**移除占领路径 */
    setMyPathDel(path) {
        if (!this.isHasPath(path.m_nID)) return;

        this.m_tabMyPath[path.m_typePath] = this.m_tabMyPath[path.m_typePath].filter(v => {
            if (v.m_nID == path.m_nID) {
                if (v.m_nOwnerID == this.m_nPlayerID) {
                    path.setOwner();
                }
                if (path.m_tabENPC) {
                    for (const bz of path.m_tabENPC) {
                        this.removeBz(bz);
                    }
                }
                // 过滤掉
                return false;
            }
            return true;
        });

        if (this.m_tabMyPath[path.m_typePath].length == 0) {
            this.m_tabMyPath[path.m_typePath] = null;
        }

        // 同步玩家网表信息
        this.setNetTableInfo();
    }

    /**获取占领路径数量 */
    getMyPathCount(funFilter?: Function) {
        let nCount = 0;
        for (const k in this.m_tabMyPath) {
            const v = this.m_tabMyPath[k];
            if (funFilter) {
                nCount += funFilter(k, v);
            } else {
                nCount += v.length;
            }
        }
        return nCount;
    }

    /**给其他玩家连地(同类型) */
    setMyPathsGive(tPaths: Path[], player: Player) {
        // 验证同类型
        let typePath;
        for (const path of tPaths) {
            if (!typePath) {
                typePath = path.m_typePath;
            } else if (typePath != path.m_typePath) {
                return;
            }
        }

        let tPathAndBZLevel = [];

        for (const path of tPaths as PathDomain[]) {
            if (path.m_tabENPC && path.m_tabENPC[0] && !path.m_tabENPC[0].IsNull()) {
                tPathAndBZLevel[path.m_nID] = this.getBzStarLevel(path.m_tabENPC[0]);
            }
            player.setMyPathAdd(path);
            this.setMyPathDel(path);

            // 还原兵卒等级
            if (path.m_tabENPC[0] && !path.m_tabENPC[0].IsNull()) {
                let nLevel = tPathAndBZLevel[path.m_nID];
                nLevel -= player.getBzStarLevel(path.m_tabENPC[0]);
                if (nLevel != 0) {
                    player.setBzStarLevelUp(path.m_tabENPC[0], nLevel);
                }
            }
        }
    }

    /**创建兵卒到领地 */
    createBZOnPath(path: PathDomain, nStarLevel: number, bLevelUp?: boolean) {
        nStarLevel = nStarLevel || 1;

        // 创建单位
        let strName = HERO_TO_BZ[this.m_eHero.GetUnitName()];
        for (let i = nStarLevel; i >= 2; i--) {
            strName += '1';
        }
        print('创建单位strName:', strName);

        const eBZ = AMHC.CreateUnit(
            strName,
            path.m_eCity.GetOrigin(),
            path.m_eCity.GetAnglesAsVector().y,
            this.m_eHero,
            DotaTeam.GOODGUYS
        ) as CDOTA_BaseNPC_BZ;
        print('===createBZOnPath===GetMaxHealth:', eBZ.GetMaxHealth());
        print('===createBZOnPath===GetBaseMaxHealth:', eBZ.GetBaseMaxHealth());
        eBZ.SetBaseMaxHealth(eBZ.GetMaxHealth());
        eBZ.SetDayTimeVisionRange(300);
        eBZ.SetNightTimeVisionRange(300);
        // 添加数据
        this.m_tabBz.push(eBZ);
        path.m_tabENPC.push(eBZ);
        eBZ.m_path = path;

        // 设置兵卒技能等级
        eBZ.m_bAbltBZ = eBZ.GetAbilityByIndex(0);
        // 设置技能
        if (nStarLevel >= BZ_MAX_LEVEL) {
            // 设置巅峰技能
            AMHC.AddAbilityAndSetLevel(eBZ, 'yjxr_max', BZ_MAX_LEVEL);
            eBZ.SwapAbilities(eBZ.m_bAbltBZ.GetAbilityName(), 'yjxr_max', true, true);
        } else {
            AMHC.AddAbilityAndSetLevel(eBZ, 'yjxr_' + path.m_typePath, nStarLevel);
            eBZ.SwapAbilities(eBZ.m_bAbltBZ.GetAbilityName(), 'yjxr_' + path.m_typePath, true, true);
        }
        if (nStarLevel != 1) {
            AMHC.AddAbilityAndSetLevel(eBZ, 'xj_' + path.m_typePath, nStarLevel);
            const oAblt = eBZ.GetAbilityByIndex(1);
            if (oAblt) {
                eBZ.SwapAbilities(oAblt.GetAbilityName(), 'xj_' + path.m_typePath, !oAblt.IsHidden(), true);
            }
        }

        // 重置蓝量
        eBZ.SetMana(0);

        // 添加星星特效
        AMHC.ShowStarsOnUnit(eBZ, nStarLevel);

        // 设置可否攻击
        this.setAllBZAttack();
        // 设置可否被攻击
        this.setBzBeAttack(eBZ, false);

        // 触发事件
        GameRules.EventManager.FireEvent('Event_BZCreate', { entity: eBZ });

        // 设置等级
        this.setBzLevelUp(eBZ);

        // 同步玩家网表信息
        this.setNetTableInfo();

        // 同步装备
        this.syncItem(eBZ);
        // 设置共享
        GameRules.ItemShare.setShareAdd(eBZ, this.m_eHero);

        // 特效
        if (bLevelUp) {
            AMHC.CreateParticle(
                'particles/units/heroes/hero_oracle/oracle_false_promise_cast_enemy.vpcf',
                ParticleAttachment.ABSORIGIN_FOLLOW,
                false,
                eBZ,
                5
            );
        } else {
            const nPtclID = AMHC.CreateParticle('particles/neutral_fx/roshan_spawn.vpcf', ParticleAttachment.ABSORIGIN_FOLLOW, false, eBZ, 5);
            ParticleManager.SetParticleControl(nPtclID, 0, Vector(eBZ.GetOrigin().x, eBZ.GetOrigin().y, 0));
        }

        return eBZ;
    }

    /**移除兵卒 */
    removeBz(eBZ: CDOTA_BaseNPC_BZ) {
        print('===removeBz===0');
        if (!eBZ) return;

        let bHas: boolean;
        for (const v of this.m_tabBz) {
            print('===removeBz===========');
            print('v:', v.GetUnitName());
            print('===removeBz===PrintEnd=');
            if (v == eBZ) {
                this.m_tabBz = this.m_tabBz.filter(v => v != eBZ);
                bHas = true;
                break;
            }
        }
        print('===removeBz===1');
        if (!bHas) return;
        print('===removeBz===2');

        for (const typePath in this.m_tabMyPath) {
            const tabPath = this.m_tabMyPath[typePath];
            // TODO:检查typePath类型是否影响
            if (eBZ.m_path.m_typePath == tonumber(typePath)) {
                for (const oPath of tabPath) {
                    if (eBZ.m_path == oPath) {
                        oPath.m_tabENPC = oPath.m_tabENPC.filter(v => v != eBZ);
                        break;
                    }
                }
                break;
            }
        }
        print('===removeBz===3');

        // 触发事件
        GameRules.EventManager.FireEvent('Event_BZDestroy', { entity: eBZ });

        // 解除装备共享
        GameRules.ItemShare.setShareDel(eBZ);

        print('===removeBz===4');

        // 移除buff
        const tBuffs = eBZ.FindAllModifiers();
        for (const buff of tBuffs) {
            AMHC.RemoveModifierByName(buff.GetName(), eBZ);
        }
        print('===removeBz===5');

        // 处理装备
        if (this.m_tabBz.length > 0) {
            // 移除
            for (let slot = 0; slot < 9; slot++) {
                // TODO:
            }
        }
        print('===removeBz===6');

        eBZ.Destroy();

        print('===removeBz===7');
        // 同步玩家网表信息
        this.setNetTableInfo();
    }

    /**升级兵卒星级 */
    setBzStarLevelUp(eBZ: CDOTA_BaseNPC_BZ, nLevel: number) {
        if (!eBZ) return;

        const oPath = eBZ.m_path;
        const nLevelCur = this.getBzStarLevel(eBZ);

        // 造新兵卒
        const eBZNew = this.createBZOnPath(oPath, nLevelCur + nLevel, true);
        eBZNew.ModifyHealth(eBZ.GetHealth(), null, false, 0);
        // 血量
        if (nLevel > 0) {
            eBZNew.ModifyHealth(eBZNew.GetMaxHealth(), null, false, 0);
        } else {
            eBZNew.ModifyHealth(eBZ.GetHealthPercent() * eBZNew.GetMaxHealth(), null, false, 0);
        }
        // 魔法
        eBZNew.GiveMana(eBZ.GetMana());

        // 复制buff
        const tBuffs = eBZ.FindAllModifiers();
        for (const buff of tBuffs) {
            if (buff['copyBfToEnt']) {
                buff['copyBfToEnt'](eBZNew);
            }
        }

        // 触发事件
        GameRules.EventManager.FireEvent('Event_BZLevel', { eBZNew: eBZNew, eBZ: eBZ });

        // 选择器TODO:Selection
        this.removeBz(eBZ);
        eBZ = eBZNew;
        eBZ.m_path.setBuff(this);

        return eBZ;
    }

    /**更新兵卒等级 */
    setBzLevelUp(eBZ: CDOTA_BaseNPC_BZ) {
        if (eBZ.IsNull()) return;

        // 获取要升级的等级
        let nLevel = BZ_LEVELMAX[this.getBzStarLevel(eBZ)];
        if (this.m_eHero.GetLevel() < nLevel) {
            nLevel = this.m_eHero.GetLevel();
        }
        nLevel -= eBZ.GetLevel();

        const tEvent = {
            eBZ: eBZ,
            nLevel: nLevel,
        };
        GameRules.EventManager.FireEvent('Event_BZLevelUp', tEvent);
        nLevel = tEvent.nLevel;

        const bLevelDown = nLevel < 0;

        // 升级特效
        if (nLevel > 0) {
            AMHC.CreateParticle('particles/generic_hero_status/hero_levelup.vpcf', ParticleAttachment.ABSORIGIN_FOLLOW, false, eBZ, 3);
        }

        // 等级变更
        nLevel = math.abs(nLevel);
        for (let i = 1; i <= nLevel; i++) {
            eBZ.LevelUp(false, bLevelDown);
        }

        // 计算兵卒技能等级
        nLevel = math.floor(eBZ.GetLevel() * 0.1) + 1;
        if (nLevel > 3) {
            nLevel = 3;
        }
        eBZ.m_bAbltBZ.SetLevel(nLevel);
    }

    /**设置兵卒可否被攻击*/
    setBzBeAttack(eBz: CDOTA_BaseNPC_BZ, bCan?: boolean) {
        if (eBz == null) return;
        for (const value of this.m_tabBz) {
            if (value == eBz) {
                if (bCan) {
                    AMHC.RemoveAbilityAndModifier(value, 'physical_immune');
                } else {
                    AMHC.AddAbilityAndSetLevel(value, 'physical_immune');
                }
            }
            return;
        }
    }

    /**设置兵卒攻击状态 */
    setBzAttack(eBz: CDOTA_BaseNPC_BZ, bCan?: boolean) {
        if (eBz == null) {
            print('===Player.setBzAttack===error: eBz is null!');
            return;
        }
        if (bCan == null) {
            bCan = 0 < bit.band(this.m_nPlayerState, PS_AtkBZ) && 0 == bit.band(this.m_nPlayerState, PS_InPrison);
        }
        for (const value of this.m_tabBz) {
            if (value == eBz) {
                if (bCan) {
                    // 攻击时不能控制
                    value.SetControllableByPlayer(-1, true);
                    // 攻击时需要为敌方
                    value.SetTeam(DotaTeam.BADGUYS);
                    GameRules.EventManager.FireEvent('Event_BZCanAtk', { entity: value });
                } else {
                    AMHC.AddAbilityAndSetLevel(value, 'jiaoxie');
                    if (!this.m_bDisconnect) value.SetControllableByPlayer(this.m_nPlayerID, true);
                    value.SetTeam(DotaTeam.GOODGUYS);
                    value.m_eAtkTarget = null;
                    GameRules.EventManager.FireEvent('Event_BZCantAtk', { entity: value });
                }
                return;
            }
        }
    }

    /**设置玩家全部兵卒可否攻击 */
    setAllBZAttack() {
        print('===setAllBZAttack===this.m_nPlayerState:', this.m_nPlayerState);
        print('===setAllBZAttack===band1:', bit.band(this.m_nPlayerState, PS_AtkBZ));
        print('===setAllBZAttack===band2:', bit.band(this.m_nPlayerState, PS_InPrison));
        const bCan = bit.band(this.m_nPlayerState, PS_AtkBZ) > 0 && bit.band(this.m_nPlayerState, PS_InPrison) == 0;
        print('===setAllBZAttack===bCan:', bCan);
        function filter(eBZ: CDOTA_BaseNPC_BZ) {
            return !eBZ.m_path.m_nPlayerIDGCLD; // 忽略战斗中的兵卒
        }

        if (bCan) {
            for (const v of this.m_tabBz) {
                if (IsValid(v) && filter(v)) {
                    v.SetControllableByPlayer(-1, true); // 攻击时不能控制
                    v.SetTeam(DotaTeam.BADGUYS); // 攻击时需要为敌方
                    GameRules.EventManager.FireEvent('Event_BZCanAtk', { entity: v }); // 触发兵卒可攻击事件
                }
            }
        } else {
            for (const v of this.m_tabBz) {
                if (IsValid(v) && filter(v)) {
                    AMHC.AddAbilityAndSetLevel(v, 'jiaoxie');
                    if (!this.m_bDisconnect) {
                        v.SetControllableByPlayer(this.m_nPlayerID, true);
                    }
                    v.SetTeam(DotaTeam.GOODGUYS);
                    v.m_eAtkTarget = null;
                    GameRules.EventManager.FireEvent('Event_BZCantAtk', { entity: v }); //触发兵卒不可攻击事件
                }
            }
        }
    }

    /**设置攻击目标给兵卒 */
    setBzAtker(eBz: CDOTA_BaseNPC_BZ, eAtaker?: CDOTA_BaseNPC_Hero, bDel?: boolean) {
        if (eBz == null || !this.m_tabBz.includes(eBz)) {
            print('===setBzAtker===error: eBz is null!');
            return;
        }
        if (eBz.m_tabAtker == null) eBz.m_tabAtker = [];

        if (bDel) {
            AMHC.removeAll(eBz.m_tabAtker, eAtaker);
        } else {
            if (!eBz.m_tabAtker.includes(eAtaker)) eBz.m_tabAtker.push(eAtaker);
            this.ctrlBzAtk(eBz);
        }
    }

    /**设置攻击目标给全部兵卒 */
    setAllBzAtker(eAtaker: CDOTA_BaseNPC_Hero, bDel: boolean, funFilter?: Function) {
        for (const bz of this.m_tabBz) {
            if (!funFilter || funFilter(bz)) {
                if (!bz.m_tabAtker) {
                    bz.m_tabAtker = [];
                }
                if (bDel) {
                    bz.m_tabAtker = bz.m_tabAtker.filter(atker => atker != eAtaker);
                } else {
                    bz.m_tabAtker.push(eAtaker);
                    // 删去bz.m_tabAtker中重复的元素
                    bz.m_tabAtker = bz.m_tabAtker.filter((value, index, arr) => {
                        return arr.indexOf(value) === index;
                    });
                    this.ctrlBzAtk(bz);
                }
            }
        }
    }

    /**兵卒攻击控制器 */
    ctrlBzAtk(eBz: CDOTA_BaseNPC_BZ) {
        if (eBz == null) return;
        if (eBz.IsInvisible()) return; //兵卒隐身不能攻击
        if (eBz._ctrlBzAtk_thinkID) return;
        eBz._ctrlBzAtk_thinkID = Timers.CreateTimer(() => {
            if (eBz && !eBz.IsNull()) {
                // 获取在攻击范围的玩家
                for (const value of eBz.m_tabAtker) {
                    const nDis = ((value.GetAbsOrigin() - eBz.GetAbsOrigin()) as Vector).Length();
                    const nRange = eBz.Script_GetAttackRange();
                    if (nDis <= nRange) {
                        // 达到攻击距离
                        if (!eBz.HasAbility('jiaoxie')) {
                            if (eBz.GetMana() != eBz.GetMaxMana()) eBz.MoveToTargetToAttack(value);
                            return 0.1;
                        } else if (AMHC.RemoveAbilityAndModifier(eBz, 'jiaoxie')) {
                            eBz.SetDayTimeVisionRange(nRange);
                            eBz.SetNightTimeVisionRange(nRange);
                            eBz.MoveToTargetToAttack(value);
                            eBz.m_eAtkTarget = value;
                            return 0.1;
                        }
                    } else {
                        AMHC.AddAbilityAndSetLevel(eBz, 'jiaoxie');
                        eBz.m_eAtkTarget = null;
                    }
                    return 0.1;
                }
            }
            eBz._ctrlBzAtk_thinkID = null;
            return;
        });
    }

    /**获取兵卒的星级 */
    getBzStarLevel(eBZ: CDOTA_BaseNPC_BZ) {
        if (eBZ.IsNull()) return;

        let strName: string = eBZ.GetUnitName();
        strName = string.reverse(strName);
        print('string.reverse(strName):', strName);
        const nLevel = strName.indexOf('_');
        if (nLevel != -1) {
            return nLevel;
        } else {
            return 0;
        }
    }

    /**该玩家是否有该兵卒 */
    hasBZ(entity: CBaseEntity | EntityIndex) {
        if (entity != null) {
            if (typeof entity != 'number') {
                for (const v of this.m_tabBz) {
                    if (entity == v) {
                        return v;
                    }
                }
            } else {
                for (const v of this.m_tabBz) {
                    if (IsValid(v)) {
                        if (entity == v.GetEntityIndex()) {
                            return v;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**设置玩家英雄可否攻击 */
    setHeroCanAttack(bCan: boolean) {
        print('setHeroCanAttack:', bCan);
        if (bCan) AMHC.RemoveAbilityAndModifier(this.m_eHero, 'jiaoxie');
        else AMHC.AddAbilityAndSetLevel(this.m_eHero, 'jiaoxie');
    }

    /**获取英雄身上某buff */
    getBuffByName(strBuffName: string) {
        const tab = this.m_eHero.FindAllModifiersByName(strBuffName);
        for (const buff of tab) {
            if (buff != null) {
                return buff;
            }
        }
    }

    /**添加当前血量 */
    addHealth(nValue: number) {
        this.m_eHero.SetHealth(this.m_eHero.GetHealth() + nValue);
    }

    /**同步物品 */
    syncItem(BZ: CDOTA_BaseNPC_BZ) {
        const tItemsUnLock = [];
        const tSyncSlot: number[] = [];
        const tHeroItems: CDOTA_Item[] = [];
        const tBZItems: CDOTA_Item[] = [];
        for (let slot = 0; slot < 9; slot++) {
            tHeroItems[slot] = this.m_eHero.GetItemInSlot(slot) || null;
            tBZItems[slot] = BZ.GetItemInSlot(slot) || null;
        }
        for (let slot = 0; slot < 9; slot++) {
            if (!tHeroItems[slot]) {
                // 当前格子没装备
                if (!tBZItems[slot]) {
                    // 同步单位也没装备，不用同步
                } else {
                    // 移除物品
                    GameRules.ItemManager.removeItem(BZ, tBZItems[slot]);
                    tBZItems[slot] = null;
                }
            } else {
                // 当前格子有装备
                if (!tBZItems[slot]) {
                    // 同步单位没装备，同步
                    tSyncSlot.push(slot);
                } else if (tHeroItems[slot].GetAbilityName() != tBZItems[slot].GetAbilityName()) {
                    // 物品不同，移除物品，同步
                    tSyncSlot.push(slot);
                    GameRules.ItemManager.removeItem(BZ, tBZItems[slot]);
                    tBZItems[slot] = null;
                }
            }
        }
        print('===syncItem===tHeroItems:');
        tHeroItems.forEach(item => {
            if (item) print('slot:', item.GetItemSlot(), '===', item.GetAbilityName());
        });
        print('===syncItem===tBZItems:');
        tBZItems.forEach(item => {
            if (item) print('slot:', item.GetItemSlot(), '===', item.GetAbilityName());
        });
        print('===syncItem===tSyncSlot:');
        DeepPrintTable(tSyncSlot);
        // 预先锁定
        for (let slot = 0; slot < 9; slot++) {
            if (tBZItems[slot] && !tBZItems[slot].IsCombineLocked()) GameRules.ItemShare.lockItem(tBZItems[slot]);
        }
        // 同步
        for (const slot of tSyncSlot) {
            print('===syncItem===for of:', slot);
            const itemNew = BZ.AddItemByName(tHeroItems[slot].GetAbilityName());
            itemNew.SetPurchaseTime(tHeroItems[slot].GetPurchaseTime());
            GameRules.ItemShare.lockItem(itemNew);
            BZ.SwapItems(itemNew.GetItemSlot(), slot);
            tBZItems[slot] = itemNew;
        }
        // 解锁定
        for (let slot = 0; slot < 9; slot++) {
            if (tHeroItems[slot] && !tHeroItems[slot].IsCombineLocked()) GameRules.ItemShare.lockItem(tBZItems[slot]);
        }
        // 修正兵卒属性
        ParaAdjuster.ModifyBzAttribute(BZ);
        // 修正英雄蓝量属性
        const curMana = this.m_eHero.GetMana();
        Timers.CreateTimer(0.01, () => {
            ParaAdjuster.ModifyMana(this.m_eHero);
            this.m_eHero.SetMana(curMana);
        });
    }

    // TODO: Card
    // =============卡牌================

    /**是否拥有某卡牌 */
    isHasCard(nCardID: number) {
        for (const card of this.m_tabHasCard) {
            if (nCardID == card.m_nID) return true;
        }
        return false;
    }

    /**添加卡牌 */
    setCardAdd(card: Card) {
        if (this.isHasCard(card.m_nID)) return false;

        card.setOwner(this.m_nPlayerID);
        this.m_tabHasCard.push(card);

        // TODO: 验证json数据，并检查双端通信
        print('===setCardAdd===:');
        print(json.encode(card.encodeJsonData()));
        print('===setCardAdd====');
        // 通知客户端获得卡牌
        this.sendMsg('S2C_GM_CardAdd', {
            nPlayerID: this.m_nPlayerID,
            json: json.encode(card.encodeJsonData()),
        });
        this.setCardCanCast();

        // 同步玩家网表信息
        this.setNetTableInfo();
        return true;
    }

    /**删除卡牌 */
    setCardDel(card: Card) {}

    /**设置可用卡牌 */
    setCardCanCast() {
        const tCanCast: number[] = [];
        for (const card of this.m_tabHasCard) {
            if (card) {
                if (card.CanUseCard()) tCanCast.push(card.m_nID);
            }
        }
        // 设置网表
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        let info = CustomNetTables.GetTableValue('GamingTable', keyname);
        info.tabCanCastCard = tCanCast;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);
    }

    // 发送手牌数据给客户端
    sendHandCardData() {
        // let jsonData = []
        // for (const value of this.m_tabHasCard) {
        // }
    }

    /**设置技能缩减 */
    setCDSub(nValue: number) {
        this.m_nCDSub = nValue;
        // 设置网表
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        const info = CustomNetTables.GetTableValue('GamingTable', keyname);
        info.nCDSub = this.m_nCDSub;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);
    }

    /**设置耗魔减缩 */
    setManaSub(nValue: number) {
        this.m_nManaSub = nValue;

        // 更新卡牌蓝耗
        // TODO:

        // 设置卡牌可否释放
        this.setCardCanCast();

        // 设置网表
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        const info = CustomNetTables.GetTableValue('GamingTable', keyname);
        info.nManaSub = this.m_nManaSub;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);
    }

    /**全军查找物品 */
    getItemFromAllByName(itemName: string, itemIgnore) {
        let item = this.get09ItemByName(itemName, itemIgnore);
        if (item) {
            return item;
        }
        for (const v of this.m_tabBz) {
            item = v.get09ItemByName(itemName, itemIgnore);
            if (item) {
                return item;
            }
        }
    }

    /**获取单位物品栏6格中的物品用名字 */
    get06ItemByName(sName: string, itemIgnore) {
        for (let i = 0; i < 6; i++) {
            const item = this.m_eHero.GetItemInSlot(i);
            if (item && item != itemIgnore && !item.IsNull() && item.GetAbilityName() == sName) {
                return item;
            }
        }
    }

    /**获取单位物品栏加背包9格中的物品用名字 */
    get09ItemByName(sName: string, itemIgnore) {
        if (IsValid(this.m_eHero)) {
            for (let i = 0; i < 9; i++) {
                const item = this.m_eHero.GetItemInSlot(i);
                if (item && item != itemIgnore && !item.IsNull() && item.GetAbilityName() == sName) {
                    return item;
                }
            }
        }
    }

    /**设置断线 */
    setDisconnect(bVal: boolean) {
        // 设置网表
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        const info = CustomNetTables.GetTableValue('GamingTable', keyname);
        info['bDisconnect'] = bVal ? 1 : 0;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);

        this.m_bDisconnect = bVal;
        this.updateCtrl();
    }

    /**更新控制权限 */
    updateCtrl() {
        let nCtrlID: PlayerID;
        if (this.m_bDisconnect) nCtrlID = -1;
        else nCtrlID = this.m_nPlayerID;
        if (this.m_eHero != null) this.m_eHero.SetControllableByPlayer(nCtrlID, true);
        for (const v of Object.values(this.m_tabBz)) {
            if (v != null) v.SetControllableByPlayer(nCtrlID, true);
        }
    }

    /**增加击杀数 */
    setKillCountAdd(nValue: number) {
        this.m_nKill += nValue;
        // 设置网表
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        const info = CustomNetTables.GetTableValue('GamingTable', keyname);
        info.nKill = this.m_nKill;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);
    }

    /**增加攻城数 */
    setGCLDCountAdd(nValue: number) {
        this.m_nGCLD += nValue;
        // 设置网表
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        const info = CustomNetTables.GetTableValue('GamingTable', keyname);
        info.nGCLD = this.m_nGCLD;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);
    }

    /**设置购物状态 */
    setBuyState(buyState: number, nCount: number) {
        // 可购物事件
        const event = {
            nCount: nCount,
            buyState: buyState,
            player: this,
        };
        GameRules.EventManager.FireEvent('Event_SetBuyState', event);
        this.m_nBuyItem = event.nCount;
        this.m_typeBuyState = event.buyState;

        // 设置网表
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        const info = CustomNetTables.GetTableValue('GamingTable', keyname);
        info.nBuyItem = this.m_nBuyItem;
        info.typeBuyState = this.m_typeBuyState;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);
    }

    /**购买装备 */
    getItemBuy(itemName: string) {
        this.m_nBuyItem -= 1;
        this.m_eHero.AddItemByName(itemName);
        this.setGold(-GetItemCost(itemName));
        GameRules.GameConfig.showGold(this, -GetItemCost(itemName));

        // 设置网表
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        const info = CustomNetTables.GetTableValue('GamingTable', keyname);
        info.nBuyItem = this.m_nBuyItem;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);

        // 计算总资产
        this.setSumGold();
    }

    /**增加经验 */
    setExpAdd(nVal: number) {
        const nAddExp = nVal;
        const nCurExp = this.m_eHero.GetCurrentXP();
        const nLevelUpExp = LEVEL_EXP[this.m_eHero.GetLevel() + 1];
        this.m_eHero.AddExperience(nAddExp, 0, false, false);

        if (nLevelUpExp && nCurExp + nAddExp >= nLevelUpExp) {
            // 升级,触发属性变更
            GameRules.EventManager.FireEvent('Event_SxChange', { entity: this.m_eHero, bonus_mana: this.m_nManaMaxBase });
            // 修改回蓝回血为0
            Timers.CreateTimer(0.1, () => {
                this.updateRegen0();
            });
            // 整化魔法数值
            Timers.CreateTimer(0.05, () => {
                this.setPlayerMana(math.floor(this.m_eHero.GetMana() + 0.5));
            });
            // 清空技能点
            this.m_eHero.SetAbilityPoints(0);
            // 设置技能等级
            const nLevel = math.floor(this.m_eHero.GetLevel() * 0.1) + 1;
            this.m_eHero.GetAbilityByIndex(0).SetLevel(nLevel);
            this.m_eHero.GetAbilityByIndex(1).SetLevel(nLevel);

            // 更新全部兵卒等级
            this.m_tabBz.forEach(eBZ => {
                this.setBzLevelUp(eBZ);
            });
        }
    }

    updateRegen0() {
        this.m_eHero.SetBaseManaRegen(0);
        this.m_eHero.SetBaseManaRegen(-this.m_eHero.GetManaRegen());
        this.m_eHero.SetBaseHealthRegen(0);
        this.m_eHero.SetBaseHealthRegen(-this.m_eHero.GetHealthRegen());
    }

    /**注册触发事件 */
    registerEvent(): void {
        GameRules.EventManager.Register('Event_OnDamage', (event: DamageEvent) => this.onEvent_OnDamage(event), this, -987654321);
        GameRules.EventManager.Register('Event_Atk', (event: DamageEvent) => this.onEvent_Atk_bzHuiMo(event), this);
        GameRules.EventManager.Register(
            'Event_PlayerRoundBegin',
            (event: { oPlayer: Player; bRoll: boolean }) => this.onEvent_PlayerRoundBegin(event),
            this
        );
        GameRules.EventManager.Register('Event_UpdateRound', () => this.onEvent_UpdateRound(), this);
        GameRules.EventManager.Register('Event_Move', (event: { entity: CDOTA_BaseNPC_Hero }) => this.onEvent_Move(event), this);
        GameRules.EventManager.Register('Event_PlayerDie', (event: { player: Player }) => this.onEvent_PlayerDie(event), this);
        GameRules.EventManager.Register(
            'Event_HeroManaChange',
            (event: { player: Player; oAblt?: TSBaseAbility }) => this.onEvent_HeroManaChange(event),
            this
        );
    }

    /**受伤 */
    onEvent_OnDamage(event: DamageEvent) {
        // print("===onEvent_OnDamage===")
        // print("===onEvent_OnDamage===", EntIndexToHScript(event.entindex_victim_const).GetName())
        // print("===onEvent_OnDamage===damage:", event.damage)
        // print("===onEvent_OnDamage===damagetype:", event.damagetype_const)
        // print("===onEvent_OnDamage===bIgnore:", event.bIgnore)
        // print("===onEvent_OnDamage===bIgnoreGold:", event.bIgnoreGold)
        // print("===onEvent_OnDamage===bIgnoreDamageSelf:", event.bIgnoreDamageSelf)
        // print("===onEvent_OnDamage===bIgnoreBZHuiMo:", event.bIgnoreBZHuiMo)
        if (event.bIgnore) return;

        // 受伤者
        const oVictim = EntIndexToHScript(event.entindex_victim_const) as CDOTA_BaseNPC;
        const oPlayerVict = GameRules.PlayerManager.getPlayer(oVictim.GetPlayerOwnerID());
        if (IsValid(oVictim) && (oVictim == this.m_eHero || this.hasBZ(oVictim))) {
            event.bIgnore = true;
            event.damage = math.ceil(event.damage);

            // 攻击者
            const oAttacker = EntIndexToHScript(event.entindex_attacker_const) as CDOTA_BaseNPC;
            let oPlayerAtk: Player;
            if (IsValid(oAttacker)) {
                this.m_nLastAtkPlayerID = oAttacker.GetPlayerOwnerID();
                this.m_nRoundDamage += event.damage;
                oPlayerAtk = GameRules.PlayerManager.getPlayer(oAttacker.GetPlayerOwnerID());
                // 统计伤害
                if (oPlayerAtk) {
                    if (oAttacker.IsRealHero()) {
                        oPlayerAtk.m_nDamageHero += event.damage;
                    } else {
                        oPlayerAtk.m_nDamageBZ += event.damage;
                    }
                }
            }

            if (event.damage > 0) {
                // 扣钱
                if (!event.bIgnoreGold) {
                    // 自身设置金币
                    if (!(oPlayerAtk == this && event.bIgnoreDamageSelf)) {
                        this.setGold(-event.damage);
                        GameRules.GameConfig.showGold(this, -event.damage);
                        GameRules.EventManager.FireEvent('Event_ChangeGold_Atk', {
                            player: this,
                            nGold: -event.damage,
                        });
                    }

                    print('debug oPlayerAtk != self is ', oPlayerAtk != this);
                    print('debug oPlayerAtk', oAttacker.GetPlayerOwnerID());

                    // 攻击者是敌人，给敌人玩家设置金币
                    if (oPlayerAtk && oPlayerAtk != this) {
                        print('oPlayerAtk.setGold(event.damage)', event.damage);
                        oPlayerAtk.setGold(event.damage);
                        GameRules.GameConfig.showGold(oPlayerAtk, event.damage);
                        GameRules.EventManager.FireEvent('Event_ChangeGold_Atk', {
                            player: oPlayerAtk,
                            nGold: event.damage,
                        });
                    }
                }

                // 是否扣血
                if (!oAttacker.IsRealHero()) {
                    // 兵卒攻击不扣血
                    if (!oPlayerVict.m_bGCLD) {
                        print('非攻城略地,兵卒攻击不扣血 damage = 0');
                        event.damage = 0;
                    }
                }

                // 兵卒受伤回魔
                if (!oVictim.IsRealHero() && !event.bIgnoreBZHuiMo) {
                    // 计算回魔量
                    let tabEventHuiMo = {
                        eBz: oVictim,
                        nHuiMoBase: 1,
                    };
                    // 触发兵卒回魔事件
                    GameRules.EventManager.FireEvent('Event_BZHuiMo', tabEventHuiMo);
                    if (tabEventHuiMo.nHuiMoBase > 0) {
                        // 给兵卒回魔
                        oVictim.GiveMana(event.damage * BZ_HUIMO_BEATK_RATE * tabEventHuiMo.nHuiMoBase);
                    }
                }

                // 扣血
                let nHealth = oVictim.GetHealth() - event.damage;
                if (nHealth < 2) {
                    // 即将死亡,设置成1血
                    nHealth = 1;
                }
                oVictim.ModifyHealth(nHealth, null, false, 0);
            }
            event.damage = 0;
        }
    }

    /**兵卒造成伤害回魔 */
    onEvent_Atk_bzHuiMo(event: DamageEvent) {
        if (event.bIgnore || event.bIgnoreBZHuiMo) {
            return;
        }
        const eBZ = this.hasBZ(event.entindex_attacker_const) as CDOTA_BaseNPC_BZ;
        if (!eBZ) {
            return;
        }
        // 计算回魔量
        let nHuiMoRate = eBZ.IsRangedAttacker() ? BZ_HUIMO_RATE_Y : BZ_HUIMO_RATE_J;
        let tabEventHuiMo = {
            eBz: eBZ,
            nHuiMoBase: 1,
        };
        // 触发兵卒回魔事件
        GameRules.EventManager.FireEvent('Event_BZHuiMo', tabEventHuiMo);
        if (tabEventHuiMo.nHuiMoBase > 0) {
            // 给兵卒回魔
            eBZ.GiveMana(event.damage * nHuiMoRate * tabEventHuiMo.nHuiMoBase);
        }
    }

    /**玩家回合开始 */
    onEvent_PlayerRoundBegin(event: { oPlayer: Player; bRoll: boolean }) {
        this.setCardCanCast();

        if (event.oPlayer != this) return;

        // 提高英雄魔法上限
        if (GameRules.GameConfig.m_nRound < 11) {
            this.m_nManaMaxBase += 1;
            ParaAdjuster.ModifyMana(this.m_eHero);
            print('===RoundBegin===m_nManaMaxBase += 1===name:', event.oPlayer.m_eHero.GetName());
        }
        // 英雄回蓝
        const tabEventHuiMo = {
            oPlayer: this,
            nHuiMo: 1,
        };
        // 触发英雄回魔在回合开始
        GameRules.EventManager.FireEvent('Event_HeroHuiMoByRound', tabEventHuiMo);
        this.givePlayerMana(tabEventHuiMo.nHuiMo);

        // 英雄回血
        let tabEventHuiXue = {
            entity: this.m_eHero,
            nHuiXue: this.m_eHero.GetMaxHealth() * ROUND_HERO_HUIXUE_ROTA,
        };
        GameRules.EventManager.FireEvent('Event_ItemHuiXueByRound', tabEventHuiXue);
        this.addHealth(tabEventHuiXue.nHuiXue);

        // 兵卒回血
        for (const eBZ of this.m_tabBz) {
            let tabEventBZHuiXue = {
                entity: eBZ,
                nHuiXue: eBZ.GetMaxHealth() * ROUND_BZ_HUIXUE_ROTA,
            };
            GameRules.EventManager.FireEvent('Event_ItemHuiXueByRound', tabEventBZHuiXue);
            eBZ.SetHealth(eBZ.GetHealth() + tabEventBZHuiXue.nHuiXue);
        }
    }

    /**游戏回合更新 */
    onEvent_UpdateRound() {
        // 重置玩家回合结束的记录
        this.setRoundFinished(false);
        const nRound = GameRules.GameConfig.m_nRound;
        if (nRound > 1) {
            // 加经验
            const nAddExp = 1 + math.floor(nRound / 10);
            this.setExpAdd(nAddExp);
        }
        print('===onEvent_UpdateRound');
        this.m_nRoundDamage = 0;
    }

    /**玩家魔法修改 */
    onEvent_HeroManaChange(event: { player: Player; oAblt?: TSBaseAbility }) {
        if (event.player == this) {
            // 设置卡牌可否释放
            this.setCardCanCast();
        }
    }

    /**玩家移动 */
    onEvent_Move(event: { entity: CDOTA_BaseNPC_Hero }) {
        if (event.entity != this.m_eHero) {
            // 其他玩家在移动
            const tEventID: number[] = [];

            // 设置兵卒攻击,英雄魔免物免
            let nState = PS_AtkBZ;
            if (0 == bit.band(PS_AtkMonster + PS_AtkHero, this.m_nPlayerState)) {
                nState += PS_PhysicalImmune;
            } else {
                tEventID.push(
                    GameRules.EventManager.Register('Event_GCLDEnd', tEvent => {
                        if (tEvent.entity == this.m_eHero) {
                            nState += PS_PhysicalImmune;
                            this.setPlayerState(PS_PhysicalImmune);
                            return true;
                        }
                    })
                );
                tEventID.push(
                    GameRules.EventManager.Register('Event_AtkMosterEnd', tEvent => {
                        if (tEvent.entity == this.m_eHero) {
                            nState += PS_PhysicalImmune;
                            this.setPlayerState(PS_PhysicalImmune);
                            return true;
                        }
                    })
                );
            }
            this.setPlayerState(nState);

            // 设置兵卒攻击目标
            this.setAllBzAtker(event.entity, false);
            // 监听兵卒创建继续设置目标
            tEventID.push(
                GameRules.EventManager.Register('Event_BZCreate', (tEvent: { entity: CDOTA_BaseNPC_BZ }) => {
                    if (tEvent.entity.GetPlayerOwnerID() == this.m_nPlayerID && 0 < bit.band(PS_AtkBZ, this.m_nPlayerState)) {
                        this.setBzAtker(tEvent.entity, event.entity, false);
                    }
                })
            );

            // 监听移动结束: 结束攻击
            GameRules.EventManager.Register('Event_MoveEnd', () => {
                this.setPlayerState(-nState);
                this.setAllBzAtker(event.entity, true);
                GameRules.EventManager.UnRegisterByIDs(tEventID);
                return true;
            });
        } else {
            // 自己移动, 记录移动中金币的变化
            let nGold = 0;
            function onEvent_ChangeGold(goldEvent: { nGold: number; player: Player }) {
                if (goldEvent.player == this) {
                    nGold += goldEvent.nGold;
                }
            }
            GameRules.EventManager.Register('Event_ChangeGold_Atk', (goldEvent: { nGold: number; player: Player }) => onEvent_ChangeGold(goldEvent));
            GameRules.EventManager.Register('Event_MoveEnd', (moveEndEvent: { entity: CDOTA_BaseNPC_Hero }) => {
                if (moveEndEvent.entity == this.m_eHero) {
                    GameRules.EventManager.UnRegister('Event_ChangeGold_Atk', (goldEvent: { nGold: number; player: Player }) =>
                        onEvent_ChangeGold(goldEvent)
                    );
                    if (nGold != 0) {
                        // TODO: GameRecord.setGameRecord 游戏记录
                    }
                    return true;
                }
            });
        }
    }

    /**玩家死亡 */
    onEvent_PlayerDie(event: { player: Player }) {
        if (event.player != this) {
            if (event.player.m_nLastAtkPlayerID == this.m_nPlayerID) {
                this.setKillCountAdd(1);
            }
            return;
        }

        this.m_bDie = true;
        this.setPlayerState(PS_Die);
        // 设置网表
        const keyname = ('player_info_' + this.m_nPlayerID) as player_info;
        const info = CustomNetTables.GetTableValue('GamingTable', keyname);
        info.bDie = 1;
        CustomNetTables.SetTableValue('GamingTable', keyname, info);

        this.setPlayerState(PS_Pass);
        this.SetWageGold(0);

        if (this.m_tabMyPath) {
            for (const pathType in this.m_tabMyPath) {
                for (const path of this.m_tabMyPath[pathType]) {
                    this.setMyPathDel(path);
                }
            }
        }

        if (this.m_eHero) {
            this.m_eHero.SetRespawnsDisabled(true);
            this.m_eHero.ForceKill(true);
        }

        GameRules.EventManager.UnRegister('Event_OnDamage', (event: DamageEvent) => this.onEvent_OnDamage(event));
        GameRules.EventManager.UnRegister('Event_Atk', (event: DamageEvent) => this.onEvent_Atk_bzHuiMo(event));
        GameRules.EventManager.UnRegister('Event_PlayerRoundBegin', (event: { oPlayer: Player; bRoll: boolean }) =>
            this.onEvent_PlayerRoundBegin(event)
        );
        GameRules.EventManager.UnRegister('Event_UpdateRound', () => this.onEvent_UpdateRound());
        GameRules.EventManager.UnRegister('Event_Move', (event: { entity: CDOTA_BaseNPC_Hero }) => this.onEvent_Move(event));

        // 音效
        EmitGlobalSound('Custom.Killed');
        return true;
    }
}
