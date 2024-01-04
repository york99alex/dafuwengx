export class GameRecord {
    static nIndex = 0

    static setGameRecord(typeRecord: number, nPlayerID: any, tabData: any) {
        print("setGameRecord>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
        const tab = {
            typeGameRecord: typeRecord,
            nPlayerID: nPlayerID,
            tabData: tabData,
            nTime: GameRules.GetDOTATime(false, true)
        }
        print("[GameRecord]>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
        print("nIndex:" + this.nIndex)
        DeepPrintTable(tab)
        print("[tab.tabData]>>>>>>>>>>>>>>>>>>>>")
        DeepPrintTable(tab.tabData)
        // TODO:设计通知客户端记录左侧面板
        CustomNetTables.SetTableValue("GamingTable", "game_record", tab)
        this.nIndex++
    }

    static encodeLocalize(val: any, tabKV: any) {
        if (tabKV) {
            let strKV = "";
            for (let k in tabKV) {
                const v = tabKV[k];
                strKV = strKV + `str=str.replace("${k}",${v});`;
            }
            return (
                `(function () {
              var str = ${"$"}.Localize('#${val}');
              ${strKV}
              return str;
          })()`
            );
        } else {
            return `${"$"}.Localize('#${val}')`;
        }
    }
}