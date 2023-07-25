import { Constant } from "../mode/constant";
import { Path } from "./Path";

/**TP传送点路径 */
export class PathTP extends Path {

    m_eCity: CBaseEntity 				// 建筑点实体
    m_eBanner: CBaseModelEntity              // 横幅旗帜实体
    m_nPrice: number		// 价值
    m_nOwnerID: number			// 领主玩家ID

    constructor(entity: CBaseEntity) {
        super(entity)

        this.m_eCity = Entities.FindByName(null, "city_" + this.m_nID)
        this.m_eBanner = Entities.FindByName(null, "bann_" + this.m_nID) as CBaseModelEntity
        this.setBanner()
        this.m_nPrice = Constant.PATH_TO_PRICE[this.m_typePath]
    }

    /** 设置横幅旗帜 */
    setBanner(strHeroName?: string) {
        if (strHeroName == null) {
            this.m_eBanner.SetOrigin(this.m_eCity.GetOrigin() - Vector(0, 0, 1000) as Vector)
        } else {
            this.m_eBanner.SetOrigin(this.m_eCity.GetOrigin())
            this.m_eBanner.SetSkin(Constant.HERO_TO_BANNER[strHeroName])
        }
    }
}