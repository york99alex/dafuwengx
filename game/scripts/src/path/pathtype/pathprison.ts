import { PRISON_BAOZI_COUNT, GOLD_OUT_PRISON, TIME_OPERATOR_DISCONNECT, TIME_OPERATOR } from '../../constants/constant';
import { PS_InPrison, TypeOprt } from '../../constants/gamemessage';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';
import { Player } from '../../player/player';
import { AMHC, IsValid } from '../../utils/amhc';
import { Path } from '../path';

export class PathPrison extends Path {
    m_tabENPC: CDOTA_BaseNPC_Hero[] = null; // 路径上的全部NPC实体（监狱玩家）
    m_tabCount: number[] = null; // 玩家持续在监狱的次数记录
    m_eCity: CBaseEntity = null; // 建筑点实体
    m_eDoom: CDOTA_BaseNPC_Creature;

    constructor(entity: CBaseEntity) {
        super(entity);
        print('===PathPrison.create city_' + this.m_nID);
        this.m_eCity = Entities.FindByName(null, 'city_' + this.m_nID);
        this.initNilPos();
        this.m_tabENPC = [];
        this.m_tabCount = [];

        // 游戏开始生成恶鬼
        GameRules.EventManager.Register('Event_GameStart', () => {
            const orgin = (this.m_eCity.GetAbsOrigin() + Vector(-150, 130, 100)) as Vector;
            AMHC.CreateUnitAsync('prison_doom', orgin, Vector(100, -100, 0), null, DotaTeam.GOODGUYS, (eDoom: CDOTA_BaseNPC_Creature) => {
                this.m_eDoom = eDoom;
            });
            return true;
        });
        GameRules.EventManager.Register(
            'Event_Roll',
            (event: { bIgnore: 0 | 1; nNum1: number; nNum2: number; player: Player }) => this.onEvent_Roll(event),
            this
        );
        GameRules.EventManager.Register(
            'Event_PlayerRoundBegin',
            (event: { oPlayer: Player; bRoll: boolean; bIgnore?: boolean }) => this.onEvent_PlayerRoundBegin(event),
            this
        );
    }

    /**触发路径 */
    onPath(player: Player): void {
        super.onPath(player);

        // 玩家进入监狱
        this.setInPrison(player);
        // TODO:设置游戏记录
        // GameRecord:setGameRecord

        // 触发阎刃卡
        if (player.m_nRollMove == 1) {
            // TODO:
        }
    }

    // 入狱
    setInPrison(player: Player) {
        print('===PathPrison_setInPrison===0');
        GameRules.GameConfig.skipRoll(player.m_nPlayerID);

        // 中断其他行为
        player.moveStop();
        GameRules.EventManager.FireEvent('Event_ActionStop', { entity: player.m_eHero });

        // 设置到监狱
        this.m_tabENPC.push(player.m_eHero);

        if (player.m_pathCur != this) {
            player.blinkToPath(this);
        }
        player.m_eHero.SetAbsOrigin(this.getUsedPos(player.m_eHero, true));
        player.setPlayerState(PS_InPrison);

        // 设置动作, 添加监狱buff特效
        player.m_eHero.StartGesture(GameActivity.DOTA_FLAIL);
        AMHC.AddAbilityAndSetLevel(player.m_eHero, 'prison');
        for (const BZ of player.m_tabBz) {
            if (IsValid(BZ) && !BZ.m_bBattle) {
                BZ.StartGesture(GameActivity.DOTA_FLAIL);
                AMHC.AddAbilityAndSetLevel(BZ, 'prison');
            }
        }
        EmitGlobalSound('Hero_DoomBringer.ScorchedEarthAura');

        const tEventID: number[] = [];
        // 监听兵卒创建，更新监狱buff
        tEventID.push(
            GameRules.EventManager.Register('Event_BZCreate', (event: { entity: CDOTA_BaseNPC_BZ }) => {
                if (IsValid(event.entity) && event.entity.GetPlayerOwnerID() == player.m_nPlayerID) {
                    AMHC.AddAbilityAndSetLevel(event.entity, 'prison');
                    event.entity.StartGesture(GameActivity.DOTA_FLAIL);
                }
            })
        );
        // 监听攻城失败给兵卒更新监狱buff
        tEventID.push(
            GameRules.EventManager.Register('Event_PrisonOut', (event: { player: Player }) => {
                if (event.player == player) {
                    GameRules.EventManager.UnRegisterByIDs(tEventID);
                    return true;
                }
            })
        );
    }

    /**出狱 */
    setOutPrison(player: Player) {
        for (const hero of this.m_tabENPC) {
            if (hero == player.m_eHero) {
                this.m_tabENPC.splice(this.m_tabENPC.indexOf(hero), 1);

                player.blinkToPath(this);
                player.setPlayerState(-PS_InPrison);

                // 移除动作和buff特效
                player.m_eHero.RemoveGesture(GameActivity.DOTA_FLAIL);
                AMHC.RemoveAbilityAndModifier(player.m_eHero, 'prison');
                for (const BZ of player.m_tabBz) {
                    if (IsValid(BZ)) {
                        BZ.RemoveGesture(GameActivity.DOTA_FLAIL);
                        AMHC.RemoveAbilityAndModifier(BZ, 'prison');
                    }
                }

                this.m_tabCount[player.m_nPlayerID] = null;

                // 音效
                EmitGlobalSound('Custom.Respawn');
                // 重生特效
                AMHC.CreateParticle('particles/ui/ui_game_start_hero_spawn.vpcf', ParticleAttachment.POINT_FOLLOW, false, player.m_eHero, 5);

                // 触发事件
                GameRules.EventManager.FireEvent('Event_PrisonOut', { player: player });
                return;
            }
        }
    }

