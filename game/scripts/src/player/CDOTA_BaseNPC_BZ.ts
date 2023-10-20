import { PathDomain } from "../path/pathsdomain/pathdomain";
import { BaseAbility } from "../utils/dota_ts_adapter";

export interface CDOTA_BaseNPC_BZ extends CDOTA_BaseNPC_Hero {
    LevelUp: (this: any, bPlayEffects: any, bLevelDown: any) => void
    _updateIntellect: (this: any) => void
    _updateAgility: (this: any) => void
    _updateStrength: (this: any) => void
    nPrimaryAttribute: number
    fStrength: number,
    fBaseStrength: number,
    fStrengthGain: number,
    fAgility: number,
    fBaseAgility: number,
    fAgilityGain: number,
    fIntellect: number,
    fBaseIntellect: number,
    fIntellectGain: number,
    hStrModifier: CDOTA_Buff,
    hAgiModifier: CDOTA_Buff,
    hIntModifier: CDOTA_Buff,
    hBaseStrModifier: CDOTA_Buff,
    hBaseAgiModifier: CDOTA_Buff,
    hBaseIntModifier: CDOTA_Buff,
    hPrimaryAttributeModifier: CDOTA_Buff,
    ModifyStrength(newStrength: number, bIsBase?: boolean): void
    ModifyAgility(newAgility: number, bIsBase?: boolean): void
    ModifyIntellect(newIntellect: number, bIsBase?: boolean): void

    get06ItemByName(sName: string, itemIgnore?):CDOTA_Item
    get09ItemByName(sName: string, itemIgnore?):CDOTA_Item
}
/**自定义兵卒类,继承CDOTA_BaseNPC */
export class CDOTA_BaseNPC_BZ {
    m_path: PathDomain
    m_eAtkTarget: CDOTA_BaseNPC_Hero
    m_bAbltBZ: BaseAbility
    m_bBattle: boolean
    m_tabAtker: CDOTA_BaseNPC_Hero[]
    _ctrlBzAtk_thinkID: string

    /**获取单位物品栏6格中的物品用名字 */
    get06ItemByName(sName: string, itemIgnore?) {
        for (let i = 0; i < 6; i++) {
            const item = this.GetItemInSlot(i)
            if (item && item != itemIgnore && !item.IsNull() && item.GetAbilityName() == sName) {
                return item
            }
        }
    }

    /**获取单位物品栏加背包9格中的物品用名字 */
    get09ItemByName(sName: string, itemIgnore?) {
        if (IsValidEntity(this)) {
            for (let i = 0; i < 9; i++) {
                const item = this.GetItemInSlot(i)
                if (item && item != itemIgnore && !item.IsNull() && item.GetAbilityName() == sName) {
                    return item
                }
            }
        }
    }

}