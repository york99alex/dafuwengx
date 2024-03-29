import { CDOTA_BaseNPC_BZ } from '../player/CDOTA_BaseNPC_BZ';
import { ParaAdjuster } from './paraadjuster';

export class AMHC {
    // 写一些方法类,有AMHC之前的lua代码翻译过来,也有自定义工具方法

    /**通用方法之添加技能 */
    static AddAbilityAndSetLevel(unit: CDOTA_BaseNPC, abilityName: string, nLevel?: number): CDOTABaseAbility {
        if (nLevel == null) nLevel = 1;
        if (unit == null || unit.IsNull()) return;
        let oAblt: CDOTABaseAbility;
        if (unit.FindAbilityByName(abilityName) == null) {
            oAblt = unit.AddAbility(abilityName);
            if (oAblt != null) oAblt.SetLevel(nLevel);
        } else {
            oAblt = unit.FindAbilityByName(abilityName);
            oAblt.SetLevel(nLevel);
        }
        print('===AddAbilityAndSetLevel:', abilityName);
        if (unit.IsRealHero()) {
            print('===AHMC===AddAbilityAndSetLevel===:', unit.GetPlayerOwnerID());
            ParaAdjuster.ModifyMana(unit);
        }
        return oAblt;
    }

    /**通用方法之移除技能 */
    static RemoveAbilityAndModifier(unit: CDOTA_BaseNPC, abilityName: string): boolean {
        if (unit == null || unit.IsNull()) return false;
        if (unit.FindAbilityByName(abilityName) != null) {
            unit.RemoveAbility(abilityName);

            let strBuff = 'modifier_' + abilityName;
            print('===RemoveAbilityAndModifier:', strBuff);
            let tabBuff = unit.FindAllModifiers();
            for (const value of tabBuff) {
                if (value.GetName().indexOf(strBuff) != -1) {
                    print('unit.RemoveModifierByName:', value.GetName());
                    unit.RemoveModifierByName(value.GetName());
                }
            }
            if (unit.IsRealHero()) {
                print('===AHMC===RemoveAbilityAndModifier===:', unit.GetPlayerOwnerID());
                ParaAdjuster.ModifyMana(unit);
            }
            return true;
        }
        return false;
    }

    static AddNewModifier(
        unit: CDOTA_BaseNPC,
        caster: CDOTA_BaseNPC | undefined,
        ability: CDOTABaseAbility | undefined,
        modifierName: string,
        modifierTable: object | undefined
    ) {
        const oBuff = unit.AddNewModifier(caster, ability, modifierName, modifierTable);
        if (unit.IsRealHero()) {
            print('===AHMC===AddNewModifier===:', unit.GetPlayerOwnerID());
            ParaAdjuster.ModifyMana(unit);
        }
        return oBuff;
    }

    static RemoveModifierByName(name: string, unit: CDOTA_BaseNPC) {
        unit.RemoveModifierByName(name);
        if (unit.IsRealHero()) {
            print('===AHMC===RemoveModifierByName===:', unit.GetPlayerOwnerID());
            ParaAdjuster.ModifyMana(unit);
        }
    }

    static RemoveModifierByNameAndCaster(name: string, unit: CDOTA_BaseNPC, caster: CDOTA_BaseNPC) {
        unit.RemoveModifierByNameAndCaster(name, caster);
        if (unit.IsRealHero()) {
            print('===AHMC===RemoveModifierByNameAndCaster===:', unit.GetPlayerOwnerID());
            ParaAdjuster.ModifyMana(unit);
        }
    }

    static removeAll(object: any[], condition: any) {
        const kvs = this.FindAll(object, condition);
        for (let index = kvs.length - 1; index >= 0; index--) {
            const kv = kvs[index];
            if (typeof kvs[index].key == 'number') object.splice(kv.key, 1);
            else object[kv.key] = null;
        }
    }

    static FindAll(obj: any, condition: any) {
        const result: { key: any; value: any }[] = [];
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
        CreateUnitByNameAsync(unitName, origin, false, null, null, teamNumber, unit => {
            if (unit) {
                // 设置单位面朝方向
                if (typeof face == 'number') {
                    unit.SetAngles(0, face, 0);
                } else {
                    unit.SetForwardVector(face);
                }

                // 如果有召唤者
                if (owner != null) {
                    unit.SetOwner(owner);
                    unit.SetControllableByPlayer(owner.GetPlayerOwnerID(), true);
                }

                // 回调函数
                if (callback != null) {
                    callback(unit);
                }
            }
        });
    }

