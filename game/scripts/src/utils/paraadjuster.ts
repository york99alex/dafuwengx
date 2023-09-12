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
    static __sth_para: number
    static __itm_para: number
    static __ats_para: number
    static __ata_para: number
    static __adjusting_units: CBaseEntity[]

    static __recorder__
    static __lastData__
    static __currentData__

    static init() {
        // 监听玩家选择英雄事件
        ListenToGameEvent("dota_player_pick_hero", (event) => this.OnPlayerPicked(event), this)
        // 初始化变量
        this.__sth_para = 0
        this.__itm_para = 0
        this.__ats_para = 0
        this.__ata_para = 0
        // 储存正在修正的单位列表
        this.__adjusting_units = []
    }

    /**当玩家选择英雄，若有设置某个常数，且和DOTA的不一样，则开始调用修正函数 */
    static OnPlayerPicked(event: GameEventProvidedProperties & DotaPlayerPickHeroEvent) {
        const unit = EntIndexToHScript(event.heroindex as EntityIndex) as CDOTA_BaseNPC_Hero
        let nLevel = unit.GetLevel()
        if (nLevel == 1 || nLevel < 11) {
            unit.SetMana(1)
            unit.SetMaxMana(1)
        }

        GameRules.EventManager.Register("Event_SxChange", (eventData: { entity: CDOTA_BaseNPC_Hero }) => {
            if (unit == null || unit.IsNull()) return true
            if (eventData.entity != unit) return
            funUpdata()
            Timers.CreateTimer(0.01, () => { funUpdata() })
        })

        function funUpdata() {
            // 先初始化__recorder__,__lastData__,__currentData__数据,检查,再赋值
            
            nLevel = unit.GetLevel()
            const current_data = unit.GetIntellect()
            const modified_data = unit.GetMaxMana()
            if (nLevel < 11) {
                unit.SetMaxMana(nLevel)
            }
        }

    }

    static SetStrToHealth(value: number) {
        this.__sth_para = value - 20
    }

    static SetIntToMana(value: number) {
        this.__itm_para = value - 12
    }

    static SetAgiToAtkSpd(value: number) {
        this.__ats_para = value - 0.01
    }

    static SetAgiToAmr(value: number) {
        this.__ata_para = value - 0.17
    }

    /**
     * 修正函数
     * @param unit 要修正的单位
     * @param data 平衡性常数修正值，为相对DOTA标准数值的偏差，例如说你要设置力量-血量平衡性常数为15，那么这个data数值会为-5
     * @param modi_name 修正类型
     */
    static ModifyData(unit: CBaseEntity, data: number, modi_name: string) {
    }
}