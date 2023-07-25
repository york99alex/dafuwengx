export class AHMC {
    // 写一些方法类,有AMHC之前的lua代码翻译过来,也有自定义工具方法

    /**通用方法之添加技能 */
    static AddAbilityAndSetLevel(unit: CDOTA_BaseNPC, abilityName: string, nLevel?: number): CDOTABaseAbility {
        if (nLevel == null) nLevel = 1
        if (unit == null || unit.IsNull()) return
        let oAblt: CDOTABaseAbility
        if (unit.FindAbilityByName(abilityName) == null) {
            oAblt = unit.AddAbility(abilityName)
            if (oAblt != null)
                oAblt.SetLevel(nLevel)
        } else {
            oAblt = unit.FindAbilityByName(abilityName)
            oAblt.SetLevel(nLevel)
        }
        return oAblt
    }

    /**通用方法之移除技能 */
    static RemoveAbilityAndModifier(unit: CDOTA_BaseNPC, abilityName: string): boolean {
        if (unit == null || unit.IsNull()) return false
        if (unit.FindAbilityByName(abilityName) != null) {
            unit.RemoveAbility(abilityName)

            let strBuff = "modifier_" + abilityName
            print(strBuff)
            let tabBuff = unit.FindAllModifiers()
            print(tabBuff)
            for (const value of tabBuff) {
                if (string.find(value.GetName(), strBuff) != null)
                    unit.RemoveModifierByName(value.GetName())
            }
            return true
        }
    }

    static IsValid(handle: CEntityInstance | any) {
        return handle != null && !handle.IsNull()
    }

    static removeAll(object: any[], condition: any) {
        const kvs = this.FindAll(object, condition)
        for (let index = kvs.length - 1; index >= 0; index--) {
            const kv = kvs[index];
            if (typeof (kvs[index].key) == "number")
                object.splice(kv.key, 1)
            else
                object[kv.key] = null
        }
    }


    static FindAll(obj: any, condition: any) {
        const result: { key: any, value: any }[] = []
        if (obj && condition) {
            const isFunc = typeof condition === 'function';
            for (let key in obj) {
                const value = obj[key];
                if (isFunc) {
                    if (condition(value, key)) {
                        result.push({ key, value });
                    }
                } else {
                    if (value === condition) {
                        result.push({ key, value });
                    }
                }
            }
            if (obj.__index) {
                for (let key in obj.__index) {
                    const value = obj.__index[key];
                    if (isFunc) {
                        if (condition(value, key)) {
                            result.push({ key, value });
                        }
                    } else {
                        if (value === condition) {
                            result.push({ key, value });
                        }
                    }
                }
            }
        }
        return result;
    }

    static CreateUnitAsync(unitName: string, origin: Vector, face: number | Vector, owner: CDOTA_BaseNPC, teamNumber: number, callback: Function) {
        // 创建单位
        CreateUnitByNameAsync(unitName, origin, false, null, null, teamNumber, (unit) => {
            if (unit) {
                // 设置单位面朝方向
                if (typeof (face) == "number") {
                    unit.SetAngles(0, face, 0)
                } else {
                    unit.SetForwardVector(face)
                }

                // 如果有召唤者
                if (owner != null) {
                    unit.SetOwner(owner)
                    unit.SetControllableByPlayer(owner.GetPlayerOwnerID(), true)
                }

                // 回调函数
                if (callback != null) {
                    callback(unit)
                }
            }
        })
    }
}