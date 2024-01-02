import { GS_Begin, PS_AtkHero, PS_AtkMonster, TP_MONSTER_1, TP_MONSTER_2, TP_MONSTER_3, TP_PRISON, TypeOprt } from '../mode/gamemessage';
import { DamageEvent, Player } from '../player/player';
import { AMHC, IsValid } from '../utils/amhc';
import { Path } from './Path';
import { PathPrison } from './pathprison';

/**野怪路径 */
export class PathMonster extends Path {
    m_eCity: CBaseEntity = null; // 建筑点实体

    m_tabEMonster: CDOTA_BaseNPC[] = []; // 野区生物实体
    m_tabEHero: CDOTA_BaseNPC_Hero[] = []; // 野区打野英雄实体
    m_tabAtker: CDOTA_BaseNPC_Hero[] = []; // 野怪可攻击的单位
    m_tabTrophy: Record<number, { nExp: number; nGold: number }> = {}; // 打野英雄获取的战利品统计<etab>

    m_tabMonsterInfo: MONSTER_SETTING[] = null; // 可刷新的野怪信息
    m_typeMonsterCur: (typeof TypeMonster)[keyof typeof TypeMonster] = null; // 当前野怪类型
    m_typeMonsterLast: (typeof TypeMonster)[keyof typeof TypeMonster] = null; // 上次野怪类型

    constructor(entity: CBaseEntity) {
        super(entity);
        this.m_eCity = Entities.FindByName(null, 'city_' + this.m_nID);
        if (this.m_eCity) {
            this.m_eCity.SetForwardVector((this.m_entity.GetAbsOrigin() - this.m_eCity.GetAbsOrigin()) as Vector);
            // 路径视野
            AddFOWViewer(DotaTeam.GOODGUYS, this.m_eCity.GetAbsOrigin(), 500, -1, true);
        }

        this.m_tabMonsterInfo = [];
        // 处理野怪类型,给m_tabMonsterInfo赋值
        switch (this.m_typePath) {
            case TP_MONSTER_1:
                // 小野和中野营地
                for (let i = 0; i <= 1; i++) {
                    this.m_tabMonsterInfo = this.m_tabMonsterInfo.concat(MONSTER_SETTINGS[i]);
                }
                break;
            case TP_MONSTER_2:
                this.m_tabMonsterInfo = this.m_tabMonsterInfo.concat(MONSTER_SETTINGS[2]);
                break;
            case TP_MONSTER_3:
                this.m_tabMonsterInfo = this.m_tabMonsterInfo.concat(MONSTER_SETTINGS[3]);
                break;
            default:
                break;
        }
        this.registerEvent();
    }

    // 触发路径
    onPath(oPlayer: Player) {
        super.onPath(oPlayer);

        if (this.m_tabEMonster.length == 0) return;

        // 操作前处理上一个(如果有的话)
        GameRules.GameConfig.autoOprt(TypeOprt.TO_AtkMonster, oPlayer);
        GameRules.GameConfig.sendOprt({
            nPlayerID: oPlayer.m_nPlayerID,
            typeOprt: TypeOprt.TO_AtkMonster,
            typePath: this.m_typePath,
            nPathID: this.m_nID,
        });
        GameRules.EventManager.Register('Event_CurPathChange', (event: { player: Player }) => {
            if (event.player == oPlayer && this != oPlayer.m_pathCur) {
                GameRules.GameConfig.autoOprt(TypeOprt.TO_AtkMonster, oPlayer);
            }
        });
    }

