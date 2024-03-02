import { TP_MONSTER_1, TP_SHOP_SECRET, TP_SHOP_SIDE, TP_START } from '../../constants/gamemessage';
import { PathMonster } from '../../path/pathtype/pathmonster';
import { Player } from '../../player/player';
import { Card } from '../card';

/**小野 10005 */
export class Card_MONSTER_SMALL extends Card {
    CastFilterResult(): UnitFilterResult {
        print('===Card CastFilterResult', Card_MONSTER_SMALL.name);
        if (!this.CanUseCard()) return UnitFilterResult.FAIL_CUSTOM;
        return UnitFilterResult.SUCCESS;
    }

    OnSpellStart(): void {
        GameRules.GameConfig.autoOptionalOprt(this.GetOwner());
        const owner = this.GetOwner();
        const paths = GameRules.PathManager.getPathByType(TP_MONSTER_1) as PathMonster[];
        for (const path of paths) {
            if ([TP_SHOP_SECRET, TP_SHOP_SIDE].includes(owner.m_pathCur.m_typePath)) {
                // 玩家在商店进入打野，回来不能再次购买
                const nBuy = owner.m_nBuyItem;
                GameRules.EventManager.Register(
                    'Event_AtkMosterEnd',
                    (event: { entity: CDOTA_BaseNPC_Hero; bMoveBack: boolean; bInPrison: boolean }) => {
                        if (event.entity == owner.m_eHero) {
                            if (!event.bInPrison) {
                                // 打野结束返回商店路径，设置回原购买次数
                                GameRules.EventManager.Register(
                                    'Event_SetBuyState',
                                    (eventBuy: { nCount: number; buyState: number; player: Player }) => {
                                        if (eventBuy.player == owner) {
                                            eventBuy.nCount = nBuy;
                                            return true;
                                        }
                                    }
                                );
                            }
                            return true;
                        }
                    },
                    null,
                    1000
                );
            } else if (owner.m_pathCur.m_typePath == TP_START) {
                // 在进入起点不刷钱
                GameRules.EventManager.Register('Event_WageGold', (eventGold: { player: Player; bIgonre: boolean }) => {
                    if (eventGold.player == owner) {
                        eventGold.bIgonre = true;
                        return true;
                    }
                });
            }
            path.setAtkerAdd(owner, owner.m_pathCur);
            GameRules.GameConfig.skipRoll(owner.m_nPlayerID);
            break;
        }
    }
}
