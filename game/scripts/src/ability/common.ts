import { BaseModifier } from "../utils/dota_ts_adapter";



export function AddModifierEvents(modifier_event: ModifierFunction, modifier: BaseModifier, hUnit: CDOTA_BaseNPC) {
    if (hUnit != null) {
        if (hUnit["tModifierEvents"] == null) {
            hUnit["tModifierEvents"] = []
        }
        if (hUnit["tModifierEvents"][modifier_event] == null) {
            hUnit["tModifierEvents"][modifier_event] = []
        }
        hUnit["tModifierEvents"][modifier_event].push(modifier)
        return hUnit["tModifierEvents"][modifier_event].length
    } else {
        // TODO:
    }
}

/**设置无视魔抗 */
export function SetIgnoreMagicResistanceValue(unit, value: number, key?: string): string {
    if (!unit.ignoreMagicResistanceValues) {
        unit.ignoreMagicResistanceValues = []
    }
    key = key || DoUniqueString("IgnoreMagicResistanceValue")
    unit.ignoreMagicResistanceValues[key] = value
    return key
}

/**获取无视魔抗数值 */
export function GetIgnoreMagicResistanceValue(unit) {
    if (!unit.ignoreMagicResistanceValues) {
        unit.ignoreMagicResistanceValues = []
    }
    let value = 0
    for (const v of unit.ignoreMagicResistanceValues) {
        value = 1 - (1 - value) * (1 - v)
    }
    return value
}