    /**创建单位 */
    static CreateUnit(unitName: string, origin: Vector, face: number | Vector, owner: CDOTA_BaseNPC, teamNumber: number, callback?: Function) {
        const unit = CreateUnitByName(unitName, origin, false, null, null, teamNumber);
        if (unit) {
            // 设置单位面朝方向
            if (typeof face == 'number') {
                unit.SetAngles(0, face, 0);
            } else {
                unit.SetForwardVector(face);
            }

            // 如果有召唤者
            if (owner != null) {
                unit.SetOwner(owner);
                unit.SetControllableByPlayer(owner.GetPlayerOwnerID(), true);
            }
        }

        // 回调函数
        if (callback != null) callback(unit);

        return unit;
    }

    /**创建带有计时器的特效，计时器结束删除特效，并有一个callback函数 */
    static CreateParticle(
        particleName: string,
        particleAttach: number,
        immediately: boolean,
        owningEntity: CBaseEntity | null,
        duration?: number,
        callback?: Function
    ) {
        if (AMHC.IsAlive(owningEntity) == null) {
            error('AMHC:CreateParticle param 3: not valid entity', 2);
        }

        const p = ParticleManager.CreateParticle(particleName, particleAttach, owningEntity);

        if (duration != null) {
            const time = GameRules.GetGameTime();
            this.Timer(
                particleName,
                () => {
                    if (GameRules.GetGameTime() - time >= duration) {
                        ParticleManager.DestroyParticle(p, immediately);
                        if (callback != null) callback();
                        return null;
                    }

                    return 0.01;
                },
                0
            );
        }
        return p;
    }

    /**创建带有计时器的特效，只对某玩家显示，计时器结束删除特效，并有一个callback函数 */
    static CreateParticleForPlayer(
        particleName: string,
        particleAttach: ParticleAttachment,
        immediately: boolean,
        owningEntity: CBaseEntity | undefined,
        owningPlayer: CDOTAPlayerController,
        duration?: number,
        callback?: Function
    ) {
        const p = ParticleManager.CreateParticleForPlayer(particleName, particleAttach, owningEntity, owningPlayer);

        const time = GameRules.GetGameTime();
        this.Timer(
            particleName,
            () => {
                if (GameRules.GetGameTime() - time >= duration) {
                    ParticleManager.DestroyParticle(p, immediately);
                    if (callback != null) callback();
                    return null;
                }
                return 0.01;
            },
            0
        );

        return p;
    }

    static Timer(name: string, fun: Function, delay: number, entity?: CBaseEntity) {
        delay = delay || 0;
        let ent = null;
        if (entity != null) {
            if (this.IsAlive(entity) == null) {
                error('AMHC:Timer param 3: not valid entity', 2);
            }
            ent = entity;
        } else {
            ent = GameRules.GetGameModeEntity();
        }

        const time = GameRules.GetGameTime();
        ent.SetContextThink(
            DoUniqueString(name),
            () => {
                if (GameRules.GetGameTime() - time >= delay) {
                    ent.SetContextThink(
                        DoUniqueString(name),
                        () => {
                            if (!GameRules.IsGamePaused()) {
                                return fun();
                            }

                            return 0.01;
                        },
                        0
                    );
                    return null;
                }

                return 0.01;
            },
            0
        );
    }

    /**
     *
     * @param entity CDOTA_BaseNPC
     * @returns 返回true有效且存活, 返回false有效但死亡, 返回null无效实体
     */
    static IsAlive(entity: CBaseEntity) {
        if (IsValid(entity)) {
            if (entity.IsAlive()) {
                return true;
            }
            return false;
        }
        return null;
    }

    /**
     * --伤害API简化
     * @param attacker CDOTA_BaseNPC
     * @param victim CDOTA_BaseNPC
     * @param damage number
     * @param damageType DamageTypes
     * @param ability BaseAbility
     * @param scale number
     * @param tData 可选
     */
    static Damage(
        attacker: CDOTA_BaseNPC,
        victim: CDOTA_BaseNPC,
        damage: number,
        damageType: DamageTypes,
        ability: CDOTABaseAbility,
        scale?: number,
        tData?
    ) {
        if (this.IsAlive(attacker) != true || this.IsAlive(victim) != true) {
            return null;
        }
        scale = scale || 1;
        if (scale < 0) scale = 1;

        const tEntID = GameRules.EventManager.Register(
            'Event_Atk',
            event => {
                if (ability) {
                    event.ability = ability;
                }
                if (tData) {
                    for (const k in tData) {
                        event[k] = tData[k];
                    }
                }
            },
            null,
            987654321
        );
        print('===scale==:', scale);
        ApplyDamage({
            victim: victim,
            attacker: attacker,
            damage: damage * scale,
            damage_type: damageType,
            ability: ability,
        });
        GameRules.EventManager.UnRegisterByID(tEntID, 'Event_Atk');
    }

