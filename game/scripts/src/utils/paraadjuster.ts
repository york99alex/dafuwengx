/**
 *  用来修正平衡性常数的东西
    根据的是DOTA标准常数
    每点力量增加20点血
    每点智力12点蓝
    每点敏捷增加0.01点攻击速度
    每点敏捷增加0.2点护甲
 
    如果你设置的常数和这个常数不一致
    则需要同样拷贝本项目中
    scripts\npc\npc_abilities_custom.txt中的内容中关于
    ability_health_modifier
    ability_mana_modifier
    ability_atkspeed_modifier
    ability_armor_modifier
    四个技能的内容放到你自己的npc_abilities_custom.txt中
    之后在你的游戏模式的Init（确保在任何玩家选择出了任何英雄的时候）函数中
    require本文件，并调用 ParaAdjuster:Init()
 */
export class ParaAdjuster {
    static sth_para: number
    static itm_para: number
    static ats_para: number
    static ata_para: number
    static adjusting_units: CBaseEntity[]

    static init() {
        // 监听玩家选择英雄事件
        ListenToGameEvent("dota_player_pick_hero", (event) => this.OnPlayerPicked(event), this)
        // 初始化变量
        this.sth_para = 0
        this.itm_para = 0
        this.ats_para = 0
        this.ata_para = 0
        // 储存正在修正的单位列表
        this.adjusting_units = []
    }

    /**当玩家选择英雄，若有设置某个常数，且和DOTA的不一样，则开始调用修正函数 */
    static OnPlayerPicked(event: GameEventProvidedProperties & DotaPlayerPickHeroEvent) {
        const unit = EntIndexToHScript(event.heroindex as EntityIndex) as CDOTA_BaseNPC_Hero
        if (this.itm_para != 0) {
            this.ModifyData(unit, this.itm_para, "mana")
        }
        this.adjusting_units.push(unit)
    }


    static SetStrToHealth(value: number) {
        this.sth_para = value - 20
    }

    static SetIntToMana(value: number) {
        this.itm_para = value - 12
    }

    static SetAgiToAtkSpd(value: number) {
        this.ats_para = value - 0.01
    }

    static SetAgiToAmr(value: number) {
        this.ata_para = value - 0.17
    }

    /**
     * 修正函数
     * @param unit 要修正的单位
     * @param data 平衡性常数修正值，为相对DOTA标准数值的偏差，例如说你要设置力量-血量平衡性常数为15，那么这个data数值会为-5
     * @param modi_name 修正类型
     */
    static ModifyData(unit: CDOTA_BaseNPC_Hero, data: number, mod_name: string) {

        function funUpdate() {
            // 如果数据储存不存在，则初始化之
            if (!unit["recorder"]) unit["recorder"] = []
            if (!unit["recorder__modified_data"]) unit["recorder__modified_data"] = []
            if (!unit["recorder__" + mod_name]) unit["recorder__" + mod_name] = []
            if (!unit["recorder__modified_data__" + mod_name]) unit["recorder__modified_data__" + mod_name] = []


            // 获取当前数值和修正后的对应数值
            let current_data: number
            let modified_data: number
            if (mod_name == "mana") {
                current_data = unit.GetIntellect()
                modified_data = unit.GetMaxMana()
            }

            // 如果当前的数值和储存的数值不一致（则说明单位的力量等数值发生了变更）
            if (current_data != unit["recorder__" + mod_name]) {
                // 设置技能名称和对应的正数/负数Modifier名
                const ability_name = "ability_" + mod_name + "_modifier"
                const mod_name_pos_prefix = "modifier_" + mod_name + "_mod_"
                const mod_name_neg_prefix = "modifier_" + mod_name + "_mod_neg_"

                // 为单位增加修正的技能
                let modifierAbility = unit.FindAbilityByName(ability_name) as CDOTA_Ability_DataDriven
                if (!modifierAbility) {
                    unit.AddAbility(ability_name)
                    modifierAbility = unit.FindAbilityByName(ability_name) as CDOTA_Ability_DataDriven
                    modifierAbility.SetLevel(1)
                }

                // 二进制表
                const bitTable = [512, 256, 128, 64, 32, 16, 8, 4, 2, 1]

                // 循环单位的所有Modifier，如果存在这个Modifier，那么移除之
                const modCount = unit.GetModifierCount()
                for (let i = 0; i <= modCount; i++) {
                    for (let u = 0; u < bitTable.length; u++) {
                        const val = bitTable[i]
                        if (unit.GetModifierNameByIndex(i) == mod_name_pos_prefix + val) {
                            unit.RemoveModifierByName(mod_name_pos_prefix + val)
                        }
                        if (unit.GetModifierNameByIndex(i) == mod_name_neg_prefix + val) {
                            unit.RemoveModifierByName(mod_name_neg_prefix + val)
                        }
                    }
                }

                // 计算需要修正的数值
                print("===paraadjuster===ZhiLi=", current_data)
                let to_modify_value = data * math.floor(current_data + 0.01)
                let mod_prefix: string
                // 正负数处理
                if (to_modify_value > 0) {
                    mod_prefix = mod_name_pos_prefix
                } else {
                    mod_prefix = mod_name_neg_prefix
                    to_modify_value = 0 - to_modify_value
                }
                // 如果有很大的数据，大于1023，那么增加N个512先干到512以下
                if (to_modify_value > 1023) {
                    const out_count = math.floor(to_modify_value / 512)
                    for (let i = 1; i <= out_count; i++) {
                        modifierAbility.ApplyDataDrivenModifier(unit, unit, mod_prefix + "512", {})
                    }
                    to_modify_value -= out_count * 512
                }
                // 循环增加Modifier，最终增加到正确个数的Modifier
                for (let p = 0; p < bitTable.length; p++) {
                    const val = bitTable[p]
                    const count = math.floor(to_modify_value / val)
                    if (count >= 1) {
                        modifierAbility.ApplyDataDrivenModifier(unit, unit, mod_prefix + val, {})
                        to_modify_value -= val
                    }
                }

                // 为单位移除这个技能
                unit.RemoveAbility(ability_name)

                // 再记录一次数值
                if (mod_name == "mana") {
                    current_data = unit.GetIntellect()
                    modified_data = unit.GetMaxMana()
                }

                unit["recorder__" + mod_name] = current_data
                unit["recorder__modified_data__" + mod_name] = modified_data
            }
        }

        funUpdate()

        GameRules.EventManager.Register("Event_SxChange", (event: { entity: CDOTA_BaseNPC_Hero }) => {
            if (unit == null || unit.IsNull()) {
                return true
            }
            if (event.entity != unit) {
                return
            }
            funUpdate()
            Timers.CreateTimer(0.01, () => {
                funUpdate()
            })
        })
    }
}