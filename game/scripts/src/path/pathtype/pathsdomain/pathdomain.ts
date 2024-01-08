import {
    PATH_TO_PRICE,
    PATH_TOLL_RATE,
    HERO_TO_BANNER,
    TypePathState,
    GAME_MODE,
    GAME_MODE_ONEPATH,
    BZ_OUT_ROUND,
    GCLD_EXP,
    GCLD_GOLD,
} from '../../../constants/constant';
import { GS_Begin, PS_AtkHero, PS_InPrison, TypeOprt } from '../../../constants/gamemessage';
import { modifier_unselect } from '../../../modifiers/util/modifier_unselect';
import { CDOTA_BaseNPC_BZ } from '../../../player/CDOTA_BaseNPC_BZ';
import { DamageEvent, Player } from '../../../player/player';
import { AMHC, IsValid } from '../../../utils/amhc';
import { ParaAdjuster } from '../../../utils/paraadjuster';
import { Path } from '../../path';

/**
 * 领地路径
 */
export class PathDomain extends Path {
    m_tabENPC: CDOTA_BaseNPC_BZ[]; // 路径上的全部NPC实体（城池的兵卒）
    m_eCity: CDOTA_BaseNPC_Building; // 建筑点实体
    m_eBanner: CBaseModelEntity; // 横幅旗帜实体
    m_nPrice: number; // 价值
    m_nOwnerID: number; // 领主玩家ID
    m_nPlayerIDGCLD: number; // 正在攻城玩家ID
    m_nPtclIDGCLD: ParticleID; // 攻城特效ID
    m_tEventIDGCLD: number[]; // 攻城事件ID数组

    constructor(entity: CBaseEntity) {
        super(entity);

        this.m_eCity = Entities.FindByName(null, 'city_' + this.m_nID) as CDOTA_BaseNPC_Building;
        this.m_eCity.AddNewModifier(null, null, modifier_unselect.name, null);
        this.m_eBanner = Entities.FindByName(null, 'bann_' + this.m_nID) as CBaseModelEntity;
        this.setBanner();

        this.m_nPrice = PATH_TO_PRICE[this.m_typePath];

        this.m_tabENPC = [];

        GameRules.EventManager.Register(
            'Event_PlayerRoundBefore',
            (event: { typeGameState: number }) => this.onEvent_PlayerRoundBefore(event),
            this,
            -987654321
        );
        GameRules.EventManager.Register('Event_FinalBattle', () => this.Event_FinalBattle());
        GameRules.EventManager.Register('Event_PlayerDie', (event: { player: Player }) => this.Event_PlayerDie(event), this, 10000);
        GameRules.EventManager.Register('Event_BZLevel', (event: { eBZNew: CDOTA_BaseNPC_BZ; eBZ: CDOTA_BaseNPC_BZ }) => this.Event_BZLevel(event));
    }

    /**触发路径 */
    onPath(player: Player): void {
        super.onPath(player);

        if (this.m_nOwnerID == null) {
            // 无主之地,发送安营扎寨操作
            const tabOprt = {
                nPlayerID: player.m_nPlayerID,
                typeOprt: TypeOprt.TO_AYZZ,
                typePath: this.m_typePath,
                nPathID: this.m_nID,
            };
            // 操作前处理上一个(如果有的话)
            GameRules.GameConfig.autoOprt(tabOprt.typeOprt, player);
            GameRules.GameConfig.sendOprt(tabOprt);
            print('======发送安营扎寨操作======');
        } else if (this.m_nOwnerID != player.m_nPlayerID) {
            // 非己方城池
            const playerOwn = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
            // 领主未进监狱
            if (0 === (PS_InPrison & playerOwn.m_nPlayerState)) {
                if (this.m_tabENPC.length == 0) {
                    // 交过路费
                    const nGold = math.floor(this.m_nPrice * PATH_TOLL_RATE);
                    player.giveGold(nGold, playerOwn);
                    GameRules.GameConfig.showGold(playerOwn, nGold);
                    GameRules.GameConfig.showGold(player, -nGold);
                    // 给钱音效
                    EmitGlobalSound('Custom.Gold.Sell');
                } else {
                    // 有兵卒的城池,发送攻城略地操作
                    if (this.m_tabENPC[0].IsInvisible() || this.m_tabENPC[0].IsStunned()) {
                        // 兵卒隐身,眩晕无法攻城
                        return;
                    }
                    const tabEvent = {
                        entity: player.m_eHero,
                        path: this,
                        bIgnore: false,
                    };
                    GameRules.EventManager.FireEvent('Event_GCLDReady', tabEvent);
                    if (tabEvent.bIgnore) return;
                    const tabOprt = {
                        nPlayerID: player.m_nPlayerID,
                        typeOprt: TypeOprt.TO_GCLD,
                        typePath: this.m_typePath,
                        nPathID: this.m_nID,
                    };
                    // 操作前处理上一个(如果有的话)
                    GameRules.GameConfig.autoOprt(tabOprt.typeOprt, player);
                    GameRules.GameConfig.sendOprt(tabOprt);
                    GameRules.EventManager.Register('Event_CurPathChange', (event: { player: Player }) => {
                        if (event.player == player && this != player.m_pathCur) {
                            GameRules.GameConfig.autoOprt(TypeOprt.TO_GCLD, player);
                        }
                    });
                }
            }
        }
    }

