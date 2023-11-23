import { GS_Move, GS_Supply, GS_DeathClearing, GS_Wait, PS_InPrison, PS_AtkHero, PS_Die } from '../mode/gamemessage';
import { HudError } from '../mode/huderror';
import { Player } from '../player/player';
import { IsValid } from '../utils/amhc';

export type CardInfo = {
    CardType: number;
    ManaCost: number;
    CastType: number;
    CardKind: number;
    ShopItemName?: string;
};

export class Card {
    /**卡牌ID */
    m_nID: number;
    /**拥有者ID */
    m_nOwnerID: PlayerID;
    /**魔法消耗 */
    m_nManaCost: number;
    /**基础魔法消耗 */
    m_nManaCostBase: number;

    /**释放错误信息 */
    m_strCastError: string;
    /**释放错误音效 */
    m_strCastErrorSound: string;

    /**卡牌类型 */
    m_typeCard: number;
    /**施法类型 */
    m_typeCast: number;
    /**卡牌种类 */
    m_typeKind: number;

    /**目标单位 */
    m_eTarget: CDOTA_BaseNPC;
    /**目标点 */
    m_vTargetPos: Vector;

    constructor(cardInfo: CardInfo, nPlayerID: PlayerID) {
        this.m_typeCard = tonumber(cardInfo.CardType);
        this.m_nID = GameRules.CardManager.getIncludeID();
        if (nPlayerID) {
            this.m_nOwnerID = nPlayerID;
            GameRules.CardManager.m_tGetCardCount[nPlayerID] = {
                ...(GameRules.CardManager.m_tGetCardCount[nPlayerID] || {}),
                [this.m_typeCard]: (GameRules.CardManager.m_tGetCardCount[nPlayerID]?.[this.m_typeCard] || 0) + 1,
            };
        }

        this.m_typeCast = tonumber(cardInfo.CastType);
        this.m_typeKind = tonumber(cardInfo.CardKind);
        this.m_nManaCost = tonumber(cardInfo.ManaCost);
        this.m_nManaCostBase = this.m_nManaCost;

        GameRules.CardManager.m_tabCards.push(this);

        print('===new Card Base===constructor Down:');
        DeepPrintTable(this);
        print('======================');
    }
    /**设置卡牌拥有者 */
    setOwner(playerID: PlayerID) {
        this.m_nOwnerID = playerID;
    }

    /**获取卡牌拥有者 */
    GetOwner(): Player {
        const player = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
        if (!player) return;
        return player;
    }

