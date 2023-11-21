import { TSBaseItem } from "../ability/tsBaseItem";
import { Player } from "../player/player";
import { IsValid } from "../utils/amhc";
import { ParaAdjuster } from "../utils/paraadjuster";


const INDEX_ITEM = 6
const INDEX_BACK = 8
export class ItemManager {
    m_tCombinable: []    // 记录合成物品，用于过滤重复合成

    constructor() {
        this.m_tCombinable = []
    }

    init() {
        GameRules.EventManager.Register("Event_ItemMove", (event: ExecuteOrderFilterEvent) => this.onEvent_ItemMove(event), this)
        GameRules.EventManager.Register("Event_ItemAdd", (event: ItemAddedToInventoryFilterEvent) => this.onEvent_ItemAdd(event), this)
        GameRules.EventManager.Register("Event_ItemDel", () => this.onEvent_ItemDel(), this)
        GameRules.EventManager.Register("Event_ItemSell", () => this.onEvent_ItemSell(), this)
        GameRules.EventManager.Register("Event_ItemGive", () => this.onEvent_ItemGive(), this)
        GameRules.EventManager.Register("Event_ItemLock", () => this.onEvent_ItemLock(), this)
        GameRules.EventManager.Register("Event_ItemBuy", () => this.onEvent_ItemBuy(), this)
        GameRules.EventManager.Register("Event_ItemInvalid", () => this.onEvent_ItemInvalid(), this)
        GameRules.EventManager.Register("Event_ItemValid", () => this.onEvent_ItemValid(), this)
        GameRules.EventManager.Register("Event_ItemSplit", () => this.onEvent_ItemSplit(), this, -987654321)

        // TODO:
    }
    onEvent_ItemMove(event: ExecuteOrderFilterEvent) {
        if (event["bIgnore"]) return
        const item = EntIndexToHScript(event.entindex_ability) as CDOTA_Item
        const caster = EntIndexToHScript(event.units["0"]) as CDOTA_BaseNPC
        if (!IsValid(item)) return
        if (event.entindex_target < INDEX_ITEM) {
            // 放入物品蓝
            if (item.GetItemSlot() >= INDEX_ITEM) {
                // 从背包放入
                if (!IsValid(caster)) return

                // 触发物品生效
                GameRules.EventManager.FireEvent("Event_ItemValid", { item: item })

                // 被交换物品触发失效
                const item2 = caster.GetItemInSlot(event.entindex_target)
                if (item2) {
                    GameRules.EventManager.FireEvent("Event_ItemInvalid", {
                        item: item2,
                        entity: caster,
                        nItemEntID: item2.GetEntityIndex(),
                        nItemSlot: item2.GetItemSlot(),
                        sItemName: item2.GetAbilityName()
                    })
                }

            }
            if (caster.IsRealHero()) {
                Timers.CreateTimer(5.5, () => {
                    if (item.GetItemState() == 0) {
                        // 物品未就绪
                        return 0.01
                    } else {
                        // 物品就绪
                        ParaAdjuster.ModifyMana(caster)
                        return
                    }
                })
            }
        } else if (event.entindex_target > INDEX_BACK) {
            // 放入储存库, 禁止
            event["bIgnore"] = true
        } else {
            // 放入背包
            if (item.GetItemSlot() < INDEX_ITEM) {
                // 从物品栏放入
                const caster = EntIndexToHScript(event.units["0"]) as CDOTA_BaseNPC
                if (!IsValid(caster)) return

                // 触发物品失效
                GameRules.EventManager.FireEvent("Event_ItemInvalid", {
                    item: item,
                    entity: caster,
                    nItemEntID: item.GetEntityIndex(),
                    nItemSlot: item.GetItemSlot(),
                    sItemName: item.GetAbilityName()
                })

                // 触发物品生效
                const item2 = caster.GetItemInSlot(event.entindex_target)
                if (item2)
                    GameRules.EventManager.FireEvent("Event_ItemValid", { item: item2 })
            }
            if (caster.IsRealHero()) Timers.CreateTimer(0.01, () => ParaAdjuster.ModifyMana(caster))
        }
    }
    /**获得物品 */
    onEvent_ItemAdd(event: ItemAddedToInventoryFilterEvent) {
        const item = EntIndexToHScript(event.item_entindex_const)
        const caster = EntIndexToHScript(event.inventory_parent_entindex_const) as CDOTA_BaseNPC
        if (!IsValid(caster) || !IsValid(item)) return

        if (caster.IsRealHero()) ParaAdjuster.ModifyMana(caster)
    }
    onEvent_ItemDel() {
    }
    onEvent_ItemSell() {
    }
    onEvent_ItemGive() {
    }
    onEvent_ItemLock() {
    }
    onEvent_ItemBuy() {
    }
    onEvent_ItemInvalid() {
    }
    onEvent_ItemValid() {
    }
    onEvent_ItemSplit() {
    }
    /**
     * 检查是否有重复物品，并统一为旧装备的CD
     */
    isSameItemCD(item: TSBaseItem, player: Player) {
        if (!IsValid(item)) return
        for (let i = 0; i < 9; i++) {
            const itemTemp = player.m_eHero.GetItemInSlot(i)
            if (itemTemp && IsValid(itemTemp) && itemTemp.GetName() == item.GetName()) {
                if (!itemTemp.IsCooldownReady()) {
                    return math.ceil(itemTemp.GetCooldownTimeRemaining())
                } else {
                    return false
                }
            }
        }
    }
}

export function Get06ItemByName(npc: CDOTA_BaseNPC, sName: string, itemIgnore?: TSBaseItem): CDOTA_Item {
    for (let i = 0; i < 6; i++) {
        let item = npc.GetItemInSlot(i)
        if (item && item != itemIgnore && !item.IsNull() && item.GetAbilityName() == sName) {
            return item
        }
    }
}