    /** 设置横幅旗帜 */
    setBanner(strHeroName?: string) {
        // strHeroName为空就表示隐藏旗帜
        if (strHeroName == null) {
            this.m_eBanner.SetOrigin((this.m_eCity.GetOrigin() - Vector(0, 0, 1000)) as Vector);
        } else {
            this.m_eBanner.SetOrigin(this.m_eCity.GetOrigin());
            print('SetSkin====strHeroName:', strHeroName);
            this.m_eBanner.SetSkin(HERO_TO_BANNER[strHeroName] + 1);
        }
    }

    /**设置领主 */
    setOwner(oPlayer?: Player, bSetBZ?: boolean) {
        bSetBZ = bSetBZ || true;

        let nOwnerIDLast = this.m_nOwnerID;
        if (oPlayer == null) {
            this.setPathState(TypePathState.None);
            // 移除领主
            this.setBanner();
            this.m_nOwnerID = null;
        } else {
            print('=====设置领主======');
            print('oPlayer.m_eHero.GetUnitName()', oPlayer.m_eHero.GetUnitName());
            // 设置新领主
            this.setBanner(oPlayer.m_eHero.GetUnitName());
            this.m_nOwnerID = oPlayer.m_nPlayerID;
            // 占领音效
            StartSoundEvent('Custom.AYZZ', oPlayer.m_eHero);
        }
        if (nOwnerIDLast) {
            this.setBuff(GameRules.PlayerManager.getPlayer(nOwnerIDLast));
        }
        if (bSetBZ) {
            this.setBZ();
        }
        GameRules.EventManager.FireEvent('Event_PathOwnChange', {
            path: this,
            nOwnerIDLast: nOwnerIDLast,
        });
    }

    /**设置起兵 */
    setBZ() {
        print('=====设置起兵======');
        if (this.m_nOwnerID == null) {
            print('setBZ===1');
            // 无领主
            if (this.m_tabENPC.length > 0) {
                print('setBZ===2');
                // 有兵卒
                this.setAllBZDel();
            }
        } else {
            print('setBZ===3');
            // 有领主
            const oPlayer = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
            if (!oPlayer) {
                print('setBZ===4');
                return;
            }
            if (GAME_MODE == GAME_MODE_ONEPATH) {
                print('setBZ===5');
                // 单地起兵模式
                if (GameRules.GameConfig.m_nRound >= BZ_OUT_ROUND) {
                    if (this.m_tabENPC.length > 0) {
                        if (oPlayer.m_nPlayerID != this.m_tabENPC[0].GetPlayerOwnerID()) {
                            this.setAllBZDel();
                            oPlayer.createBZOnPath(this, 1);
                        }
                    } else {
                        oPlayer.createBZOnPath(this, 1);
                    }
                    this.setBanner();
                    this.setBuff(oPlayer);
                } else {
                    // 监听起兵回合
                    GameRules.EventManager.Register('Event_UpdateRound', () => {
                        if (GameRules.GameConfig.m_nRound >= BZ_OUT_ROUND) {
                            if (!GameRules.GameConfig.m_bOutBZ) {
                                GameRules.GameConfig.m_bOutBZ = true;
                                print('======起兵=======');
                                EmitGlobalSound('Custom.AYZZ.All');
                            }
                            if (this.m_nOwnerID == oPlayer.m_nPlayerID && !this.m_tabENPC[0]) {
                                oPlayer.createBZOnPath(this, 1);
                                this.setBanner();
                                this.setBuff(oPlayer);
                            }
                            return true;
                        }
                    });
                }
            }
        }
    }

    /**移除全部兵卒 */
    setAllBZDel() {
        for (let i = 0; i < this.m_tabENPC.length; i++) {
            if (this.m_tabENPC[i] && !this.m_tabENPC[i].IsNull()) {
                const player = GameRules.PlayerManager.getPlayer(this.m_tabENPC[i].GetPlayerOwnerID());
                if (player) {
                    player.removeBz(this.m_tabENPC[i]);
                }
            } else {
                this.m_tabENPC.splice(i, 1);
            }
        }
    }

