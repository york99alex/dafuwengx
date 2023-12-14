export class EventManager {
    m_tabEvent: {
        [event: string]: {
            nID: number;
            funCallBack: Function;
            oBind: object;
            nOrder: number;
        }[];
    } = {};
    m_nIncludeID: number = 0;
    // Fire阻塞器
    m_tBlockFire: {
        [event: string]: any[];
    } = null;
    m_tabEventCount: {
        [eventID: number]: number;
    } = {};

    // nOrder
    private readonly EventOrder = {
        EVENT_LEVEL_NONE: 0,
        EVENT_LEVEL_LOW: 10000,
        EVENT_LEVEL_MEDIUM: 20000,
        EVENT_LEVEL_HIGH: 30000,
        EVENT_LEVEL_ULTRA: 40000,
    };

    /**
     * 注册事件
     * @param event 事件名
     * @param funCallBack 回调函数or函数名,回调返回true立即解注册
     * @param nOrder 优先顺序,数值越大触发回调越优先，默认/null为EVENT_LEVEL_NONE
     * @param nFireCount 可以Fire触发的次数,默认值为-1则可以无限触发
     * @param bindID 绑定ID 可选 可以指定以某值做ID
     */
    Register(event: string, funCallBack: Function, oBind?: object, nOrder?: number, nFireCount?: number, bindID?: number) {
        if (nOrder == null) nOrder = this.EventOrder.EVENT_LEVEL_NONE;
        if (nFireCount == null) nFireCount = -1;
        let tab = this.m_tabEvent[event];
        if (tab == null) {
            tab = [];
            this.m_tabEvent[event] = tab;
        }
        for (const v of tab) {
            if (funCallBack == v.funCallBack && oBind == v.oBind) {
                if (v.nOrder != nOrder) {
                    v.nOrder = nOrder;
                    // 升序排列
                    let sortedEvent = Object.values(tab).sort((a, b) => {
                        return a.nOrder - b.nOrder;
                    });
                    this.m_tabEvent[event] = sortedEvent;
                    sortedEvent = null;
                }
                this.m_tabEventCount[v.nID] = nFireCount;
                return v.nID;
            }
        }

        let nID: number;
        if (bindID == null) {
            nID = GameRules.EventManager.getInCludeID();
        } else {
            nID = bindID;
            GameRules.EventManager.UnRegisterByID(bindID, event);
        }
        // 初始化空数组
        if (!(event in this.m_tabEvent)) {
            this.m_tabEvent[event] = [];
        }
        this.m_tabEventCount[nID] = nFireCount;
        this.m_tabEvent[event].push({
            nID: nID,
            funCallBack: funCallBack,
            oBind: oBind,
            nOrder: nOrder,
        });
        // 升序排列
        let sortedEvent = Object.values(this.m_tabEvent[event]).sort((a, b) => {
            return a.nOrder - b.nOrder;
        });
        this.m_tabEvent[event] = sortedEvent;
        sortedEvent = null;
        return nID;
    }

    /**
     * 解注册
     * @param nID 注册ID
     * @param event 事件名 选填
     */
    UnRegisterByID(nID: number, event?: string) {
        if (event != null) {
            if (this.m_tabEvent[event] != null) {
                const eventInfo = this.m_tabEvent[event];
                if (!eventInfo) return;
                const index = eventInfo.findIndex(item => item.nID == nID);
                eventInfo.splice(index, 1);
                print('=====Event UnRegister==>nID:' + nID, 'event:', event);
                return true;
            }
        } else {
            for (const k in this.m_tabEvent) {
                const eventInfo = this.m_tabEvent[k];
                const index = eventInfo.findIndex(item => item.nID == nID);
                if (index == -1) continue;
                eventInfo.splice(index, 1);
                print('=====Event UnRegister==>nID:' + nID, 'event:', event);
                return true;
            }
        }
        print('=====Event UnRegister Failed==>nID:' + nID, 'event:', event);
        return false;
    }

    /**
     * 解注册
     * @param event 事件名
     * @param funCallBack 注册的函数
     */
    UnRegister(event: string, funCallBack: Function) {
        const eventInfo = this.m_tabEvent[event];
        if (eventInfo == null) return;
        const index = eventInfo.findIndex(item => item.funCallBack == funCallBack);
        if (index == -1) return;
        eventInfo.splice(index, 1);
        print('=====Event UnRegister==>name:' + event);
        return true;
    }

    /**
     * 解注册（批量）
     * @param tID 全部注册ID
     */
    UnRegisterByIDs(tID: number[]) {
        tID.forEach(value => GameRules.EventManager.UnRegisterByID(value));
    }

    /**
     * 触发事件
     * @param eventName
     */
    FireEvent(eventName: string, args?: any) {
        print('FireEvent==>eventName:' + eventName);
        // DeepPrintTable(args)
        if (this.m_tBlockFire) {
            // 存在阻塞则加入阻塞队列
            this.m_tBlockFire[eventName].push(args);
            return;
        }
        const eventInfo = this.m_tabEvent[eventName];
        if (eventInfo == null) return;
        // 拷贝事件 handlers
        let eventHandlers = eventInfo.map(obj => Object.assign({}, obj));
        // 升序排序
        eventHandlers.sort((a, b) => b.nOrder - a.nOrder);
        // 执行事件
        for (let event of eventHandlers) {
            let bDeleteHandler = false;
            // 获取函数句柄
            const handler = event.funCallBack;
            if (handler) {
                // 执行事件
                try {
                    bDeleteHandler = handler(args);
                    print('FireEvent Success==>eventName:' + eventName);
                } catch (err) {
                    print('FireEvent Error==>eventName:' + eventName);
                    error(err);
                }
            } else {
                bDeleteHandler = true;
            }
            // 执行完毕后释放
            if (bDeleteHandler) {
                const nFireCount = this.m_tabEventCount[event.nID];
                if (nFireCount != -1) {
                    if (nFireCount > 0) {
                        this.m_tabEventCount[event.nID]--;
                        GameRules.EventManager.UnRegisterByID(event.nID);
                    }
                }
            }
        }
    }

    /**阻塞事件Fire */
    BlockFireEvent() {
        this.m_tBlockFire ?? {};
    }

    /**释放事件并Fire */
    UnBlockFireEvent() {
        if (this.m_tBlockFire != null) {
            const table = this.m_tBlockFire;
            this.m_tBlockFire = null;
            for (const event in table) {
                GameRules.EventManager.FireEvent(event, table[event]);
            }
        }
    }

    private getInCludeID() {
        return ++this.m_nIncludeID;
    }
}
