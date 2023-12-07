import { CDOTA_BaseNPC_BZ } from '../player/CDOTA_BaseNPC_BZ';
import { Player } from '../player/player';
import { BaseAbility, BaseItem } from '../utils/dota_ts_adapter';
import { TSBaseAbility } from './tsBaseAbilty';
import { modifier_fix_damage } from '../modifiers/modifier_fix_damage';
import { AHMC, IsValid } from '../utils/amhc';
import { TSBaseItem } from '../item/tsBaseItem';
import { Get06ItemByName } from '../item/itemmanager';
import { ParaAdjuster } from '../utils/paraadjuster';

export class AbilityManager {
    static m_tabNullAbltCD;
    static m_tabEntityItemCD; // 记录一个单位的多个同物品中用来刷CD的那个物品{entid,{itemName,item}}

    static init() {
        this.m_tabNullAbltCD = [];
        this.m_tabEntityItemCD = [];
        ListenToGameEvent('dota_item_purchase', event => this.onEvent_itemPurchased(event), this);
        ListenToGameEvent('npc_spawned', event => this.onNPCFirstSpawned(event), this);
    }

    static onEvent_itemPurchased(event: GameEventProvidedProperties & DotaItemPurchaseEvent): void {
        // 开启被出售的物品CD倒计时
    }

    static onNPCFirstSpawned(event: GameEventProvidedProperties & NpcSpawnedEvent): void {
        const spawnedUnit = EntIndexToHScript(event.entindex as EntityIndex) as CDOTA_BaseNPC;
        if (spawnedUnit == null) return;
        // // 添加默认modifier
        // const tData = KeyValues.UnitsKV[spawnedUnit.GetUnitName()]
        // if (tData != null && tData.AmbientModifiers != null && tData.AmbientModifiers != "") {

        // }

        // 注册修正伤害(实现无视河道魔抗buff)
        spawnedUnit.AddNewModifier(spawnedUnit, null, modifier_fix_damage.name, null);
    }

