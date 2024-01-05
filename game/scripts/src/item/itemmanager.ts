import { TSBaseItem } from './tsBaseItem';
import { Player } from '../player/player';
import { AMHC, AMHC_MSG, IsValid, fireMouseAction_symbol } from '../utils/amhc';
import { ParaAdjuster } from '../utils/paraadjuster';
import { KeyValues } from '../kv';
import { BuyState_Secret, BuyState_Side, BuyState_SideAndSecret, TP_SHOP_SECRET, TP_SHOP_SIDE } from '../constants/gamemessage';
import { HudError } from '../mode/S2Cmode/huderror';
import { ItemShare } from './itemshare';

const INDEX_ITEM = 6;
const INDEX_BACK = 8;
export class ItemManager {
    // 记录合成物品，用于过滤重复合成
    m_tCombinable: [];
    // 记录玩家装备CD，用于自动施法类装备，索引的是记录装备的slotIndex
    m_tItemsCD: {
        [nPlayerID: number]: {
            [strName: string]: number;
        };
    };

    constructor() {
        this.m_tCombinable = [];
    }

    init() {
        GameRules.EventManager.Register('Event_ItemAdd', (event: ItemAddedToInventoryFilterEvent) => this.onEvent_ItemAdd(event), this);
        GameRules.EventManager.Register('Event_ItemMove', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemMove(event), this);
        GameRules.EventManager.Register(
            'Event_ItemDel',
            (event: { item: CDOTA_Item; entity: CDOTA_BaseNPC; nItemEntID: EntityIndex; nItemSlot: -1 | InventorySlot; sItemName: string }) =>
                this.onEvent_ItemDel(event),
            this
        );
        GameRules.EventManager.Register('Event_ItemSell', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemSell(event), this);
        GameRules.EventManager.Register('Event_ItemGive', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemGive(event), this);
        GameRules.EventManager.Register('Event_ItemLock', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemLock(event), this);
        GameRules.EventManager.Register('Event_ItemBuy', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemBuy(event), this);
        GameRules.EventManager.Register(
            'Event_ItemInvalid',
            (event: { item: CDOTA_Item; entity: CDOTA_BaseNPC; nItemEntID: EntityIndex; nItemSlot: -1 | InventorySlot; sItemName: string }) =>
                this.onEvent_ItemInvalid(event),
            this
        );
        GameRules.EventManager.Register('Event_ItemValid', () => this.onEvent_ItemValid(), this);
        GameRules.EventManager.Register('Event_ItemSplit', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemSplit(event), this, -987654321);

        GameRules.ItemShare = new ItemShare();
        GameRules.ItemShare.init();

        ListenToGameEvent('dota_item_combined', event => this.onEvent_ItemCombined(event), this);
    }

    /**物品合成 */
    onEvent_ItemCombined(event: GameEventProvidedProperties & DotaItemCombinedEvent) {
        print('===ItemManager===onEvent_ItemCombined');
        const player = GameRules.PlayerManager.getPlayer(event.PlayerID);
        if (!player || !IsValid(player.m_eHero)) return;

        const curMana = player.m_eHero.GetMana();
        Timers.CreateTimer(0.01, () => {
            ParaAdjuster.ModifyMana(player.m_eHero);
            player.m_eHero.SetMana(curMana);
        });
    }

    /**获得物品 */
    onEvent_ItemAdd(event: ItemAddedToInventoryFilterEvent) {
        print('===ItemManager===onEvent_ItemAdd===0');
        const item = EntIndexToHScript(event.item_entindex_const) as CDOTA_Item;
        const caster = EntIndexToHScript(event.inventory_parent_entindex_const) as CDOTA_BaseNPC;
        if (!IsValid(caster) || !IsValid(item)) return;

        const npc = EntIndexToHScript(event.inventory_parent_entindex_const) as CDOTA_BaseNPC;
        if (npc && npc.IsRealHero()) {
            const curMana = npc.GetMana();
            print('===ItemManager===onEvent_ItemAdd===ModifyMana===curMana:', curMana);
            Timers.CreateTimer(0, () => {
                print('===ItemManager===onEvent_ItemAdd===ModifyMana');
                ParaAdjuster.ModifyMana(npc);
                npc.SetMana(curMana);
            });
        }
        print('===ItemManager===onEvent_ItemAdd===itemName:' + item.GetAbilityName() + '===itemOwner:' + caster.GetUnitName());
    }