    /**选择目标单位时 */
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (!IsValid(target)) return UnitFilterResult.FAIL_CUSTOM;
        if (!this.CanUseCard(target)) return UnitFilterResult.FAIL_CUSTOM;
        this.m_eTarget = target;
        return UnitFilterResult.SUCCESS;
    }

    /**选择目标地点时 */
    CastFilterResultLocation(location: Vector): UnitFilterResult {
        if (!this.CanUseCard()) return UnitFilterResult.FAIL_CUSTOM;
        this.m_vTargetPos = location;
        return UnitFilterResult.SUCCESS;
    }

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        if (!this.CanUseCard()) return UnitFilterResult.FAIL_CUSTOM;
        return UnitFilterResult.SUCCESS;
    }

    /**发送错误消息 */
    onCastError() {
        if (this.m_strCastError != '') HudError.FireDefaultError(this.m_nOwnerID, this.m_strCastError);
        if (this.m_strCastErrorSound != '') {
            EmitSoundOnClient(this.m_strCastErrorSound, PlayerResource.GetPlayer(this.m_nOwnerID));
            this.m_strCastErrorSound = '';
        }
    }

    /**返回施法者 */
    GetCaster() {
        const player = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
        if (!player) return;
        return player.m_eHero;
    }

    /**返回目标单位 */
    GetCursorTarget() {
        return this.m_eTarget;
    }

    /**返回目标点 */
    GetCursorPosition() {
        return this.m_vTargetPos;
    }

    /**返回伤害类型 */
    GetAbilityDamageType() {
        return DamageTypes.MAGICAL;
    }

    /**返回消耗魔法 */
    GetManaCost() {
        let nManaCost = this.m_nManaCost;
        // 计算魔法减缩
        const player = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
        if (player) {
            nManaCost -= player.m_nManaSub;
            if (nManaCost < 0) nManaCost = 0;
        }
        return nManaCost;
    }

    /**
     * 通用判断卡牌施法
     */
    CanUseCard(eTarget?: CDOTA_BaseNPC): boolean {
        if (GameRules.GameConfig != null) {
            // 准备阶段不能施法
            if (GameRules.GameConfig.m_nRound == 0) {
                this.m_strCastError = 'AbilityError_Round0';
                return false;
            }
            // 非自己阶段不能施法
            if (!this.isCanCastOtherRound() && this.GetCaster().GetPlayerOwnerID() != GameRules.GameConfig.m_nOrderID) {
                this.m_strCastError = 'AbilityError_NotSelfRound';
                return false;
            }
            // 被沉默
            if (!this.isCanCastChenMo() && this.GetCaster().IsSilenced()) {
                this.m_strCastError = 'AbilityError_Silenced';
                this.m_strCastErrorSound = 'Custom.Silence.Ablt';
                return false;
            }
            // 移动阶段不能施法
            if (!this.isCanCastMove() && GameRules.GameConfig.m_typeState == GS_Move) {
                this.m_strCastError = 'AbilityError_Move';
                return false;
            }
            // 补给阶段不能施法
            if (!this.isCanCastSupply() && GameRules.GameConfig.m_typeState == GS_Supply) {
                this.m_strCastError = 'AbilityError_Supply';
                return false;
            }
            // 亡国阶段不能施法
            if (GameRules.GameConfig.m_typeState == GS_DeathClearing) {
                this.m_strCastError = 'AbilityError_DeathClearing';
                return false;
            }
            // 等待阶段不能施法
            if (GameRules.GameConfig.m_typeState == GS_Wait) {
                this.m_strCastError = 'AbilityError_Wait';
                return false;
            }

            // 验证施法玩家
            const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
            if (oPlayer != null) {
                // 在监狱不能施法
                if (!this.isCanCastInPrison() && (PS_InPrison & oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = 'AbilityError_InPrison';
                    return false;
                }
                // 在英雄攻击时不能施法
                if (!this.isCanCastHeroAtk() && (PS_AtkHero & oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = 'AbilityError_Battle';
                    return false;
                }
                // 亡国清算时不能施法
                if (oPlayer.m_bDeathClearing) {
                    this.m_strCastError = 'AbilityError_Die';
                    return false;
                }
            }
            // 没蓝不能施法
            if (this.GetManaCost() > this.GetCaster().GetMana()) {
                this.m_strCastError = 'AbilityError_NeedMana_Hero';
                return false;
            }

            // if (!this.isCanCastAtk() && oPlayer.m_bGCLD) {
            //     this.m_strCastError = "AbilityError_Battle"
            //     return false
            // }

            // 验证目标单位
            if (eTarget && !this.checkTarget(eTarget)) {
                return false;
            }
            return true;
        }
    }

    // 判断目标
    checkTarget(target: CDOTA_BaseNPC): boolean {
        if (!IsValid(target)) return false;
        // 对自己释放
        if (target == this.GetCaster() && !this.isCanCastSelf()) {
            this.m_strCastError = 'AbilityError_SelfCant';
            return false;
        }

        const oPlayer = GameRules.PlayerManager.getPlayer(target.GetPlayerOwnerID());
        if (oPlayer) {
            // 目标死亡
            if ((oPlayer.m_nPlayerState & PS_Die) > 0) {
                return false;
            }
            // 目标在监狱
            if (!this.isCanCastInPrisonTarget()) {
                if ((oPlayer.m_nPlayerState & PS_InPrison) > 0) {
                    this.m_strCastError = 'AbilityError_InPrison';
                    return false;
                }
            }
            // 目标在战斗
            if (!this.isCanCastBattleTarget()) {
                if (bit.band(PS_AtkHero, oPlayer.m_nPlayerState) > 0) {
                    this.m_strCastError = 'AbilityError_Battle';
                    return false;
                }
            }
        }

        // 目标是英雄
        if (target.IsHero()) {
            if (target.IsIllusion() && !this.isCanCastIllusion()) {
                // 不能是幻象
                this.m_strCastError = 'AbilityError_IllusionsCant';
                return false;
            } else if (!this.isCanCastHero()) {
                // 不能是英雄
                this.m_strCastError = 'AbilityError_HeroCant';
                return false;
            }
        } else if (!target.IsRealHero()) {
            // 兵卒
            if (!this.isCanCastBZ()) {
                this.m_strCastError = 'AbilityError_BZCant';
                return false;
            }
        } else if ((target as any).m_bMonster) {
            // 野怪
            if (!this.isCanCastMonster()) {
                // 需要玩家控制，不能是野怪
                this.m_strCastError = 'AbilityError_MonsterCant';
                return false;
            }
        } else if (target.GetModelName().includes('rune')) {
            // 神符
            if (!this.isCanCastRune()) {
                this.m_strCastError = 'AbilityError_RuneCant';
                return false;
            }
        } else {
            return false;
        }
        return true;
    }

    // 能否在其他玩家回合时释放
    isCanCastOtherRound() {
        return false;
    }
    isCanCastChenMo() {
        return false;
    }
    // 能否在移动时释放
    isCanCastMove() {
        return false;
    }
    // 能否在监狱时释放
    isCanCastInPrison() {
        return false;
    }
    // 能否在轮抽时释放
    isCanCastSupply() {
        return false;
    }
    // 能否在英雄攻击时释放
    isCanCastHeroAtk() {
        return false;
    }
    // 能否在该单位攻击时释放
    isCanCastAtk() {
        return false;
    }
    // 能否对自身释放
    isCanCastSelf() {
        return false;
    }
    // 能否对监狱中玩家释放
    isCanCastInPrisonTarget() {
        return false;
    } // 能否对战斗中玩家释放
    isCanCastBattleTarget() {
        return true;
    }
    // 能否对幻象释放
    isCanCastIllusion() {
        return false;
    }
    // 能否对英雄释放
    isCanCastHero() {
        return true;
    }
    // 能否对兵卒释放
    isCanCastBZ() {
        return true;
    }
    // 能否对野怪释放
    isCanCastMonster() {
        return false;
    }
    // 能否对神符释放
    isCanCastRune() {
        return false;
    }

    /**卡牌释放 */
    OnSpellStart() {}

    /**卡牌更新 */
    update() {
        const player = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
        if (!player) return;

        // 通知客户端更新卡牌数据
        player.sendMsg('GM_CardUpdata', {
            nPlayerID: this.m_nOwnerID,
            json: json.encode(this.encodeJsonData()),
        });
    }

    /**卡牌删除 */
    destory() {
        const player = GameRules.PlayerManager.getPlayer(this.m_nOwnerID);
        if (!player) return;
        player.setCardDel(this);

        for (const card of GameRules.CardManager.m_tabCards) {
            if (card == this) {
                GameRules.CardManager.m_tabCards.splice(GameRules.CardManager.m_tabCards.indexOf(card), 1);
            }
        }
    }

    encodeJsonData() {
        return {
            nCardID: this.m_nID,
            cardType: this.m_typeCard,
            cardKind: this.m_typeKind,
            castType: this.m_typeCast,
            nManaCost: this.GetManaCost(),
        };
    }
}
