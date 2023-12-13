import { HudError } from '../mode/huderror';
import { IsValid, mergeArrays } from '../utils/amhc';
import { TSBaseItem } from './tsBaseItem';

/**装备共享 */
export class ItemShare {
    /**共享组 */
    m_tabShare: {
        [nEntID: EntityIndex]: CDOTA_BaseNPC[];
    } = {};

    init() {
        GameRules.EventManager.Register('Event_ItemMove', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemMove(event), this, 10000);
        GameRules.EventManager.Register('Event_ItemAdd', (event: ItemAddedToInventoryFilterEvent) => this.onEvent_ItemAdd(event), this, -10000);
        GameRules.EventManager.Register(
            'Event_ItemDel',
            (event: { item: CDOTA_Item; entity: CDOTA_BaseNPC; nItemEntID: EntityIndex; nItemSlot: -1 | InventorySlot; sItemName: string }) =>
                this.onEvent_ItemDel(event),
            this,
            -10000
        );
        GameRules.EventManager.Register('Event_ItemSell', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemSell(event), this, 10000);
        GameRules.EventManager.Register('Event_ItemGive', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemGive(event), this, 10000);
        GameRules.EventManager.Register('Event_ItemLock', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemLock(event), this, 10000);
        GameRules.EventManager.Register('Event_ItemSplit', (event: ExecuteOrderFilterEvent) => this.onEvent_ItemSplit(event), this, -10000);
    }
    /**物品获得 */
    onEvent_ItemAdd(event: ItemAddedToInventoryFilterEvent) {
        print('===ItemShare===onEvent_ItemAdd===0');
        if (event['bIgnore'] || event['bIgnore_ItemShare']) return;
        if (event.item_parent_entindex_const == -1 || event.inventory_parent_entindex_const == -1) return;
        print('===ItemShare===onEvent_ItemAdd===1');
        print('===event:');
        DeepPrintTable(event);
        print('event.inventory_parent_entindex_const:', EntIndexToHScript(event.inventory_parent_entindex_const)?.GetName());
        print('event.item_entindex_const:', EntIndexToHScript(event.item_entindex_const)?.GetName());
        const tab = this.getShareTab(event.inventory_parent_entindex_const);
        if (!tab) return;
        print('===ItemShare===onEvent_ItemAdd===2');

        const entity = EntIndexToHScript(event.inventory_parent_entindex_const) as CDOTA_BaseNPC;

        // 有主单位，物品给主单位再同步共享
        if (entity['eShareOwner'] && !entity.IsNull() && entity != entity['eShareOwner']) {
            // print('===ItemShare===onEvent_ItemAdd===3');
            // const item = EntIndexToHScript(event.item_entindex_const) as CDOTA_Item;
            // if (item) {
            //     GameRules.EventManager.FireEvent('Event_ItemDel', {
            //         item: item,
            //         entity: entity,
            //         nItemEntID: item.GetEntityIndex(),
            //         nItemSlot: item.GetItemSlot(),
            //         sItemName: item.GetAbilityName(),
            //     });
            //     Timers.CreateTimer(() => {
            //         entity.DropItemAtPositionImmediate(item, Vector(-3000, -3000, -3000));
            //         entity['eShareOwner'].AddItem(item);
            //     });
            //     return;
            // }
            print('===ItemShare===onEvent_ItemAdd===4');
            Timers.CreateTimer(0.1, () => {
                for (const v of tab) {
                    if (v != entity && !v.IsNull()) {
                        GameRules.PlayerManager.getPlayer(entity.GetPlayerOwnerID()).syncItem(v);
                    }
                }
            });
        }else{
            print("error===ItemShare===onEvent_ItemAdd: BZ no eShareOwner")
        }
    }

    /**物品失去 */
    onEvent_ItemDel(event: { item: CDOTA_Item; entity: CDOTA_BaseNPC; nItemEntID: EntityIndex; nItemSlot: -1 | InventorySlot; sItemName: string }) {
        print('===ItemShare===onEvent_ItemDel===0');
        if (event['bIgnore_ItemShare']) return;
        print('===ItemShare===onEvent_ItemDel===1');

        const e = event.entity;
        if (!e || e.IsNull()) return;
        print('===ItemShare===onEvent_ItemDel===2');

        const tab = this.getShareTab(e.GetEntityIndex());
        if (!tab) return;
        print('===ItemShare===onEvent_ItemDel===3');

        Timers.CreateTimer(() => {
            print('===ItemShare===onEvent_ItemDel===tab:');
            tab.forEach(bz => {
                print(bz.GetPlayerOwnerID(), '===BZ.name:', bz.GetUnitName());
                if (bz != e && !bz.IsNull()) {
                    print('===ItemShare===onEvent_ItemDel===4');
                    GameRules.PlayerManager.getPlayer(e.GetPlayerOwnerID()).syncItem(bz);
                }
            });
        });
    }

    /**物品出售 */
    onEvent_ItemSell(event: ExecuteOrderFilterEvent) {
        if (event['bIgnore']) return;
        const entity = EntIndexToHScript(event.units['0']) as CDOTA_BaseNPC;
        if (!entity.IsRealHero()) {
            HudError.FireLocalizeError(entity.GetPlayerOwnerID(), 'Error_ItemOprt');
            event['bIgnore'] = true;
        }
    }