    onEvent_ItemMove(event: ExecuteOrderFilterEvent) {
        if (event['bIgnore']) return;
        print('===ItemManager===onEvent_ItemMove');
        DeepPrintTable(event);
        const item = EntIndexToHScript(event.entindex_ability) as CDOTA_Item;
        const caster = EntIndexToHScript(event.units['0']) as CDOTA_BaseNPC;
        if (!IsValid(item)) return;
        if (event.entindex_target < INDEX_ITEM) {
            // 放入物品栏
            if (item.GetItemSlot() >= INDEX_ITEM) {
                // 从背包放入
                if (!IsValid(caster)) return;

                // 触发物品生效
                GameRules.EventManager.FireEvent('Event_ItemValid', { item: item });

                // 被交换物品触发失效
                const item2 = caster.GetItemInSlot(event.entindex_target);
                if (item2) {
                    GameRules.EventManager.FireEvent('Event_ItemInvalid', {
                        item: item2,
                        entity: caster,
                        nItemEntID: item2.GetEntityIndex(),
                        nItemSlot: item2.GetItemSlot(),
                        sItemName: item2.GetAbilityName(),
                    });
                }
            }
            if (caster.IsRealHero()) {
                let curMana0 = caster.GetMana();
                Timers.CreateTimer(() => {
                    print('===ItemManager===onEvent_ItemMove===0===ModifyMana');
                    ParaAdjuster.ModifyMana(caster);
                    if (curMana0 > caster.GetMaxMana()) curMana0 = caster.GetMaxMana();
                    caster.SetMana(curMana0);
                });
                Timers.CreateTimer(5.9, () => {
                    if (!item || item.IsNull()) {
                        print('===ItemManager===onEvent_ItemMove===item is null');
                        return;
                    } else if (item.GetItemState() == 0) {
                        // 物品未就绪
                        return 0.01;
                    } else {
                        // 物品就绪
                        let curMana = caster.GetMana();
                        print('===ItemManager===onEvent_ItemMove===1===ModifyMana');
                        ParaAdjuster.ModifyMana(caster);
                        // 不允许超出蓝量上限
                        if (curMana > caster.GetMaxMana()) curMana = caster.GetMaxMana();
                        caster.SetMana(curMana);
                        return;
                    }
                });
            }
        } else if (event.entindex_target > INDEX_BACK) {
            // 放入储存库, 禁止
            event['bIgnore'] = true;
        } else {
            // 放入背包
            if (item.GetItemSlot() < INDEX_ITEM) {
                // 从物品栏放入
                const caster = EntIndexToHScript(event.units['0']) as CDOTA_BaseNPC;
                if (!IsValid(caster)) return;

                // 触发物品失效
                GameRules.EventManager.FireEvent('Event_ItemInvalid', {
                    item: item,
                    entity: caster,
                    nItemEntID: item.GetEntityIndex(),
                    nItemSlot: item.GetItemSlot(),
                    sItemName: item.GetAbilityName(),
                });

                // 触发物品生效
                const item2 = caster.GetItemInSlot(event.entindex_target);
                if (item2) GameRules.EventManager.FireEvent('Event_ItemValid', { item: item2 });
            }
            if (caster.IsRealHero()) {
                let curMana = caster.GetMana();
                Timers.CreateTimer(() => {
                    print('===ItemManager===onEvent_ItemMove===2===ModifyMana');
                    ParaAdjuster.ModifyMana(caster);
                    // 不允许超出蓝量上限
                    if (curMana > caster.GetMaxMana()) curMana = caster.GetMaxMana();
                    caster.SetMana(curMana);
                });
            }
        }
    }

