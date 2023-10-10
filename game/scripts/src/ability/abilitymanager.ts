import { CDOTA_BaseNPC_BZ } from "../player/CDOTA_BaseNPC_BZ"
import { Player } from "../player/player"
import { BaseAbility, BaseItem } from "../utils/dota_ts_adapter"

export class AbilityManager {

    static m_tabNullAbltCD
    static m_tabEntityItemCD  // 记录一个单位的多个同物品中用来刷CD的那个物品{entid,{itemName,item}}

    static init() {
        this.m_tabNullAbltCD = []
        this.m_tabEntityItemCD = []
        ListenToGameEvent("dota_item_purchase", (event) => this.onEvent_itemPurchased(event), this)
        ListenToGameEvent("npc_spawned", (event) => this.onNPCFirstSpawned(event), this)
    }

    static onEvent_itemPurchased(event: GameEventProvidedProperties & DotaItemPurchaseEvent): void {
        // 开启被出售的物品CD倒计时
    }

    static onNPCFirstSpawned(event: GameEventProvidedProperties & NpcSpawnedEvent): void {
        const spawnedUnit = EntIndexToHScript(event.entindex as EntityIndex) as CDOTA_BaseNPC
        // if (spawnedUnit == null) return
        // // 添加默认modifier
        // const tData = KeyValues.UnitsKv[spawnedUnit.GetUnitName()]
        // if (tData != null && tData.AmbientModifiers != null && tData.AmbientModifiers != "") {

        // }

        // print("spawnedUnit.GetUnitName():", spawnedUnit.GetUnitName())
        // if (spawnedUnit.GetUnitName() == "npc_dota_hero_phantom_assassin") {
        //     const ability2 = spawnedUnit.GetAbilityByIndex(0)
        //     print("ability2.GetAbilityName():", ability2.GetAbilityName())
        //     DeepPrintTable(ability2.GetAbilityKeyValues())
        // }
    }

    /**设置回合CD */
    static setRoundCD(oPlayer: Player, ability: BaseAbility | CDOTA_Item, nCD?: number) {
        if (ability == null) {
            return
        }

        // 计算技能CD
        if (!nCD) {
            nCD = ability.GetCooldownTime()
        }
        if (nCD <= 0) {
            nCD = 1
        }

        const bItem = ability.IsItem()
        const eCaster = ability.GetCaster() as CDOTA_BaseNPC_BZ
        const strName = ability.GetAbilityName()
        let tEventID = []
        let sThink

        if (!AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID]) {
            AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID] = []
        }

        // CD完成
        function onCDEnd() {
            if (!ability.IsNull()) {
                ability.EndCooldown()
            }
            Timers.RemoveTimer(sThink)
            if (AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID]) {
                AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID][strName] = null
            }
            for (const v of tEventID) {
                GameRules.EventManager.UnRegisterByID(v)
            }
            tEventID = []
        }

        // 物品还有CD则修改
        if (bItem) {
            let item: CDOTABaseAbility = AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID][strName]
            if (!IsValidEntity(item) || !IsValidEntity(item.GetCaster())) {
                item = ability
            } else if (!item.IsCooldownReady()) {
                GameRules.EventManager.FireEvent("Event_LastCDChange", {
                    strAbltName: strName,
                    entity: eCaster,
                    nCD: nCD
                })
            }

            AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID][strName] = ability

            // 监听物品移除切换刷CD物品
            let nAbltEntID = item.GetEntityIndex()
            tEventID.push(GameRules.EventManager.Register("Event_ItemDel", (tEvent) => {
                if (nAbltEntID == tEvent.nItemEntID) {
                    const itemNew = oPlayer.getItemFromAllByName(strName, item)
                    if (itemNew) {
                        item = itemNew
                        ability = itemNew
                        nAbltEntID = itemNew.GetEntityIndex()
                        AbilityManager.m_tabEntityItemCD[oPlayer.m_nPlayerID][strName] = itemNew
                    } else {
                        onCDEnd()
                    }
                }
            }))
        }

        let nCDLast = nCD

        // 玩家回合开始事件
        tEventID.push(GameRules.EventManager.Register("Event_PlayerRoundBegin", (tEvent) => {
            if (tEvent.oPlayer != oPlayer) {
                return
            }
            // 倒计时的物品被放入背包
            if (bItem) {
                if ((ability as CDOTA_Item).GetItemSlot() >= 6) {
                    // 切换到在物品栏的同物品
                    if (IsValidEntity(eCaster)) {
                        const item = eCaster.get06ItemByName(strName)
                        if (!item) {
                            return  // 没有就不刷CD
                        }
                        ability = item
                    }
                }
            }
            nCDLast -= 1
            if (nCDLast == 0) {
                onCDEnd()
            }
        }))

        // 监听修改CD事件
        tEventID.push(GameRules.EventManager.Register("Event_LastCDChange", (tEvent) => {
            if (tEvent.strAbltName == strName && tEvent.entity == eCaster) {
                nCDLast = tEvent.nCD
                if (ability.IsNull()) {
                    onCDEnd()
                } else {
                    ability.StartCooldown(nCDLast)
                    if (nCDLast == 0) {
                        onCDEnd
                    }
                }
            }
        }))

        // 设置持续CD
        ability.StartCooldown(nCDLast)
        sThink = Timers.CreateTimer(() => {
            if (ability.IsNull()) {
                if (eCaster != null && !eCaster.IsNull()) {
                    // 找其他同物品
                    if (bItem) {

                    } else {

                    }
                }
            } else if (nCDLast > 0) {
                ability.StartCooldown(nCDLast)
                return 0.9
            }
            onCDEnd()
            return null
        })
    }
}