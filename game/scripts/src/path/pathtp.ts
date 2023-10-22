import { Constant } from "../mode/constant";
import { PS_InPrison, TypeOprt } from "../mode/gamemessage";
import { Player } from "../player/player";
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
        // strHeroName为空就表示隐藏旗帜
        if (strHeroName == null) {
            this.m_eBanner.SetOrigin(this.m_eCity.GetOrigin() - Vector(0, 0, 1000) as Vector)
        } else {
            this.m_eBanner.SetOrigin(this.m_eCity.GetOrigin())
            this.m_eBanner.SetSkin(Constant.HERO_TO_BANNER[strHeroName] + 1)
        }
    }

    onPath(player: Player): void {
        super.onPath(player)

        if (this.m_nOwnerID == null) {
            // 无主之地,发送安营扎寨操作
            const tabOprt = {
                nPlayerID: player.m_nPlayerID,
                typeOprt: TypeOprt.TO_AYZZ,
                typePath: this.m_typePath,
                nPathID: this.m_nID
            }
            // 操作前处理上一个(如果有的话)
            GameRules.GameConfig.autoOprt(tabOprt.typeOprt, player)
            GameRules.GameConfig.sendOprt(tabOprt)
            print("======发送安营扎寨操作======")
        } else if (player.m_nPlayerID == this.m_nOwnerID) {
            // 己方TP点,给传送卡牌
            // TODO: player:setCardAdd(card)
        } else {
            // 敌方TP点,交过路费
            const playerOwn = GameRules.PlayerManager.getPlayer(this.m_nOwnerID)
            // 领主未进监狱
            if (0 === (PS_InPrison & playerOwn.m_nPlayerState)) {
                const nGold = Constant.PATH_TOLL_TP[playerOwn.m_tabMyPath[this.m_typePath].length - 1]
                player.giveGold(nGold, playerOwn)
                GameRules.GameConfig.showGold(playerOwn, nGold)
                GameRules.GameConfig.showGold(player, -nGold)
                // TODO:给钱音效
                // EmitGlobalSound()
            }
        }
    }

    setOwner(player?: Player) {
        if (player == null) {
            this.setPathState(Constant.TypePathState.None)
            this.setBanner()
            this.m_nOwnerID = null
        } else {
            // TODO:占领音效
            // EmitGlobalSound("Custom.AYZZ")

            this.setBanner(player.m_eHero.GetUnitName())
            this.m_nOwnerID = player.m_nPlayerID
        }
    }
}