    /**失去物品 */
    onEvent_ItemDel(event: { item: CDOTA_Item; entity: CDOTA_BaseNPC; nItemEntID: EntityIndex; nItemSlot: -1 | InventorySlot; sItemName: string }) {
        print('===ItemManager===onEvent_ItemDel');
    }

    /**出售物品 */
    onEvent_ItemSell(event: ExecuteOrderFilterEvent) {
        if (event['bIgnore']) return;
        event['bIgnore'] = true;

        const caster = EntIndexToHScript(event.units['0']) as CDOTA_BaseNPC;
        const item = EntIndexToHScript(event.entindex_ability) as CDOTA_Item;
        if (!IsValid(caster) || !IsValid(item)) return;

        print('===ItemManager===onEvent_ItemSell===0');
        GameRules.EventManager.FireEvent('Event_ItemDel', {
            item: item,
            entity: caster,
            nItemEntID: item.GetEntityIndex(),
            nItemSlot: item.GetItemSlot(),
            sItemName: item.GetAbilityName(),
        });
        print('===ItemManager===onEvent_ItemSell===1');

        const player = GameRules.PlayerManager.getPlayer(caster.GetPlayerOwnerID());
        // 出售操作限制
        if (GameRules.GameConfig.m_nOrderID != player.m_nPlayerID) {
            HudError.FireLocalizeError(player.m_nPlayerID, 'Error_SellNotSelfRound');
            return;
        }
        const beforeGold = player.m_eHero.GetGold();
        caster.SellItem(item);
        const afterGold = player.m_eHero.GetGold();
        // 计算价格
        const nGold = afterGold - beforeGold;
        GameRules.GameConfig.showGold(player, nGold);
        player.setGold(nGold);
        // 音效
        EmitSoundOnClient('Custom.Gold.Sell', player.m_oCDataPlayer);
        // 出售价格特效
        AMHC.CreateNumberEffect(caster, nGold, 3, AMHC_MSG.MSG_MISS, [255, 215, 0], 0);
        // 修正蓝量
        const curMana = player.m_eHero.GetMana();
        Timers.CreateTimer(() => {
            ParaAdjuster.ModifyMana(player.m_eHero);
            player.m_eHero.SetMana(curMana);
        });
    }

    /**给予物品 */
    onEvent_ItemGive(event: ExecuteOrderFilterEvent) {
        if (event['bIgnore']) return;
        event['bIgnore'] = true;

        // TODO:
    }

    /**锁定物品 */
    onEvent_ItemLock(event: ExecuteOrderFilterEvent) {}

