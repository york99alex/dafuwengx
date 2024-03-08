/**卡牌类型，卡牌string映射类型number */
declare const enum CardType {
    /**小野 */
    Card_MONSTER_SMALL = 10005,
    /**大野 */
    Card_MONSTER_LARGE = 10006,
    /**远古野 */
    Card_MONSTER_ANCIENT = 10007,
    /**拉野 */
    Card_MONSTER_CREEP_STACKING = 10008,
    /**窃取 */
    Card_MAGIC_Card_Steal = 20001,
    /**移形换位 */
    Card_MAGIC_Swap = 20002,
    /**两级反转 */
    Card_MAGIC_ReversePolarity = 20003,
    /**恶念瞥视 */
    Card_MAGIC_Glimpse = 20004,
    /**阎刃 */
    Card_MAGIC_InfernalBlade = 20005,
    /**血怒 */
    Card_BUFF_Bloodrage = 20020,
    /**魔瓶 */
    Card_MAGIC_Bottle = 20006,
    /**魔瓶（双倍神符） */
    Card_MAGIC_BottleDouble = 20007,
    /**魔瓶（加速神符） */
    Card_MAGIC_BottleHaste = 20008,
    /**魔瓶（隐身神符） */
    Card_MAGIC_BottleInvisibility = 20010,
    /**魔瓶（回复神符） */
    Card_MAGIC_BottleRegeneration = 20011,
    /**魔瓶（赏金神符） */
    Card_MAGIC_BottleBounty = 20012,
    /**魔瓶（奥术神符） */
    Card_MAGIC_BottleArcane = 20013,
    /**魔瓶（智慧神符） */
    Card_MAGIC_BottleXP = 20014,
    /**魔瓶（护盾神符） */
    Card_MAGIC_BottleShield = 20015,
    /**刀刀兄弟 */
    Card_EVENT_DoDoBrother = 30001,
    /**商店卡 */
    Card_EVENT_Shop = 30002,
    /**阎刃333 */
    Card_EVENT_Infernal_Blade_333 = 30003,
    /**上帝之手 */
    Card_EVENT_Hand_Of_God = 30004,
    /**事件 闪烁匕首 */
    Card_EVENT_Blink = 30005,
    /**团队之手 */
    Card_EVENT_Hand_Of_Midas = 30006,
    /**玻璃大炮 */
    Card_EVENT_Glass_Canon = 30007,
    /**卡牌双雄 */
    Card_EVENT_Card_Double = 30008,
    /**刷新球碎片 */
    Card_EVENT_Card_Refresher = 30009,
    /**奶酪 */
    Card_EVENT_Card_Cheese = 30010,
    /**骰子-6 */
    Card_EVENT_Card_Roll_6 = 30011,
    /**骰子-3 */
    Card_EVENT_Card_Roll_3 = 30012,
}