    /**刷新野怪 */
    spawnMonster() {
        if (!this.m_eCity || this.m_tabEMonster.length > 0) return;

        // 随机一种野怪
        this.m_typeMonsterLast = this.m_typeMonsterCur;
        const tabSpawn: MONSTER_SETTING[] = [];
        for (const value of this.m_tabMonsterInfo) {
            if (this.m_typeMonsterLast != value.typeMonster) {
                tabSpawn.push(value);
            }
        }

        let tabInfoOne: MONSTER_SETTING;
        if (tabSpawn.length > 0) {
            tabInfoOne = tabSpawn[RandomInt(0, tabSpawn.length - 1)];
        } else {
            tabInfoOne = this.m_tabMonsterInfo[RandomInt(0, this.m_tabMonsterInfo.length - 1)];
        }
        if (!tabInfoOne) return;

        this.m_typeMonsterCur = tabInfoOne.typeMonster;
        // 创建野怪
        print('===spawnMonster create unit data:');
        DeepPrintTable(tabInfoOne);

        for (const unitName in tabInfoOne.tabMonster) {
            const unitInfo = tabInfoOne.tabMonster[unitName];
            for (let i = 1; i <= unitInfo.nCount; i++) {
                let vPos = this.m_eCity.GetAbsOrigin();
                vPos = (vPos +
                    this.m_eCity.GetForwardVector() * unitInfo.tabPos[i - 1][0] +
                    this.m_eCity.GetRightVector() * unitInfo.tabPos[i - 1][1] +
                    this.m_eCity.GetUpVector() * unitInfo.tabPos[i - 1][2]) as Vector;
                print('===spawnMonster GetForwardVector:', this.m_eCity.GetForwardVector());
                const eMonster = AMHC.CreateUnit(unitName, vPos, this.m_eCity.GetForwardVector(), null, DotaTeam.NEUTRALS);
                FindClearSpaceForUnit(eMonster, eMonster.GetOrigin(), true);
                eMonster['m_bMonster'] = true;
                const nGold = eMonster.GetGoldBounty();
                eMonster.SetMaximumGoldBounty(nGold);
                eMonster.SetMinimumGoldBounty(nGold);
                this.m_tabEMonster.push(eMonster);
            }
        }

        // 设置野怪的攻击状态
        this.setMonsterAtk();
    }

    /**设置玩家打野 */
    setAtkerAdd(player: Player, blinkPath?: Path) {
        if (this.m_tabEMonster.length == 0) return;

        this.m_tabTrophy[player.m_nPlayerID] = { nGold: 0, nExp: 0 };
        this.m_tabEHero.push(player.m_eHero);
        this.m_tabAtker.push(player.m_eHero);
        player.setPlayerState(PS_AtkHero + PS_AtkMonster);

        if (blinkPath) player.blinkToPath(this);
        player.moveToPos((this.m_eCity.GetAbsOrigin() + this.m_eCity.GetForwardVector() * 100) as Vector, (bSuccess: boolean) => {
            if (bSuccess) {
                player.m_eHero.MoveToTargetToAttack(this.m_tabEMonster[0]);
                this.setMonsterAtk();
            }
        });

        const tEventID = [];
        tEventID.push(
            GameRules.EventManager.Register('Event_AtkMosterEnd', (event: { entity: CDOTA_BaseNPC_Hero; bMoveBack: boolean; bInPrison: boolean }) => {
                if (event.entity == player.m_eHero) {
                    if (event.bMoveBack) {
                        // 结束打野并回到原位
                        if (blinkPath) {
                            player.blinkToPath(blinkPath);
                        } else {
                            player.moveToPos(this.getUsedPos(player.m_eHero), (bSuccess: boolean) => {
                                if (bSuccess) player.resetToPath();
                            });
                        }
                    }
                    GameRules.EventManager.UnRegisterByIDs(tEventID);
                }
            })
        );

        // 触发打野事件
        GameRules.EventManager.FireEvent('Event_AtkMoster', { entity: player.m_eHero });

        // 监听行为终止
        tEventID.push(
            GameRules.EventManager.Register('Event_ActionStop', (tEvent: { entity: CDOTA_BaseNPC; bMoveBack?: boolean }) => {
                if (tEvent.entity != player.m_eHero) return;
                player.moveStop();
                this.setAtkerDel(player, tEvent.bMoveBack || false, false);
            })
        );
    }