    /**购买物品 */
    onEvent_ItemBuy(event: ExecuteOrderFilterEvent) {
        if (event['bIgnore']) return;
        event['bIgnore'] = true;

        const caster = EntIndexToHScript(event.units['0']) as CDOTA_BaseNPC;
        if (!caster || caster.IsNull()) return;

        // print('======onEvent_ItemBuy======');
        // DeepPrintTable(event);
        // print('======onEvent_ItemBuy===End');

        // 物品信息
        const itemInfo = KeyValues.ItemsKV[event.shop_item_name];
        if (!itemInfo) return;

        const player = GameRules.PlayerManager.getPlayer(caster.GetPlayerOwnerID());
        if (!player) return;

        // 验证购买次数
        if (player.m_nBuyItem == 0) {
            HudError.FireLocalizeError(caster.GetPlayerOwnerID(), 'Error_ItemNoCount');
            return;
        }
        // 验证物品商店
        if (itemInfo['SecretShop'] == 1) {
            print('===ItemManager===onEvent_ItemBuy===BuyState', player.m_typeBuyState);
            print('player.m_typeBuyState < BuyState_Secret :', player.m_typeBuyState < BuyState_Side);
            print('player.m_typeBuyState < BuyState_Secret :', player.m_typeBuyState < BuyState_Secret);
            print('player.m_typeBuyState < BuyState_Secret :', player.m_typeBuyState < BuyState_SideAndSecret);
            print('player.m_typeBuyState < BuyState_Secret :', player.m_typeBuyState < 1);
            print('player.m_typeBuyState < BuyState_Secret :', player.m_typeBuyState < 2);
            print('player.m_typeBuyState < BuyState_Secret :', player.m_typeBuyState < 3);
            // 神秘商店
            if (player.m_typeBuyState < BuyState_Secret || !player.m_eHero.IsInRangeOfShop(ShopType.SECRET, true)) {
                // 不符合条件，提示错误并返回
                HudError.FireLocalizeError(caster.GetPlayerOwnerID(), 'Error_ItemSecret');
                const tPath = GameRules.PathManager.getPathByType(TP_SHOP_SECRET);
                for (const path of tPath) {
                    fireMouseAction_symbol(path.m_entity.GetAbsOrigin(), player.m_oCDataPlayer, true);
                }
                return;
            }
        } else {
            // 边路商店
            if (player.m_typeBuyState != BuyState_Side || player.m_typeBuyState > BuyState_Secret) {
                // 不符合条件，提示错误并返回
                HudError.FireLocalizeError(caster.GetPlayerOwnerID(), 'Error_ItemSide');
                const tPath = GameRules.PathManager.getPathByType(TP_SHOP_SIDE);
                for (const path of tPath) {
                    fireMouseAction_symbol(path.m_entity.GetAbsOrigin(), player.m_oCDataPlayer, true);
                }
                return;
            }
        }

        // 验证背包空间

        // 玩家购买物品
        player.getItemBuy(event.shop_item_name);
    }

    /**物品失效 */
    onEvent_ItemInvalid(event: {
        item: CDOTA_Item;
        entity: CDOTA_BaseNPC;
        nItemEntID: EntityIndex;
        nItemSlot: -1 | InventorySlot;
        sItemName: string;
    }) {
        // TODO: 检查，移除不能自动移除的不合法Buff

        if (event.entity.IsRealHero()) {
            print('===ItemManager===onEvent_ItemInvalid===ModifyMana');
            ParaAdjuster.ModifyMana(event.entity);
        }
    }

    /**物品生效 */
    onEvent_ItemValid() {}

    /**拆分物品 */
    onEvent_ItemSplit(event: ExecuteOrderFilterEvent) {}

    /**
     * 检查是否有重复物品，并统一为旧装备的CD
     */
    isSameItemCD(item: TSBaseItem, player: Player) {
        if (!IsValid(item)) return;
        for (let i = 0; i < 9; i++) {
            const itemTemp = player.m_eHero.GetItemInSlot(i);
            if (item.GetItemSlot() != i && itemTemp && IsValid(itemTemp) && itemTemp.GetName() == item.GetName()) {
                if (!itemTemp.IsCooldownReady()) {
                    return math.ceil(itemTemp.GetCooldownTimeRemaining());
                } else {
                    return false;
                }
            }
        }
    }

    /**移除物品 */
    removeItem(unit: CDOTA_BaseNPC, item: CDOTA_Item) {
        if (!unit || unit.IsNull()) return;
        if (!item || item.IsNull()) return;
        GameRules.EventManager.FireEvent('Event_ItemDel', {
            item: item,
            entity: unit,
            nItemEntID: item.GetEntityIndex(),
            nItemSlot: item.GetItemSlot(),
            sItemName: item.GetAbilityName(),
        });
        unit.RemoveItem(item);
        if (unit.IsRealHero()) {
            print('===ItemManager===removeItem===ModifyMana');
            ParaAdjuster.ModifyMana(unit);
        }
    }
}

export function Get06ItemByName(npc: CDOTA_BaseNPC, sName: string, itemIgnore?: TSBaseItem): CDOTA_Item {
    for (let i = 0; i < 6; i++) {
        let item = npc.GetItemInSlot(i);
        if (item && item != itemIgnore && !item.IsNull() && item.GetAbilityName() == sName) {
            return item;
        }
    }
}