    /**星星特效 */
    static ShowStarsOnUnit(unit: CDOTA_BaseNPC_BZ, nCount: number, duration?: number) {
        duration = duration || 5;

        AMHC.AddAbilityAndSetLevel(unit, 'no_bar');

        AMHC.CreateParticle('effect/arrow/star' + nCount + '.vpcf', ParticleAttachment.OVERHEAD_FOLLOW, false, unit, duration, () => {
            AMHC.RemoveAbilityAndModifier(unit, 'no_bar');
        });
    }

    /**显示数字特效，可指定颜色，符号 */
    static CreateNumberEffect(
        entity: CBaseEntity,
        number: number,
        duration: number,
        msg_type: (typeof AMHC_MSG)[keyof typeof AMHC_MSG],
        color,
        icon_type: number
    ) {
        if (AMHC.IsAlive(entity) == null) return;

        icon_type = icon_type || 9;

        // 判断颜色
        const color_r = tonumber(color[0]) || 255;
        const color_g = tonumber(color[1]) || 255;
        const color_b = tonumber(color[2]) || 255;
        const color_vec = Vector(color_r, color_g, color_b);

        // 处理数字
        number = math.floor(number);
        const number_count = tostring(number).length + 1;

        // 创建特效
        const particle = AMHC.CreateParticle(msg_type, ParticleAttachment.CUSTOMORIGIN_FOLLOW, false, entity, duration);
        ParticleManager.SetParticleControlEnt(particle, 0, entity, 5, 'attach_hitloc', entity.GetOrigin(), true);
        ParticleManager.SetParticleControl(particle, 1, Vector(10, number, icon_type));
        ParticleManager.SetParticleControl(particle, 2, Vector(duration, number_count, 0));
        ParticleManager.SetParticleControl(particle, 3, color_vec);
    }
}

export function IsValid(handle: CEntityInstance | any) {
    return handle != null && !handle.IsNull();
}

export function fireMouseAction_symbol(vPos: Vector, hPlayer: CDOTAPlayerController, bLocal: boolean) {
    let nID: ParticleID;
    if (bLocal) {
        EmitSoundOnClient('General.Ping', hPlayer);
        nID = AMHC.CreateParticleForPlayer(
            'particles/ui_mouseactions/ping_world_hero_level.vpcf',
            ParticleAttachment.ABSORIGIN,
            false,
            hPlayer.GetAssignedHero(),
            hPlayer,
            3
        );
    } else {
        EmitSoundOnLocationForAllies(vPos, 'General.Ping', hPlayer);
        nID = AMHC.CreateParticle(
            'particles/ui_mouseactions/ping_world_hero_level.vpcf',
            ParticleAttachment.ABSORIGIN,
            false,
            hPlayer.GetAssignedHero(),
            3
        );
    }

    ParticleManager.SetParticleControl(nID, 0, vPos);
    ParticleManager.SetParticleControl(nID, 1, Vector(255, 255, 255));
    ParticleManager.SetParticleControl(nID, 12, Vector(0, 0, 0));
}

// 定义常量
export const AMHC_MSG = {
    MSG_BLOCK: 'particles/msg_fx/msg_block.vpcf',
    MSG_ORIT: 'particles/msg_fx/msg_crit.vpcf',
    MSG_DAMAGE: 'particles/msg_fx/msg_damage.vpcf',
    MSG_EVADE: 'particles/msg_fx/msg_evade.vpcf',
    MSG_GOLD: 'particles/msg_fx/msg_gold.vpcf',
    MSG_HEAL: 'particles/msg_fx/msg_heal.vpcf',
    MSG_MANA_ADD: 'particles/msg_fx/msg_mana_add.vpcf',
    MSG_MANA_LOSS: 'particles/msg_fx/msg_mana_loss.vpcf',
    MSG_MISS: 'particles/msg_fx/msg_miss.vpcf',
    MSG_POISION: 'particles/msg_fx/msg_poison.vpcf',
    MSG_SPELL: 'particles/msg_fx/msg_spell.vpcf',
    MSG_XP: 'particles/msg_fx/msg_xp.vpcf',
};

/**合并数组并去重 */
export function mergeArrays(arr1: any[], arr2: any[]): any[] {
    // 使用 Set 对象创建一个包含唯一值的数组
    const uniqueValues = Array.from(new Set([...arr1, ...arr2]));

    return uniqueValues;
}

/**生成范围内的n个不重复随机数 */
export function getRandomsInRange(min: number, max: number, n: number): number[] {
    const result: Set<number> = new Set();

    while (result.size < n) {
        const randomNumber = RandomInt(min, max);
        result.add(randomNumber);
    }

    return Array.from(result);
}

export function stringToVector(str: string) {
    const nums = str.split(' ');
    return Vector(tonumber(nums[0]), tonumber(nums[1]), tonumber(nums[2]));
}
