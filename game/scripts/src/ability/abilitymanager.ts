import { Player } from "../player/player"
import { BaseAbility } from "../utils/dota_ts_adapter"
import { Ability_phantom_strike } from "./phantom_assassin/Ability_phantom_strike"

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

        print("spawnedUnit.GetUnitName():", spawnedUnit.GetUnitName())
        if (spawnedUnit.GetUnitName() == "npc_dota_hero_phantom_assassin") {
            const ability2 = spawnedUnit.GetAbilityByIndex(0)
            print("ability2.GetAbilityName():", ability2.GetAbilityName())
            DeepPrintTable(ability2.GetAbilityKeyValues())
        }
    }

    static setRoundCD(oPlayer: Player, ability: BaseAbility) {
        // TODO:
        
    }
}