    /**是否在监狱 */
    isInPrison(nEIndex: EntityIndex) {
        for (const hero of this.m_tabENPC) {
            if (hero.GetEntityIndex() == nEIndex) return true;
        }
        return false;
    }

    /**获取罚款 */
    getFineGold(nCount: number) {
        if (nCount < 3) return 0;
        return 2 ** (nCount - 3) * 100;
    }

    onEvent_Roll(event: { bIgnore: 0 | 1; nNum1: number; nNum2: number; player: Player }) {
        if (this.isInPrison(event.player.m_eHero.GetEntityIndex())) {
            // 判断是否出狱
            event.bIgnore = 1;
            if (event.nNum1 == event.nNum2) {
                // 豹子出狱
                this.setOutPrison(event.player);
                // 发送Roll点操作
                GameRules.GameConfig.broadcastOprt({
                    typeOprt: TypeOprt.TO_Roll,
                    nPlayerID: event.player.m_nPlayerID,
                });
                // TODO:设置游戏记录
                // GameRecord:setGameRecord
            } else {
                // 不是豹子，不能移动，发送完成回合操作
                GameRules.GameConfig.broadcastOprt({
                    typeOprt: TypeOprt.TO_Finish,
                    nPlayerID: event.player.m_nPlayerID,
                });

                // 不出狱扣钱
                let nCount = this.m_tabCount[event.player.m_nPlayerID] || 0;
                nCount++;
                this.m_tabCount[event.player.m_nPlayerID] = nCount;
                const nGold = this.getFineGold(nCount);
                if (nGold > 0) {
                    event.player.m_nLastAtkPlayerID = -1; // 攻击者为系统
                    event.player.setGold(-nGold);
                    GameRules.GameConfig.showGold(event.player, -nGold);
                }
            }
        } else if (event.nNum1 == event.nNum2) {
            GameRules.GameConfig.m_nBaoZi++;
            if (GameRules.GameConfig.m_nBaoZi == PRISON_BAOZI_COUNT) {
                // 达到入狱豹子次数
                this.setInPrison(event.player);
                event.bIgnore = 1;
                // TODO:设置游戏记录
                // GameRecord:setGameRecord
                // 发送完成回合操作
                GameRules.GameConfig.broadcastOprt({
                    typeOprt: TypeOprt.TO_Finish,
                    nPlayerID: event.player.m_nPlayerID,
                });
            }
        }
    }

    onEvent_PlayerRoundBegin(event: { oPlayer: Player; bRoll: boolean; bIgnore?: boolean }) {
        if (event.bIgnore) {
            return;
        }
        if (!this.isInPrison(event.oPlayer.m_eHero.GetEntityIndex())) {
            return;
        }
        // 发送出狱操作
        const tabOprt = {
            nPlayerID: GameRules.GameConfig.m_nOrderID,
            typeOprt: TypeOprt.TO_PRISON_OUT,
            nGold: GOLD_OUT_PRISON,
        };
        GameRules.GameConfig.sendOprt(tabOprt);
        // 进入等待操作阶段
        GameRules.GameLoop.GameStateService.send('towaitoprt');

        if (event.oPlayer.m_bDisconnect) {
            GameRules.GameConfig.m_timeOprt = TIME_OPERATOR_DISCONNECT;
        } else {
            GameRules.GameConfig.m_timeOprt = TIME_OPERATOR;
        }
        // 取消roll操作
        event.bRoll = false;
    }

    initNilPos(): void {
        if (!IsValid(this.m_eCity)) {
            return;
        }
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_eCity.GetRightVector() * 40 + this.m_eCity.GetAbsOrigin()) as Vector,
        });
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_eCity.GetRightVector() * -40 + this.m_eCity.GetAbsOrigin()) as Vector,
        });
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_eCity.GetRightVector() * 40 + this.m_eCity.GetForwardVector() * 10 + this.m_eCity.GetAbsOrigin()) as Vector,
        });
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_eCity.GetRightVector() * -40 + this.m_eCity.GetForwardVector() * 10 + this.m_eCity.GetAbsOrigin()) as Vector,
        });
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_eCity.GetRightVector() * 40 - this.m_eCity.GetForwardVector() * 10 + this.m_eCity.GetAbsOrigin()) as Vector,
        });
        this.m_tabPos.push({
            entity: null,
            vPos: (this.m_eCity.GetRightVector() * -40 - this.m_eCity.GetForwardVector() * 10 + this.m_eCity.GetAbsOrigin()) as Vector,
        });
    }

    getNilPos(entity: CDOTA_BaseNPC_Hero): Vector {
        for (const v of this.m_tabPos) {
            if (v.entity == null) {
                v.entity = entity;
                break;
            }
        }
        return this.m_entity.GetAbsOrigin();
    }

    getUsedPos(entity: CDOTA_BaseNPC_Hero, bInPrison?: boolean): Vector {
        if (bInPrison) {
            for (const v of this.m_tabPos) {
                if (entity == v.entity) {
                    return v.vPos;
                }
            }
        }
        return this.m_entity.GetAbsOrigin();
    }
}