    /**设置回合CD */
    static setRoundCD(oPlayer: Player, ability: TSBaseAbility | CDOTA_Item, nCD?: number) {
        if (ability == null) {
            return;
        }

        // 计算技能CD
        if (!nCD) {
            nCD = ability.GetCooldown(ability.GetLevel());
        }
        // print('===setRoundCD===' + ability.GetName() + '===GetCooldown:', nCD);
        if (nCD <= 0) {
            nCD = 1;
        }
        // print('===setRoundCD===' + ability.GetName() + '===CD:', nCD);

        const bItem = ability.IsItem();
        const eCaster = ability.GetCaster();
        const strName = ability.GetAbilityName();
        let tEventID = [];
        let sThink;

        if (!AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID]) {
            AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID] = [];
        }

        // CD完成
        function onCDEnd() {
            if (!ability.IsNull()) {
                ability.EndCooldown();
            }
            Timers.RemoveTimer(sThink);
            if (AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID]) {
                AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID][strName] = null;
            }
            for (const v of tEventID) {
                GameRules.EventManager.UnRegisterByID(v);
            }
            tEventID = [];
        }

        // 物品还有CD则修改
        if (bItem) {
            let item: CDOTABaseAbility = AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID][strName];
            if (!IsValid(item) || !IsValid(item.GetCaster())) {
                item = ability;
            } else if (!item.IsCooldownReady()) {
                GameRules.EventManager.FireEvent('Event_LastCDChange', {
                    strAbltName: strName,
                    entity: eCaster,
                    nCD: nCD,
                });
            }

            AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID][strName] = ability;

            // 监听物品移除切换刷CD物品
            let nAbltEntID = item.GetEntityIndex();
            tEventID.push(
                GameRules.EventManager.Register('Event_ItemDel', tEvent => {
                    if (nAbltEntID == tEvent.nItemEntID) {
                        const itemNew = oPlayer.getItemFromAllByName(strName, item);
                        if (itemNew) {
                            item = itemNew;
                            ability = itemNew;
                            nAbltEntID = itemNew.GetEntityIndex();
                            AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID][strName] = itemNew;
                        } else {
                            onCDEnd();
                        }
                    }
                })
            );
        }

        let nCDLast = nCD;

        // 玩家回合开始事件
        tEventID.push(
            GameRules.EventManager.Register('Event_PlayerRoundBegin', tEvent => {
                if (tEvent.oPlayer != oPlayer) {
                    return;
                }
                // 倒计时的物品被放入背包
                if (bItem) {
                    const slot = (ability as CDOTA_Item).GetItemSlot();
                    if (slot >= 6 && slot < 10) {
                        // 切换到在物品栏的同物品
                        if (IsValid(eCaster)) {
                            const item = Get06ItemByName(eCaster, strName);
                            if (!item) {
                                return; // 没有就不刷CD
                            }
                            ability = item;
                        }
                    }
                }
                nCDLast -= 1;
                if (nCDLast == 0) {
                    onCDEnd();
                }
            })
        );

        // 监听修改CD事件
        tEventID.push(
            GameRules.EventManager.Register('Event_LastCDChange', tEvent => {
                if (tEvent.strAbltName == strName && tEvent.entity == eCaster) {
                    nCDLast = tEvent.nCD;
                    if (ability.IsNull()) {
                        onCDEnd();
                    } else {
                        ability.StartCooldown(nCDLast);
                        if (nCDLast == 0) {
                            onCDEnd;
                        }
                    }
                }
            })
        );

        // 设置持续CD
        ability.StartCooldown(nCDLast);
        // print('===setRoundCD===' + ability.GetName() + '===StartCooldown===1:', nCDLast);
        sThink = Timers.CreateTimer(() => {
            if (ability.IsNull()) {
                if (eCaster != null && !eCaster.IsNull()) {
                    // 找其他同物品
                    if (bItem) {
                    } else {
                    }
                }
            } else if (ability.GetCooldownTimeRemaining() > 0) {
                ability.StartCooldown(nCDLast);
                // print('===setRoundCD====setRoundCD===' + ability.GetName() + '===StartCooldown===2:', nCDLast);
                return 0.4;
            }
            onCDEnd();
            // print('===setRoundCD===' + ability.GetName() + '===StartCooldown===3:', nCDLast);
            return;
        });
    }

    /**显示技能范围标识 */
    static showAbltMark(ability: TSBaseAbility | TSBaseItem, entity: CDOTA_BaseNPC, tabPathID: number[]) {
        if (ability.timeAbltMark && GameRules.GetDOTATime(false, true) - ability.timeAbltMark < 1) {
            return;
        }
        const tabPath = CustomNetTables.GetTableValue('GamingTable', 'path_info');
        if (!tabPath) {
            return;
        }

        if (ability.tabAbltMarkPtcl) {
            for (const v of ability.tabAbltMarkPtcl) {
                ParticleManager.DestroyParticle(v, false);
            }
        }
        ability.tabAbltMarkPtcl = [];
        ability.timeAbltMark = GameRules.GetDOTATime(false, true);

        // 特效
        for (const pathID of tabPathID) {
            const tabPathInfo = tabPath[tostring(pathID)];
            if (tabPathInfo) {
                const vPos = Vector(tabPathInfo.vPos.x, tabPathInfo.vPos.y, tabPathInfo.vPos.z + 50);
                const nPtclID = ParticleManager.CreateParticle(
                    'particles/units/heroes/hero_dark_willow/dark_willow_wisp_spell_marker_ring.vpcf',
                    ParticleAttachment.POINT,
                    entity
                );
                ParticleManager.SetParticleControl(nPtclID, 0, vPos);
                ability.tabAbltMarkPtcl.push(nPtclID);
            }
        }
    }

    static updateBZBuffByCreate(player: Player, ability: CDOTABaseAbility, funOnBuffApply?: Function) {
        // 监听兵卒创建
        const eventID = GameRules.EventManager.Register('Event_BZCreate', (event: { entity: CDOTA_BaseNPC_BZ }) => {
            print('===updateBZBuffByCreate===0');
            if (event.entity.GetPlayerOwnerID() == player.m_nPlayerID) {
                print('===updateBZBuffByCreate===1');
                // 给升级的兵卒添加buff
                if (ability && ability.IsNull()) {
                    print('===updateBZBuffByCreate===2');
                    return true;
                }
                if (funOnBuffApply) {
                    print('===updateBZBuffByCreate===3');
                    funOnBuffApply(event.entity);
                }
            }
        });
        return eventID;
    }

    /**兵卒能否放技能 */
    static isCanOnAblt(eBZ: CDOTA_BaseNPC): boolean {
        const tabBuffs = eBZ.FindAllModifiers();
        print('===isCanOnAblt===1===');
        for (const buff of tabBuffs) {
            const strBuff = buff.GetName().split('_').pop() ?? '';
            if (strBuff == 'chenmo') {
                print('===isCanOnAblt===2===');
                return false;
            }
        }
        print('===isCanOnAblt===3===');
        return true;
    }

    /**玩家回合结束计算buff */
    static judgeBuffRound(casterPlayerID: number, buff: CDOTA_Buff, funChange?: Function) {
        if (!IsValid(buff) || !buff['m_nRound'] || buff['m_nRound'] < 1) {
            return;
        }
        GameRules.EventManager.Register('Event_PlayerRoundFinished', (playerF: Player) => {
            if (playerF.m_nPlayerID == GameRules.GameConfig.getLastValidOrder(casterPlayerID)) {
                // 一轮结束
                buff['m_nRound'] -= 1;
                if (funChange) {
                    funChange();
                }
                if (buff['m_nRound'] <= 0) {
                    if (IsValid(buff)) {
                        const owner = buff.GetParent();
                        buff.Destroy();
                        if (owner.IsRealHero()) {
                            ParaAdjuster.ModifyMana(owner);
                        }
                    }
                    return true;
                }
            }
        });
    }

    /**添加可复制的buff */
    static setCopyBuff(
        strBuff: string,
        eTarget: CDOTA_BaseNPC,
        eCaster: CDOTA_BaseNPC,
        ability: BaseAbility | TSBaseItem,
        tBuffData?: object,
        bStack?: boolean,
        oBuffOld?: CDOTA_Buff
    ) {
        let oBuff: CDOTA_Buff;
        if (IsValid(eTarget)) {
            oBuff = eTarget.FindModifierByNameAndCaster(strBuff, eCaster);
        }
        if (!oBuff) {
            oBuff = AHMC.AddNewModifier(eTarget, eCaster, ability, strBuff, tBuffData);
            if (oBuff) {
                oBuff['copyBfToEnt'] = (entity: CDOTA_BaseNPC_BZ) => {
                    return AbilityManager.setCopyBuff(strBuff, entity, eCaster, ability, tBuffData, bStack, oBuffOld);
                };
                if (oBuffOld) {
                    oBuff['m_nRound'] = oBuffOld['m_nRound'];
                    oBuff.SetStackCount(oBuffOld.GetStackCount());
                }
            }
        } else if (bStack) {
            if (oBuff.GetStackCount() == 0) {
                oBuff.SetStackCount(1);
            }
            oBuff.IncrementStackCount();
        }
        return oBuff;
    }
}