    /**物品给予 */
    onEvent_ItemGive(event: ExecuteOrderFilterEvent) {
        if (event['bIgnore'] || event['bIgnore_ItemShare']) return;
        const tab = this.getShareTab(event.units['0']);
        if (!tab) return;

        const target = EntIndexToHScript(event.entindex_target);
        const item = EntIndexToHScript(event.entindex_ability) as CDOTA_Item;
        const entity = EntIndexToHScript(event.units['0']) as CDOTA_BaseNPC;

        // 物品不能给共享单位
        for (const v of tab) {
            if (v == target) {
                event['bIgnore'] = true;
                break;
            }
        }
    }

    /**物品锁定 */
    onEvent_ItemLock(event: ExecuteOrderFilterEvent) {
        if (event['bIgnore']) return;
        const entity = EntIndexToHScript(event.units['0']) as CDOTA_BaseNPC;
        if (!entity.IsRealHero()) {
            HudError.FireLocalizeError(entity.GetPlayerOwnerID(), 'Error_ItemOprt');
            event['bIgnore'] = true;
        }
    }

    /**物品拆分 */
    onEvent_ItemSplit(event: ExecuteOrderFilterEvent) {
        if (event['bIgnore']) return;
        const entity = EntIndexToHScript(event.units['0']) as CDOTA_BaseNPC;
        if (!entity.IsRealHero()) {
            HudError.FireLocalizeError(entity.GetPlayerOwnerID(), 'Error_ItemOprt');
            event['bIgnore'] = true;
        }
    }

    /**物品移动 */
    onEvent_ItemMove(event: ExecuteOrderFilterEvent) {
        if (event['bIgnore']) return;
        const entity = EntIndexToHScript(event.units['0']) as CDOTA_BaseNPC;
        if (!entity.IsRealHero()) {
            HudError.FireLocalizeError(entity.GetPlayerOwnerID(), 'Error_ItemOprt');
            event['bIgnore'] = true;
        }
    }

    /**设置共享单位为主单位，主单位装备作为本源物品不能被同步 */
    setShareOwner(entity: CDOTA_BaseNPC_Hero) {
        entity['eShareOwner'] = entity;
        let tab = this.getShareTab(entity.GetEntityIndex());
        if (!tab) tab = [];

        for (const e of tab) {
            e['eShareOwner'] = entity;
        }
    }

    /**获取共享组 */
    getShareTab(nEntID: EntityIndex, bDel?: boolean) {
        const argEntID = nEntID;
        const ent = EntIndexToHScript(nEntID) as CDOTA_BaseNPC;
        if (!ent.IsRealHero()) nEntID = GameRules.PlayerManager.getPlayer(ent.GetPlayerOwnerID()).m_eHero.GetEntityIndex();
        if (!this.m_tabShare[nEntID]) this.m_tabShare[nEntID] = [];
        print('===getShareTab===argEntID:', argEntID);
        print('===getShareTab===nEntID:', nEntID);

        print('===getShareTab===tabShare.length:', this.m_tabShare[nEntID].length);
        if (this.m_tabShare[nEntID]) {
            this.m_tabShare[nEntID].forEach(entity => {
                if (!entity || entity.IsNull()) {
                    this.m_tabShare[nEntID].splice(this.m_tabShare[nEntID].indexOf(entity), 1);
                } else if (argEntID == entity.GetEntityIndex()) {
                    if (bDel) this.m_tabShare[nEntID].splice(this.m_tabShare[nEntID].indexOf(entity), 1);
                    return;
                }
            });
            return this.m_tabShare[nEntID];

            // for (let i = this.m_tabShare[nEntID].length - 1; i >= 0; i--) {
            //     const entity = this.m_tabShare[nEntID][i];
            //     if (!entity || entity.IsNull()) {
            //         print('===getShareTab===2');
            //         this.m_tabShare[nEntID].splice(i, 1);
            //     } else if (argEntID == entity.GetEntityIndex()) {
            //         print('===getShareTab===3');
            //         bFound = true;
            //     }
            //     if (bFound) {
            //         if (bDel) this.m_tabShare[nEntID].splice(i, 1);
            //         if (!this.m_tabShare[nEntID]) this.m_tabShare[nEntID] = [];
            //         print('===getShareTab===4');
            //         return this.m_tabShare[nEntID];
            //     }
            // }
        }
    }

    /**设置共享关系 */
    setShareAdd(entity: CDOTA_BaseNPC, eOwner: CDOTA_BaseNPC_Hero) {
        if (entity['eShareOwner'] && eOwner['eShareOwner'] && entity['eShareOwner'] != eOwner['eShareOwner']) return; //存在共享主单位且不同

        const tab = this.getShareTab(eOwner.GetEntityIndex());
        if (!tab) print('===setShareAdd===tab is null');
        // 添加关系
        tab.push(entity);

        // 设置共享主单位
        entity['eShareOwner'] = eOwner;
        // for (const v of tab) {
        //     v['eShareOwner'] = entity['eShareOwner'];
        // }
    }

    /**移除共享关系 */
    setShareDel(entity: CDOTA_BaseNPC) {
        const tab = this.getShareTab(entity.GetEntityIndex(), true);
        if (tab) {
            for (const e of tab) {
                if (e == entity) this.m_tabShare[e.GetEntityIndex()].splice(this.m_tabShare[e.GetEntityIndex()].indexOf(e), 1);
            }
        }
    }

    /**锁定物品 */
    lockItem(item: CDOTA_Item) {
        if (!item || item.IsNull()) return;
        let itemState = item.IsCombineLocked();

        // const eventID = GameRules.EventManager.Register("Event_ItemLock", (event)=>{
        //     if(event.AbilityIndex == )
        // })

        if (itemState) item.SetCombineLocked(false);
        else item.SetCombineLocked(true);
    }
}
