import { item_qtg_tpscroll } from '../../item/items/item_qtg_tpscroll';
import { HERO_TO_BANNER, PATH_TOLL_TP, PATH_TO_PRICE, TypePathState } from '../../constants/constant';
import { PS_InPrison, TypeOprt } from '../../constants/gamemessage';
import { modifier_unselect } from '../../modifiers/util/modifier_unselect';
import { Player } from '../../player/player';
import { Path } from '../path';

/**TP传送点路径 */
export class PathTP extends Path {
    m_eCity: CDOTA_BaseNPC_Building; // 建筑点实体
    m_eBanner: CBaseModelEntity; // 横幅旗帜实体
    m_nPrice: number; // 价值
    m_nOwnerID: number; // 领主玩家ID

    constructor(entity: CBaseEntity) {
        super(entity);

        this.m_eCity = Entities.FindByName(null, 'city_' + this.m_nID) as CDOTA_BaseNPC_Building;
        this.m_eCity.AddNewModifier(null, null, modifier_unselect.name, null);
        this.m_eBanner = Entities.FindByName(null, 'bann_' + this.m_nID) as CBaseModelEntity;
        this.setBanner();
        this.m_nPrice = PATH_TO_PRICE[this.m_typePath];
    }

    /** 设置横幅旗帜 */
    setBanner(strHeroName?: string) {
        // strHeroName为空就表示隐藏旗帜
        if (strHeroName == null) {
            this.m_eBanner.SetOrigin((this.m_eCity.GetOrigin() - Vector(0, 0, 1000)) as Vector);
        } else {
            this.m_eBanner.SetOrigin(this.m_eCity.GetOrigin());
            this.m_eBanner.SetSkin(HERO_TO_BANNER[strHeroName] + 1);
        }
    }

    /**设置领主 */
    setOwner(player?: Player) {
        if (player == null) {
            this.setPathState(TypePathState.None);
            this.setBanner();
            this.m_nOwnerID = null;
        } else {
            // 占领音效
            EmitGlobalSound('Custom.AYZZ');

            this.setBanner(player.m_eHero.GetUnitName());
            this.m_nOwnerID = player.m_nPlayerID;
        }
    }

    /**触发路径 */
    onPath(player: Player): void {
        super.onPath(player);

        if (this.m_nOwnerID == null) {
            // 无主之地,发送安营扎寨操作
            const tabOprt = {
                nPlayerID: player.m_nPlayerID,
                typeOprt: TypeOprt.TO_AYZZ,
                typePath: this.m_typePath,
                nPathID: this.m_nID,
            };
            // 操作前处理上一个(如果有的话)
            GameRules.GameConfig.autoOprt(tabOprt.typeOprt, player);
            GameRules.GameConfig.sendOprt(tabOprt);
            print('======发送安营扎寨操作======');
        } else if (player.m_nPlayerID == this.m_nOwnerID) {
            // 己方TP点,给传送卷轴
            player.m_eHero.AddItemByName(item_qtg_tpscroll.name);
        } else {
            // 敌方TP点,交过路费
            const playerOwn = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
            // 领主未进监狱
            if (0 == bit.band(PS_InPrison, playerOwn.m_nPlayerState)) {
                const nGold = PATH_TOLL_TP[playerOwn.m_tabMyPath[this.m_typePath].length - 1];
                player.giveGold(nGold, playerOwn);
                GameRules.GameConfig.showGold(playerOwn, nGold);
                GameRules.GameConfig.showGold(player, -nGold);
                // 给钱音效
                EmitGlobalSound('Custom.Gold.Sell');
            }
        }
    }

    TP(oPlayer: Player) {
        EmitSoundOn('Custom.TP.Begin', oPlayer.m_eHero);

        // 传送进入wait
        GameRules.GameLoop.GameStateService.send('towait');
        oPlayer.m_eHero.StartGesture(GameActivity.DOTA_TELEPORT);
        Timers.CreateTimer(2.5, () => {
            // 处理传送
            StopSoundOn('Custom.TP.Begin', oPlayer.m_eHero);
            EmitSoundOn('Custom.TP.End', oPlayer.m_eHero);

            oPlayer.m_eHero.RemoveGesture(GameActivity.DOTA_TELEPORT);
            oPlayer.m_eHero.StartGesture(GameActivity.DOTA_TELEPORT_END);

            if (0 < bit.band(PS_InPrison, oPlayer.m_nPlayerState)) {
                return;
            }
            oPlayer.blinkToPath(this);
            GameRules.GameLoop.GameStateService.send('towaitoprt');
        });
    }
}