    /**设置野怪的攻击状态 */
    setMonsterAtk() {
        if (this.m_tabAtker.length == 0) {
            // 不可攻击
            for (const unit of this.m_tabEMonster) {
                AMHC.AddAbilityAndSetLevel(unit, 'jiaoxie');
            }
        } else {
            // 可攻击
            for (const unit of this.m_tabEMonster) {
                AMHC.RemoveAbilityAndModifier(unit, 'jiaoxie');
                unit.MoveToTargetToAttack(this.m_tabAtker[0]);
            }
        }
    }

    /**设置玩家结束打野 */
    setAtkerDel(player: Player, bMoveBack?: boolean, bInPrison?: boolean) {
        for (const hero of this.m_tabEHero) {
            if (hero == player.m_eHero) {
                this.m_tabEHero.splice(this.m_tabEHero.indexOf(hero), 1);
                player.setPlayerState(-(PS_AtkHero + PS_AtkMonster));

                // 设置打野记录
                // TODO: GameRecord

                // 触发打野结束事件
                GameRules.EventManager.FireEvent('Event_AtkMosterEnd', {
                    entity: player.m_eHero,
                    bMoveBack: bMoveBack,
                    bInPrison: bInPrison,
                });
                break;
            }
        }
        for (const hero of this.m_tabAtker) {
            if (hero == player.m_eHero) {
                this.m_tabAtker.splice(this.m_tabAtker.indexOf(hero), 1);
                this.setMonsterAtk(); // 刷新野怪攻击对象
            }
        }
    }

    /**结束打野 */
    EndBattle() {
        // 移除全部打野玩家
        for (let i = this.m_tabAtker.length - 1; i >= 0; i--) {
            const player = GameRules.PlayerManager.getPlayer(this.m_tabAtker[i].GetPlayerOwnerID());
            this.setAtkerDel(player, true);
        }
        // 设置野怪攻击状态
        this.setMonsterAtk();
    }

    /**获取野怪的exp */
    getMonsterExp(name: string) {
        for (const settings of MONSTER_SETTINGS) {
            for (const setting of settings) {
                for (const unitname in setting.tabMonster) {
                    if (unitname == name) return setting.tabMonster[unitname].nExp || 0;
                }
            }
        }
    }

    //事件回调-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    /**注册事件 */
    registerEvent() {
        ListenToGameEvent('entity_killed', event => this.onEvent_entityKilled(event), this);
        GameRules.EventManager.Register(
            'Event_PlayerRoundBefore',
            (event: { typeGameState: number }) => this.onEvent_PlayerRoundBefore(event),
            this,
            -987654321
        );
        GameRules.EventManager.Register('Event_PlayerDie', (event: { player: Player }) => this.onEvent_PlayerDie(event), this);
        GameRules.EventManager.Register('Event_Atk', (event: DamageEvent) => this.Event_Atk(event), this);

        if (this.m_typePath == TP_MONSTER_2 || this.m_typePath == TP_MONSTER_3) {
            GameRules.EventManager.Register('Event_UpdateRound', () => {
                if (GameRules.GameConfig.m_nRound == 5 * (this.m_typePath - TP_MONSTER_2 + 1)) {
                    this.spawnMonster();
                    return true;
                }
            });
        } else {
            GameRules.EventManager.Register('Event_GameStart', () => {
                this.spawnMonster();
                return true;
            });
        }
    }

