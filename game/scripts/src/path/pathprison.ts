import { Path } from "./Path"

export class PathPrison extends Path {
    m_tabENPC = null			// 路径上的全部NPC实体（监狱玩家）
    m_tabCount = null          // 玩家持续在监狱的次数记录
    m_eCity = null				// 建筑点实体

    constructor(entity:CBaseEntity){
        super(entity)
    }
}