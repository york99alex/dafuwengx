import { TSBaseAbility } from "../ability/tsBaseAbilty"

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

    /**创建单位 */
    static CreateUnit(unitName: string, origin: Vector, face: number | Vector, owner: CDOTA_BaseNPC, teamNumber: number, callback?: Function) {
        const unit = CreateUnitByName(unitName, origin, false, null, null, teamNumber)
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
        }

        // 回调函数
        if (callback != null) callback(unit)

        return unit
    }

    /**创建带有计时器的特效，计时器结束删除特效，并有一个callback函数 */
    static CreateParticle(particleName: string, particleAttach: number, immediately: boolean, owningEntity: CBaseEntity | null, duration: number, callback?: Function) {
        if (AHMC.IsAlive(owningEntity) == null) {
            error("AMHC:CreateParticle param 3: not valid entity", 2)
        }

        const p = ParticleManager.CreateParticle(particleName, particleAttach, owningEntity)

        if (duration) {
            const time = GameRules.GetGameTime()
            this.Timer(particleName, () => {
                if (GameRules.GetGameTime() - time >= duration) {
                    ParticleManager.DestroyParticle(p, immediately)
                    if (callback != null) callback()
                    return null
                }

                return 0.01
            }, 0)
        }
        return p
    }

    static Timer(name: string, fun: Function, delay: number, entity?: CBaseEntity) {
        delay = delay || 0
        let ent = null
        if (entity != null) {
            if (this.IsAlive(entity) == null) {
                error("AMHC:Timer param 3: not valid entity", 2)
            }
            ent = entity
        } else {
            ent = GameRules.GetGameModeEntity()
        }

        const time = GameRules.GetGameTime()
        ent.SetContextThink(DoUniqueString(name), () => {
            if (GameRules.GetGameTime() - time >= delay) {
                ent.SetContextThink(DoUniqueString(name), () => {
                    if (!GameRules.IsGamePaused()) {
                        return fun()
                    }

                    return 0.01
                }, 0)
                return null
            }

            return 0.01
        }, 0)
    }

    /**
     * 
     * @param entity CDOTA_BaseNPC
     * @returns 返回true有效且存活, 返回false有效但死亡, 返回null无效实体
     */
    static IsAlive(entity: CBaseEntity) {
        if (IsValidEntity(entity)) {
            if (entity.IsAlive()) {
                return true
            }
            return false
        }
        return null
    }

    /**
     * --伤害API简化
     * @param attacker CDOTA_BaseNPC
     * @param victim CDOTA_BaseNPC
     * @param damage number
     * @param damageType DamageTypes
     * @param ability TSBaseAbility
     * @param scale number
     * @param tData 可选
     */
    static Damage(attacker: CDOTA_BaseNPC, victim: CDOTA_BaseNPC, damage: number, damageType: DamageTypes, ability: TSBaseAbility, scale?: number, tData?) {
        if (this.IsAlive(attacker) != true || this.IsAlive(victim) != true) {
            return null
        }
        scale = scale ?? 1
        if (scale < 0) scale = 1

        const tEntID = GameRules.EventManager.Register("Event_Atk", (event) => {
            if (ability) {
                event.ability = ability
            }
            if (tData) {
                // TODO:
            }
        }, null, 987654321)
        ApplyDamage({
            victim: victim,
            attacker: attacker,
            damage: damage * scale,
            damage_type: damageType,
            ability: ability
        })
        GameRules.EventManager.UnRegisterByID(tEntID, "Event_Atk")
    }
}