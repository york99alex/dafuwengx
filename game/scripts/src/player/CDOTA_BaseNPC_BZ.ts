import { Path } from "../path/Path";

export interface CDOTA_BaseNPC_BZ extends CDOTA_BaseNPC { }
export class CDOTA_BaseNPC_BZ {
    m_path: Path;
    m_eAtkTarget: null;

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