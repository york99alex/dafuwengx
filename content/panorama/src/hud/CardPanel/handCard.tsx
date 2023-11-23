export type CardInfo = {
    nCardID: number; // 卡牌ID
    cardType: number; // 卡牌类型
    cardKind: number; // 卡牌种类
    castType: number; // 卡牌施法类型
    nManaCost: number; // 卡牌耗蓝
};

export class HandCard {
    nCardID: number; // 卡牌ID
    cardType: number; // 卡牌类型
    cardKind: number; // 卡牌种类
    castType: number; // 卡牌施法类型
    nManaCost: number; // 卡牌耗蓝
    constructor(cardinfo: CardInfo) {
        this.nCardID = cardinfo.nCardID;
        this.cardType = cardinfo.cardType;
        this.cardKind = cardinfo.cardKind;
        this.castType = cardinfo.castType;
        this.nManaCost = cardinfo.nManaCost;
    }
}