    /**设置领地BUFF */
    setBuff(oPlayer: Player) {
        print('===setBuff===0');
        this.delBuff(oPlayer);
        // 获取路径等级
        const nLevel = this.getPathBuffLevel(oPlayer);
        print('===setBuff===nLevel:', nLevel);
        if (!nLevel || nLevel <= 0) return;

        // 添加buff
        const strBuff = this.getBuffName(nLevel);
        const oAblt = AMHC.AddAbilityAndSetLevel(oPlayer.m_eHero, strBuff, nLevel);
        oAblt.SetLevel(nLevel);
        ParaAdjuster.ModifyMana(oPlayer.m_eHero);
        print('===setBuff===End');
    }

    /**移除领地BUFF */
    delBuff(oPlayer: Player) {
        print('===delBuff===0');
        for (let i = 1; i <= 3; i++) {
            const strBuffName = this.getBuffName(i);
            if (oPlayer.m_eHero.HasAbility(strBuffName)) {
                // 触发事件：领地技能移除
                GameRules.EventManager.FireEvent('Event_PathBuffDel', { oPlayer: oPlayer, path: this, sBuffName: strBuffName });
                // 移除英雄buff技能
                AMHC.RemoveAbilityAndModifier(oPlayer.m_eHero, strBuffName);
            }
        }
        print('===delBuff===End');
    }

    /**获取领地BUFFName */
    getBuffName(nLevel: number) {
        return 'path_' + this.m_typePath;
    }

    /**计算玩家领地buff等级 */
    getPathBuffLevel(oPlayer: Player) {
        const tabPath = GameRules.PathManager.getPathByType(this.m_typePath) as PathDomain[];

        const tabBZLevelCount = [, 0, 0, 0];
        for (const v of tabPath) {
            if (IsValid(v.m_tabENPC[0]) && v.m_nOwnerID == oPlayer.m_nPlayerID) {
                const nLevelTemp = oPlayer.getBzStarLevel(v.m_tabENPC[0]);
                if (!tabBZLevelCount[nLevelTemp]) {
                    tabBZLevelCount[nLevelTemp] = 0;
                }
                tabBZLevelCount[nLevelTemp]++;
            }
        }
        // 3级buff是3格3星, 2级2格2星...
        let nSum = 0;
        for (let i = 3; i >= 1; i--) {
            nSum += tabBZLevelCount[i];
            if (nSum >= i) {
                return i;
            }
        }
    }