export function onAblt_yjxr(event: { caster: CDOTA_BaseNPC_BZ; ability: CDOTABaseAbility }) {
    print('===onAblt_yjxr===caster:', event.caster.GetPlayerOwnerID());
    print('===onAblt_yjxr===ability_owner', event.ability.GetOwner().GetOwner().GetName());

    let unit = event.caster;
    const ability = event.ability;
    const nGold = ability.GetGoldCost(ability.GetLevel() - 1);
    print('===onAblt_yjxr===nGold:', nGold);
    // 升级
    const oPlayer = GameRules.PlayerManager.getPlayer(unit.GetPlayerOwnerID());
    unit = oPlayer.setBzStarLevelUp(unit, 1);
    print('===onAblt_yjxr===1');
    oPlayer.setGold(-nGold);
    print('===onAblt_yjxr===2');
    // 通知UI显示花费
    GameRules.GameConfig.showGold(oPlayer, -nGold);

    print('===onAblt_yjxr===finished');
    // 设置游戏记录
    // TODO: GameRecord
}

export function onAblt_xj(event: { caster: CDOTA_BaseNPC_BZ; ability: CDOTABaseAbility }) {
    print('===onAblt_xj===');
    let unit = event.caster;
    const ability = event.ability;
    const nGold = ability.GetGoldCost(ability.GetLevel() - 1);
    print('===onAblt_xj===nGold:', nGold);
    // 降级
    const oPlayer = GameRules.PlayerManager.getPlayer(unit.GetPlayerOwnerID());
    unit = oPlayer.setBzStarLevelUp(unit, -1);
    // 还钱
    oPlayer.setGold(-nGold);
    // 通知UI显示花费
    GameRules.GameConfig.showGold(oPlayer, -nGold);

    // 设置游戏记录
    // TODO: GameRecord
}
