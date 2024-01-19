import { Treasure_Gold, Treasure_Item, TypeOprt } from '../../constants/gamemessage';
import { Player } from '../../player/player';
import { AMHC } from '../../utils/amhc';
import { Path } from '../Path';

/**宝藏路径 */
export class PathTreasure extends Path {
    constructor(entity: CBaseEntity) {
        super(entity);
    }

    onPath(player: Player): void {
        super.onPath(player);

        AMHC.AddAbilityAndSetLevel(player.m_eHero, 'no_bar');

        // 特效
        let nPtclID = AMHC.CreateParticle(
            'particles/econ/events/ti9/shovel_revealed_loot_variant_0_treasure.vpcf',
            ParticleAttachment.POINT,
            false,
            player.m_eHero,
            3
        );
        ParticleManager.SetParticleControl(nPtclID, 0, (player.m_eHero.GetOrigin() + Vector(0, 0, 250)) as Vector);
        ParticleManager.SetParticleControl(nPtclID, 1, (player.m_eHero.GetOrigin() + Vector(0, 0, 250)) as Vector);
        EmitGlobalSound('Custom.Treasure.Begin');
        EmitSoundOn('Custom.Treasure.Channel', player.m_eHero);
        Timers.CreateTimer(1, () => {
            StopSoundOn('Custom.Treasure.Channel', player.m_eHero);
            EmitGlobalSound('Custom.Treasure.End');

            nPtclID = AMHC.CreateParticle('particles/generic_gameplay/rune_bounty_gold.vpcf', ParticleAttachment.POINT, false, player.m_eHero, 4);
            ParticleManager.SetParticleControl(nPtclID, 0, (player.m_eHero.GetOrigin() + Vector(0, 0, 300)) as Vector);
            ParticleManager.SetParticleControl(nPtclID, 1, (player.m_eHero.GetOrigin() + Vector(0, 0, 300)) as Vector);
            nPtclID = AMHC.CreateParticle(
                'particles/generic_gameplay/rune_bounty_owner.vpcf',
                ParticleAttachment.POINT,
                false,
                player.m_eHero,
                4,
                () => {
                    AMHC.RemoveAbilityAndModifier(player.m_eHero, 'no_bar');
                }
            );
            ParticleManager.SetParticleControl(nPtclID, 0, (player.m_eHero.GetOrigin() + Vector(0, 0, 300)) as Vector);
            ParticleManager.SetParticleControl(nPtclID, 1, (player.m_eHero.GetOrigin() + Vector(0, 0, 300)) as Vector);
        });

        GameRules.PlayerManager.broadcastMsg('GM_OperatorFinished', {
            nPlayerID: player.m_nBuyItem,
            typeOprt: TypeOprt.TO_TREASURE,
            typePath: this.m_typePath,
            nPathID: this.m_nID,
            data: this.getTreasure(RandomInt(Treasure_Gold, Treasure_Item), player),
        });
    }

    /**给英雄获取宝藏
     * return {type: number, treasure: string | number}
     */
    getTreasure(type: number, player: Player) {
        const result: any = {};
        if (type == Treasure_Gold) {
            const nGold = RandomInt(1, 10) * 100;
            player.setGold(nGold);
            GameRules.GameConfig.showGold(player, nGold);
            result.type = Treasure_Gold;
            result.treasure = nGold;
        } else if (type == Treasure_Item) {
            if (player.m_eHero.GetNumItemsInInventory() >= 9) {
                // 背包满了，重新调用给钱
                return this.getTreasure(Treasure_Gold, player);
            }

            const itemName = RandomSupplyItem(RandomInt(1, 2));
            result.type = Treasure_Item;
            result.treasure = itemName;

            const item = player.m_eHero.AddItemByName(itemName);
            if (item) item.SetPurchaseTime(0);
        }
        // TODO: 设置游戏记录
        // GameRecord

        player.setSumGold();
        return result;
    }
}

/**
 * 随机补给装备
 * 返回itemName
 */
export function RandomSupplyItem(level: number) {
    const items = GameRules.Supply.m_tItems[level];
    return items[RandomInt(0, items.length - 1)].name;
}