    /**设置攻城双方攻击 */
    setAttacking(entity: CDOTA_BaseNPC_BZ) {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.m_nPlayerIDGCLD);
        const oPlayerOwn = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
        if (oPlayer && oPlayerOwn && IsValid(entity)) {
            for (const v of this.m_tabENPC) {
                if (v == entity) {
                    entity.setBattleState(true);
                    oPlayer.m_bGCLD = true;
                    oPlayerOwn.setBzAttack(entity, true);
                    oPlayerOwn.setBzAtker(entity, oPlayer.m_eHero);
                    oPlayerOwn.setBzBeAttack(entity, true);
                    oPlayer.m_eHero.MoveToTargetToAttack(entity);
                }
            }
        }
    }

    /**玩家攻城 */
    atkCity(oPlayer: Player) {
        if (!this.m_tabENPC[0] || this.m_tabENPC[0].IsNull() || this.m_nPlayerIDGCLD || this.m_tabENPC[0].m_bBattle) {
            print('===PathDomain atkCity error: BZ null or invalid');
            return;
        }
        this.m_tEventIDGCLD = [];

        oPlayer.m_bGCLD = true;
        this.m_nPlayerIDGCLD = oPlayer.m_nPlayerID;

        // 设置兵卒攻击
        this.m_tabENPC[0].setBattleState(true);

        oPlayer.setPlayerState(PS_AtkHero);

        // 移动到兵卒前
        oPlayer.moveToPos((this.m_eCity.GetAbsOrigin() + this.m_eCity.GetForwardVector() * 100) as Vector, (bSuccess: boolean) => {
            if (!bSuccess || this.m_nPlayerIDGCLD != oPlayer.m_nPlayerID) {
                print('===PathDomain atkCity error: moveToPos error');
                return;
            }

            // 设置双方攻击
            this.setAttacking(this.m_tabENPC[0]);

            // 决斗特效
            this.m_nPtclIDGCLD = AMHC.CreateParticle(
                'particles/units/heroes/hero_legion_commander/legion_duel_ring.vpcf',
                ParticleAttachment.ABSORIGIN,
                false,
                oPlayer.m_eHero
            );
            ParticleManager.SetParticleControlOrientation(
                this.m_nPtclIDGCLD,
                0,
                oPlayer.m_eHero.GetForwardVector(),
                oPlayer.m_eHero.GetRightVector(),
                oPlayer.m_eHero.GetUpVector()
            );

            // 音效
            EmitSoundOn('Hero_LegionCommander.Duel', oPlayer.m_eHero);
        });

        // 监听双方受伤事件
        this.m_tEventIDGCLD.push(
            GameRules.EventManager.Register(
                'Event_OnDamage',
                (event: DamageEvent) => {
                    let e;
                    if (this.m_tabENPC[0].GetEntityIndex() == event.entindex_victim_const) {
                        e = this.m_tabENPC[0];
                    } else if (oPlayer.m_eHero.GetEntityIndex() == event.entindex_victim_const) {
                        e = oPlayer.m_eHero;
                    } else {
                        return;
                    }
                    // 攻城时不扣钱
                    event.bIgnoreGold = true;
                    if (event.damage >= e.GetHealth()) {
                        print('===atkCity finish===bWin:', e == this.m_tabENPC[0]);
                        // 一方死亡，战斗结束
                        event.damage = 0;
                        this.atkCityEnd(e == this.m_tabENPC[0]);

                        // 英雄死亡回满血
                        if (e == oPlayer.m_eHero) {
                            oPlayer.m_eHero.ModifyHealth(oPlayer.m_eHero.GetMaxHealth(), null, false, 0);
                        }
                    }
                },
                this,
                10000
            )
        );

        // 设置游戏记录
        // TODO:

        // 攻城事件
        GameRules.EventManager.FireEvent('Event_GCLD', {
            entity: oPlayer.m_eHero,
            path: this,
        });

        // 监听行为终止
        this.m_tEventIDGCLD.push(
            GameRules.EventManager.Register('Event_ActionStop', (event: { entity: CDOTA_BaseNPC; bMoveBack?: boolean }) => {
                if (event.entity == oPlayer.m_eHero) {
                    // 攻城方被中断，不移动
                    oPlayer.moveStop();
                    this.atkCityEnd(false, event.bMoveBack || false);
                } else if (!event.entity.IsRealHero() && event.entity.GetPlayerOwnerID() == this.m_nOwnerID) {
                    // 被攻城方中断，攻城者移动回去
                    oPlayer.moveStop();
                    this.atkCityEnd(false, event.bMoveBack || true);
                }
            })
        );
    }

    /**玩家攻城结束 */
    atkCityEnd(bWin: boolean, bMoveBack?: boolean) {
        if (bWin == null) bWin = false;
        if (bMoveBack == null) bMoveBack = true;

        const oPlayerOwn = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
        if (!this.m_nPlayerIDGCLD) return;
        const oPlayer = GameRules.PlayerManager.getPlayer(this.m_nPlayerIDGCLD);
        // 销毁特效
        if (this.m_nPtclIDGCLD) {
            ParticleManager.DestroyParticle(this.m_nPtclIDGCLD, false);
            this.m_nPtclIDGCLD = null;
        }
        StopSoundOn('Hero_LegionCommander.Duel', oPlayer.m_eHero);

        // 解除事件
        GameRules.EventManager.UnRegisterByIDs(this.m_tEventIDGCLD);
        this.m_tEventIDGCLD = null;

        if (IsValid(this.m_tabENPC[0])) {
            this.m_tabENPC[0].setBattleState();
            oPlayer.m_bGCLD = null;
            oPlayerOwn.setBzAttack(this.m_tabENPC[0]);
            oPlayerOwn.setBzAtker(this.m_tabENPC[0], oPlayer.m_eHero, true);
            oPlayerOwn.setBzBeAttack(this.m_tabENPC[0], false);
        }

        // 无论成功失败,都给双方加经验
        const nLevelBZ = oPlayerOwn.getBzStarLevel(this.m_tabENPC[0]);
        const nExp = GCLD_EXP[nLevelBZ];
        oPlayer.setExpAdd(nExp);
        oPlayerOwn.setExpAdd(nExp);

        oPlayer.setPlayerState(-PS_AtkHero);
        // 英雄回到原位
        if (bMoveBack) {
            if (oPlayer.m_eHero.IsStunned()) {
                oPlayer.resetToPath();
            } else {
                oPlayer.moveToPos(this.getUsedPos(oPlayer.m_eHero), (bSuccess: boolean) => {
                    if (bSuccess) {
                        oPlayer.resetToPath();
                    }
                });
            }
        }

        oPlayer.m_bGCLD = null;

        const tGCLDEnd = {
            entity: oPlayer.m_eHero,
            path: this,
            bWin: bWin,
            bSwap: true,
        };
        // 攻城结束事件
        GameRules.EventManager.FireEvent('Event_GCLDEnd', tGCLDEnd);

        // 处理输赢
        if (tGCLDEnd.bWin) {
            // 攻城成功, 移除兵卒, 更换领主
            if (tGCLDEnd.bSwap) {
                oPlayerOwn.setMyPathDel(this);
                oPlayer.setMyPathAdd(this);
            }

            // 设置游戏记录
            // TODO:

            oPlayer.setGCLDCountAdd(1);

            AMHC.CreateParticle(
                'particles/units/heroes/hero_legion_commander/legion_commander_duel_victory.vpcf',
                ParticleAttachment.ABSORIGIN,
                false,
                oPlayer.m_eHero
            );
            EmitGlobalSound('Hero_LegionCommander.Victory');
        } else {
            // 攻城失败
            const nLevelBZ = oPlayerOwn.getBzStarLevel(this.m_tabENPC[0]);
            // 扣钱
            const nGold = GCLD_GOLD[nLevelBZ];
            oPlayer.giveGold(nGold, oPlayerOwn);
            GameRules.GameConfig.showGold(oPlayer, -nGold);
            GameRules.GameConfig.showGold(oPlayerOwn, nGold);

            // 设置游戏记录
            // TODO:

            EmitGlobalSound('Hero_LegionCommander.Duel.Cast');
        }

        this.m_nPlayerIDGCLD = null;
    }

    /** 玩家回合开始：结束攻城 */
    onEvent_PlayerRoundBefore(tabEvent: { typeGameState: number }) {
        if (this.m_nPlayerIDGCLD != GameRules.GameConfig.m_nOrderID || GS_Begin != tabEvent.typeGameState) return;

        const oPlayer = GameRules.PlayerManager.getPlayer(this.m_nPlayerIDGCLD);
        GameRules.GameLoop.m_bRoundBefore = true;

        // 监听玩家移动回路径
        function onMove(tabEvent2: { player: Player }) {
            if (tabEvent2.player == oPlayer) {
                // 如果要移动,游戏状态改为移动状态
                // 进入move时会设置m_bRoundBefore为true,此时GameLoop应该被拦截, 保持在RoundBefore
                GameRules.GameLoop.GameStateService.send('tomove');
                // 离开RoundBefore时, m_bRoundBefore置为null
                GameRules.EventManager.Register('Event_PlayerMoveEnd', (event3: { player: Player }) => {
                    if (event3.player == oPlayer) {
                        if (!oPlayer.m_bGCLD) return true;
                        print('===Event_PlayerMoveEnd===m_bGCLD', oPlayer.m_bGCLD);
                        // (攻城/打野可以持续到该玩家的新的一回合开始)  从GSMove到GSBegin
                        GameRules.GameLoop.GameStateService.send('tobegin');
                        return true;
                    }
                });
            }
            return true;
        }

        const eventID = GameRules.EventManager.Register('Event_PlayerMove', (event: { player: Player }) => onMove(event));
        this.atkCityEnd(false);
        GameRules.EventManager.UnRegisterByID(eventID, 'Event_PlayerMove');
    }

    /**玩家死亡：结束攻城 */
    Event_PlayerDie(event: { player: Player }) {
        if (this.m_nPlayerIDGCLD) {
            if (this.m_nPlayerIDGCLD == event.player.m_nPlayerID) {
                this.atkCityEnd(false, false);
            } else if (this.m_nOwnerID == event.player.m_nPlayerID) {
                this.atkCityEnd(true, true);
            }
        }
    }

    /**终局决战开启 */
    Event_FinalBattle() {
        if (!this.m_nOwnerID || this.m_tabENPC.length != 0) {
            return;
        }

        const player = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
        if (player) {
            return;
        }

        EmitGlobalSound('Custom.AYZZ');
        player.createBZOnPath(this, 1);
        this.setBanner();
    }

    /**兵卒升级 */
    Event_BZLevel(event: { eBZNew: CDOTA_BaseNPC_BZ; eBZ: CDOTA_BaseNPC_BZ }) {
        if (this.m_nPlayerIDGCLD && this.m_tabENPC.indexOf(event.eBZ) != -1) {
            print('===Event_BZLevel===');
            // 在攻城, 重新设置双方攻击
            this.setAttacking(event.eBZNew);
        }
    }
}
