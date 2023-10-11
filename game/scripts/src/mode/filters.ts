export class Filters {

    static init() {
        let GameMode = GameRules.GetGameModeEntity()
        GameMode.SetAbilityTuningValueFilter(() => true, this)
        GameMode.SetBountyRunePickupFilter(() => true, this)
        GameMode.SetDamageFilter((event) => this.DamageFilter(event), this)
        GameMode.SetExecuteOrderFilter((event) => this.ExecuteOrderFilter(event), this)
        GameMode.SetHealingFilter(() => true, this)
        GameMode.SetItemAddedToInventoryFilter((event) => this.ItemAddedToInventoryFilter(event), this)
        GameMode.SetModifierGainedFilter(() => true, this)
        GameMode.SetModifyExperienceFilter(() => true, this)
        GameMode.SetModifyGoldFilter(() => true, this)
        GameMode.SetRuneSpawnFilter(() => false, this)
        GameMode.SetTrackingProjectileFilter(() => true, this)
    }

    static DamageFilter(event): boolean {
        // 触发攻击事件
        GameRules.EventManager.FireEvent("Event_Atk", event)
        // 触发被攻击事件
        GameRules.EventManager.FireEvent("Event_BeAtk", event)
        if(event.bIgnore){
            return false    // 忽略订单
        }
        // 触发受伤事件
        GameRules.EventManager.FireEvent("Event_OnDamage", event)
        return true
    }

    static ExecuteOrderFilter(event): boolean {
        print("ExecuteOrderFilter===执行命令过滤")
        DeepPrintTable(event)
        /**
         * 命令常量
         *  DOTA_UNIT_ORDER_NONE = 0
            DOTA_UNIT_ORDER_MOVE_TO_POSITION = 1
            DOTA_UNIT_ORDER_MOVE_TO_TARGET = 2
            DOTA_UNIT_ORDER_ATTACK_MOVE = 3
            DOTA_UNIT_ORDER_ATTACK_TARGET = 4
            DOTA_UNIT_ORDER_CAST_POSITION = 5
            DOTA_UNIT_ORDER_CAST_TARGET = 6
            DOTA_UNIT_ORDER_CAST_TARGET_TREE = 7
            DOTA_UNIT_ORDER_CAST_NO_TARGET = 8
            DOTA_UNIT_ORDER_CAST_TOGGLE = 9
            DOTA_UNIT_ORDER_HOLD_POSITION = 10
            DOTA_UNIT_ORDER_TRAIN_ABILITY = 11
            DOTA_UNIT_ORDER_DROP_ITEM = 12
            DOTA_UNIT_ORDER_GIVE_ITEM = 13
            DOTA_UNIT_ORDER_PICKUP_ITEM = 14
            DOTA_UNIT_ORDER_PICKUP_RUNE = 15
            DOTA_UNIT_ORDER_PURCHASE_ITEM = 16
            DOTA_UNIT_ORDER_SELL_ITEM = 17
            DOTA_UNIT_ORDER_DISASSEMBLE_ITEM = 18
            DOTA_UNIT_ORDER_MOVE_ITEM = 19
            DOTA_UNIT_ORDER_CAST_TOGGLE_AUTO = 20
            DOTA_UNIT_ORDER_STOP = 21
            DOTA_UNIT_ORDER_TAUNT = 22
            DOTA_UNIT_ORDER_BUYBACK = 23
            DOTA_UNIT_ORDER_GLYPH = 24
            DOTA_UNIT_ORDER_EJECT_ITEM_FROM_STASH = 25
            DOTA_UNIT_ORDER_CAST_RUNE = 26
            DOTA_UNIT_ORDER_PING_ABILITY = 27
            DOTA_UNIT_ORDER_MOVE_TO_DIRECTION = 28
            DOTA_UNIT_ORDER_PATROL = 29
            DOTA_UNIT_ORDER_VECTOR_TARGET_POSITION = 30
            DOTA_UNIT_ORDER_RADAR = 31
            DOTA_UNIT_ORDER_SET_ITEM_COMBINE_LOCK = 32
            DOTA_UNIT_ORDER_CONTINUE = 33
            DOTA_UNIT_ORDER_VECTOR_TARGET_CANCELED = 34
            DOTA_UNIT_ORDER_CAST_RIVER_PAINT = 35
            DOTA_UNIT_ORDER_PREGAME_ADJUST_ITEM_ASSIGNMENT = 36
            DOTA_UNIT_ORDER_DROP_ITEM_AT_FOUNTAIN = 37
            DOTA_UNIT_ORDER_TAKE_ITEM_FROM_NEUTRAL_ITEM_STASH = 38
            DOTA_UNIT_ORDER_MOVE_RELATIVE = 39
            DOTA_UNIT_ORDER_CAST_TOGGLE_ALT = 40
         */
        const orderType = event.order_type
        const playerID = event.issuer_player_id_const

        if (event.units == null || event.units["0"] == null) return

        const caster = EntIndexToHScript(event.units["0"])

        if (orderType == UnitOrder.MOVE_TO_TARGET
            || orderType == UnitOrder.DROP_ITEM
            || orderType == UnitOrder.PICKUP_ITEM
            || orderType == UnitOrder.PICKUP_RUNE
            || orderType == UnitOrder.HOLD_POSITION
            || orderType == UnitOrder.ATTACK_MOVE
            || orderType == UnitOrder.PATROL
            || orderType == UnitOrder.ATTACK_TARGET
            || orderType == UnitOrder.MOVE_TO_DIRECTION) {
            return false
        } else if (orderType == UnitOrder.MOVE_TO_POSITION) {
            GameRules.EventManager.FireEvent("Event_OrderMoveToPos", event)
            return false
        } else if (orderType == UnitOrder.PURCHASE_ITEM) {
            GameRules.EventManager.FireEvent("Event_ItemBuy", event)
        } else if (orderType == UnitOrder.SELL_ITEM) {
            GameRules.EventManager.FireEvent("Event_ItemSell", event)
        } else if (orderType == UnitOrder.DISASSEMBLE_ITEM) {
            GameRules.EventManager.FireEvent("Event_ItemSplit", event)
        } else if (orderType == UnitOrder.MOVE_ITEM) {
            GameRules.EventManager.FireEvent("Event_ItemMove", event)
        } else if (orderType == UnitOrder.SET_ITEM_COMBINE_LOCK) {
            GameRules.EventManager.FireEvent("Event_ItemLock", event)
        } else if (orderType == UnitOrder.GIVE_ITEM) {
            GameRules.EventManager.FireEvent("Event_ItemGive", event)
        }

        if (event.bIgnore)
            return false

        return true
    }

    static ItemAddedToInventoryFilter(event: ItemAddedToInventoryFilterEvent): boolean {
        // 触发获取物品
        GameRules.EventManager.FireEvent("Event_ItemAdd", event)
        return true
    }

}