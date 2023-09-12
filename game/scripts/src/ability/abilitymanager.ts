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
        // const spawnedUnit = EntIndexToHScript(event.entindex as EntityIndex) as CDOTA_BaseNPC
        // if (spawnedUnit == null) return
        // // 添加默认modifier
        // const tData = KeyValues.UnitsKv[spawnedUnit.GetUnitName()]
        // if (tData != null && tData.AmbientModifiers != null && tData.AmbientModifiers != "") {
            
        // }
    }
}