    /**野怪死亡 */
    onEvent_entityKilled(event: GameEventProvidedProperties & EntityKilledEvent) {
        for (const unit of this.m_tabEMonster) {
            if (unit.GetEntityIndex() == event.entindex_killed && IsValid(unit)) {
                // 移除死亡野怪
                const atker = EntIndexToHScript(event.entindex_attacker) as CDOTA_BaseNPC_Hero;
                if (IsValid(atker)) {
                    const nExp = this.getMonsterExp(unit.GetUnitName());
                    // 增加经验
                    const player = GameRules.PlayerManager.getPlayer(atker.GetPlayerOwnerID());
                    if (IsValid(player)) player.setExpAdd(nExp);

                    // 记录收获
                    const nAddGold = unit.GetGoldBounty();
                    const tab = this.m_tabTrophy[atker.GetPlayerOwnerID()];
                    if (tab) {
                        tab.nExp += nExp;
                        tab.nGold += nAddGold;
                    }
                    player.setGold(nAddGold);
                    GameRules.GameConfig.showGold(player, nAddGold);

                    this.m_tabEMonster.splice(this.m_tabEMonster.indexOf(unit), 1);
                    if (this.m_tabEMonster.length == 0) {
                        // 结束打野
                        this.EndBattle();
                        // 刷新野怪
                        this.spawnMonster();
                    } else {
                        // 攻击者切换攻击对象
                        for (const eAtker of this.m_tabAtker) {
                            if (IsValid(eAtker)) eAtker.MoveToTargetToAttack(this.m_tabEMonster[0]);
                        }
                    }

                    // 监听死亡后可能造成的攻击忽略，5秒
                    const nEventID = GameRules.EventManager.Register('Event_Atk', (tabEvent: DamageEvent) => {
                        if (event.entindex_killed == tabEvent.entindex_attacker_const) tabEvent.bIgnoreGold = true;
                    });
                    Timers.CreateTimer(5, () => {
                        GameRules.EventManager.UnRegisterByID(nEventID, 'Event_Atk');
                    });
                    break;
                }
            }
        }
    }

    /**玩家回合开始：结束打野 */
    onEvent_PlayerRoundBefore(event: { typeGameState: number }) {
        if (event.typeGameState != GS_Begin) return;

        const player = GameRules.PlayerManager.getPlayer(GameRules.GameConfig.m_nOrderID);
        for (const atker of this.m_tabAtker) {
            if (atker == player.m_eHero) {
                // 监听玩家从野区移动回路径
                GameRules.GameLoop.m_bRoundBefore = true;

                // 监听玩家移动回路径
                function onMove(tabEvent2: { player: Player }) {
                    if (tabEvent2.player == player) {
                        // 如果要移动,游戏状态改为移动状态
                        // 进入move时会设置m_bRoundBefore为true,此时GameLoop应该被拦截, 保持在RoundBefore
                        GameRules.GameLoop.GameStateService.send('tomove');
                        // 离开RoundBefore时, m_bRoundBefore置为null
                        GameRules.EventManager.Register('Event_PlayerMoveEnd', (event3: { player: Player }) => {
                            if (event3.player == player) {
                                if (event3.player == player) return true;
                                // (攻城/打野可以持续到该玩家的新的一回合开始)  从GSMove到GSBegin
                                GameRules.GameLoop.GameStateService.send('tobegin');
                                return true;
                            }
                        });
                    }
                    return true;
                }

                const eventID = GameRules.EventManager.Register('Event_PlayerMove', (event: { player: Player }) => onMove(event));
                this.setAtkerDel(player, true);
                GameRules.EventManager.UnRegisterByID(eventID, 'Event_PlayerMove');
            }
        }
    }

    /**玩家死亡：结束打野 */
    onEvent_PlayerDie(event: { player: Player }) {
        for (const hero of this.m_tabAtker) {
            if (hero == event.player.m_eHero) {
                // 死亡原地结束打野
                this.setAtkerDel(event.player);
                return;
            }
        }
    }

    /**野怪攻击 */
    Event_Atk(event: DamageEvent) {
        if (this.m_tabEMonster.length == 0) return;

        let bFound: boolean, player: Player;
        for (const unit of this.m_tabEMonster) {
            if (unit.GetEntityIndex() == event.entindex_attacker_const) {
                bFound = true;
                break;
            } else if (unit.GetEntityIndex() == event.entindex_victim_const) {
                player = GameRules.PlayerManager.getPlayer(unit.GetPlayerOwnerID());
                break;
            }
        }
        if (!bFound) return; // 攻击者不是野怪
        if (!player) return;

        if (event.damage >= player.m_eHero.GetHealth()) {
            // 被野怪打死，结束打野，进入地狱
            print('===pathMonster: Event_Atk: killed by moster');
            event.bIgnore = true;
            player.m_eHero.ModifyHealth(player.m_eHero.GetMaxHealth(), null, false, 0);
            this.setAtkerDel(player, false, true);
            const pathPrison = GameRules.PathManager.getPathByType(TP_PRISON)[0] as PathPrison;
            pathPrison.setInPrison(player);
        } else {
            // 不扣钱,扣血
            event.bIgnoreGold = true;
        }
    }
}

/**野怪类型 */
const TypeMonster: Record<string, number> = {
    Small: 0, // 小野类型
    Small_Ghost: 1, // 鬼魂
    Small_Kobold: 2, // 狗头人
    Small_Vhoul: 3, // 豺狼
    Medium: 1000, // 中野类型
    Medium_Wolf: 1001, // 3狼
    Medium_Ogre: 1002, // 红胖
    Medium_Satyr: 1003, // 小萨特
    Large: 2000, // 大野类型
    Large_Hellbear: 2001, // 西红柿马铃薯
    Large_Satyr: 2002, // 大萨特
    Large_Centaur: 2003, // 人马
    Ancient: 3000, // 远古野类型
    Ancient_Dragon: 3001, // 3龙
    Ancient_Golem: 3002, // 大石头
    TM_G3: 3003, // 老萨特
    Ancient_Thunderhide: 3004, // 雷霆蜥蜴
};

interface Monster {
    nCount: number;
    nExp: number;
    tabPos: number[][];
}

interface MONSTER_SETTING {
    typeMonster: (typeof TypeMonster)[keyof typeof TypeMonster];
    tabMonster: { [key: string]: Monster };
}

/**野怪信息 */
const MONSTER_SETTINGS: MONSTER_SETTING[][] = [
    // 小野
    [
        // 鬼魂
        {
            typeMonster: TypeMonster.Small_Ghost,
            tabMonster: {
                npc_dota_neutral_ghost: { nCount: 1, nExp: 1, tabPos: [[0, 0, 0]] },
                npc_dota_neutral_fel_beast: {
                    nCount: 1,
                    nExp: 1,
                    tabPos: [
                        [-100, 50, 0],
                        [-100, -50, 0],
                    ],
                },
            },
        },
        // 狗头人
        {
            typeMonster: TypeMonster.Small_Kobold,
            tabMonster: {
                npc_dota_neutral_kobold_taskmaster: { nCount: 1, nExp: 1, tabPos: [[-100, 0, 0]] },
                npc_dota_neutral_kobold_tunneler: { nCount: 1, nExp: 1, tabPos: [[-100, 50, 0]] },
                npc_dota_neutral_kobold: {
                    nCount: 1,
                    nExp: 1,
                    tabPos: [
                        [0, 0, 0],
                        [0, -50, 0],
                        [0, 50, 0],
                    ],
                },
            },
        },
    ],
    // 中野
    [
        // 3狼
        {
            typeMonster: TypeMonster.Medium_Wolf,
            tabMonster: {
                npc_dota_neutral_alpha_wolf: { nCount: 1, nExp: 2, tabPos: [[0, 0, 0]] },
                npc_dota_neutral_giant_wolf: {
                    nCount: 1,
                    nExp: 1,
                    tabPos: [
                        [-100, 50, 0],
                        [-100, -50, 0],
                    ],
                },
            },
        },
        // 红胖
        {
            typeMonster: TypeMonster.Medium_Ogre,
            tabMonster: {
                npc_dota_neutral_ogre_magi: { nCount: 1, nExp: 2, tabPos: [[0, 0, 0]] },
                npc_dota_neutral_ogre_mauler: {
                    nCount: 1,
                    nExp: 1,
                    tabPos: [
                        [-100, 50, 0],
                        [-100, -50, 0],
                    ],
                },
            },
        },
        // 小萨特
        {
            typeMonster: TypeMonster.Medium_Satyr,
            tabMonster: {
                npc_dota_neutral_satyr_soulstealer: {
                    nCount: 2,
                    nExp: 1,
                    tabPos: [
                        [0, -50, 0],
                        [0, 50, 0],
                    ],
                },
                npc_dota_neutral_satyr_trickster: {
                    nCount: 1,
                    nExp: 1,
                    tabPos: [
                        [-100, 50, 0],
                        [-100, -50, 0],
                    ],
                },
            },
        },
    ],
    // 大野
    [
        // 马铃薯西红柿(熊怪)
        {
            typeMonster: TypeMonster.Large_Hellbear,
            tabMonster: {
                npc_dota_neutral_polar_furbolg_ursa_warrior: {
                    nCount: 1,
                    nExp: 3,
                    tabPos: [[0, -50, 0]],
                },
                npc_dota_neutral_polar_furbolg_champion: {
                    nCount: 1,
                    nExp: 3,
                    tabPos: [[0, 50, 0]],
                },
            },
        },
        // 大萨特
        {
            typeMonster: TypeMonster.Large_Satyr,
            tabMonster: {
                // 萨特苦难使者(大)
                npc_dota_neutral_satyr_hellcaller: {
                    nCount: 1,
                    nExp: 3,
                    tabPos: [[0, -50, 0]],
                },
                // 萨特窃神者(中)
                npc_dota_neutral_satyr_soulstealer: {
                    nCount: 1,
                    nExp: 2,
                    tabPos: [[0, 50, 0]],
                },
                // 萨特放逐者(小)
                npc_dota_neutral_satyr_trickster: {
                    nCount: 1,
                    nExp: 1,
                    tabPos: [[0, 50, 0]],
                },
            },
        },
        // 人马
        {
            typeMonster: TypeMonster.Large_Centaur,
            tabMonster: {
                npc_dota_neutral_centaur_khan: {
                    nCount: 1,
                    nExp: 3,
                    tabPos: [[0, 0, 0]],
                },
                npc_dota_neutral_centaur_outrunner: {
                    nCount: 2,
                    nExp: 1,
                    tabPos: [
                        [0, 50, -50],
                        [0, -50, -50],
                    ],
                },
            },
        },
    ],
    // 远古
    [
        // 3龙
        {
            typeMonster: TypeMonster.Ancient_Dragon,
            tabMonster: {
                npc_dota_neutral_black_dragon: {
                    nCount: 1,
                    nExp: 3,
                    tabPos: [[0, 0, 0]],
                },
                npc_dota_neutral_black_drake: {
                    nCount: 2,
                    nExp: 2,
                    tabPos: [
                        [-100, -50, 0],
                        [-100, 50, 0],
                    ],
                },
            },
        },
        // 大石头怪
        {
            typeMonster: TypeMonster.Ancient_Golem,
            tabMonster: {
                npc_dota_neutral_granite_golem: {
                    nCount: 1,
                    nExp: 3,
                    tabPos: [[0, 0, 0]],
                },
                npc_dota_neutral_rock_golem: {
                    nCount: 2,
                    nExp: 2,
                    tabPos: [
                        [-100, -50, 0],
                        [-100, 50, 0],
                    ],
                },
            },
        },
        // 老萨特
        {
            typeMonster: TypeMonster.TM_G3,
            tabMonster: {
                npc_dota_neutral_prowler_shaman: {
                    nCount: 1,
                    nExp: 3,
                    tabPos: [[0, 0, 0]],
                },
                npc_dota_neutral_prowler_acolyte: {
                    nCount: 2,
                    nExp: 2,
                    tabPos: [
                        [-100, -50, 0],
                        [-100, 50, 0],
                    ],
                },
            },
        },
        // 雷霆蜥蜴
        {
            typeMonster: TypeMonster.Ancient_Thunderhide,
            tabMonster: {
                npc_dota_neutral_big_thunder_lizard: {
                    nCount: 1,
                    nExp: 3,
                    tabPos: [[0, -50, 0]],
                },
                npc_dota_neutral_small_thunder_lizard: {
                    nCount: 2,
                    nExp: 2,
                    tabPos: [
                        [-100, -50, 0],
                        [-100, 50, 0],
                    ],
                },
            },
        },
    ],
];
